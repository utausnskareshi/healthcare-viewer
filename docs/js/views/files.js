// File management view: import zip, list files, rename, delete, activate.
import { h, $, clear, toast, fmtBytes, fmtDateTime, confirmDialog, promptDialog, isiOS, isStandalone } from '../utils.js';
import { listFiles, deleteFile, updateFile } from '../db.js';
import { getActiveFile, setActiveFile } from '../prefs.js';

let currentWorker = null;

export async function renderFilesView(container, { onFileActivated } = {}) {
  clear(container);

  const files = await listFiles();
  const activeId = getActiveFile();

  // Install hint (iOS PWA)
  if (isiOS() && !isStandalone()) {
    container.appendChild(h('div', { class: 'card' },
      h('h2', null, 'ホーム画面に追加'),
      h('div', { class: 'hint' },
        'iPhone/iPadの場合、Safariで',
        h('span', null, ' 共有ボタン '),
        '→「ホーム画面に追加」でアプリとしてインストールできます。オフラインでも利用できます。'
      )
    ));
  }

  // Import card
  const importCard = h('div', { class: 'card' });
  importCard.appendChild(h('h2', null, 'ZIPファイルを読み込む'));
  importCard.appendChild(h('div', { class: 'muted', style: { marginBottom: '10px' } },
    'iPhoneのヘルスケアアプリで「すべてのヘルスケアデータを書き出す」を実行して得られたZIPファイルを選択してください。'
  ));

  // The native <input type="file"> is overlaid transparently across the
  // entire drop area. Tapping anywhere in the drop zone taps the input
  // directly — the most reliable approach inside an iOS PWA, where
  // .click()-style synthetic clicks on display:none inputs are unreliable.
  const input = h('input', {
    type: 'file',
    // Don't restrict by MIME — Files.app sometimes reports zips as
    // octet-stream and won't let users select them when accept is strict.
    accept: '*/*',
  });

  const drop = h('div', { class: 'drop' },
    h('div', { style: { fontSize: '30px', marginBottom: '6px' } }, '📦'),
    h('div', null, 'タップしてZIPファイルを選択'),
    h('div', { class: 'tiny', style: { marginTop: '4px' } }, 'またはここにファイルをドロップ'),
    input,   // overlaid via CSS (.drop > input[type=file])
  );

  const progress = h('div', { style: { marginTop: '12px', display: 'none' } });
  const progressBar = h('div', { class: 'progress' }, h('div', { class: 'bar' }));
  const progressText = h('div', { class: 'muted', style: { marginTop: '6px' } }, '');
  progress.appendChild(progressBar);
  progress.appendChild(progressText);

  importCard.appendChild(drop);
  importCard.appendChild(progress);

  const handleFile = async (file) => {
    if (!file) return;
    if (!/\.zip$/i.test(file.name)) {
      toast('ZIPファイルを選択してください');
      return;
    }
    const defaultName = file.name.replace(/\.zip$/i, '') + '（' + new Date().toLocaleDateString('ja-JP') + '）';
    const displayName = await promptDialog('ファイル名（アプリ内での表示名）', defaultName);
    if (!displayName) return;

    progress.style.display = 'block';
    progressBar.querySelector('.bar').style.width = '5%';
    progressText.textContent = '解凍と解析を開始しています…';
    drop.style.pointerEvents = 'none';
    drop.style.opacity = '0.6';

    await ingestFile(file, displayName, (msg) => {
      if (msg.type === 'progress') {
        let pct = 5;
        let text = '';
        if (msg.phase === 'unzip-start') { pct = 8; text = '解凍中…'; }
        else if (msg.phase === 'unzip') {
          const frac = msg.totalBytes ? (msg.bytesRead / msg.totalBytes) : 0;
          pct = 8 + Math.min(62, frac * 62);
          text = `解凍・解析中… 読込 ${fmtBytes(msg.bytesRead)}/${fmtBytes(msg.totalBytes)} / レコード ${msg.records?.toLocaleString('ja-JP') || 0}件`;
        } else if (msg.phase === 'parse') {
          pct = Math.min(85, 70 + (msg.records / 800000) * 15);
          text = `解析中… レコード ${msg.records.toLocaleString('ja-JP')}件`;
        } else if (msg.phase === 'parsed') { pct = 88; text = `解析完了（${msg.records.toLocaleString('ja-JP')}件）`; }
        else if (msg.phase === 'routes-start') { pct = 90; text = `ルート処理中…（${msg.routes}件）`; }
        else if (msg.phase === 'save-start') { pct = 95; text = `保存中…（日次 ${msg.daily} / 時次 ${msg.hourly}）`; }
        progressBar.querySelector('.bar').style.width = pct.toFixed(0) + '%';
        progressText.textContent = text;
      } else if (msg.type === 'done') {
        progressBar.querySelector('.bar').style.width = '100%';
        progressText.textContent = `完了：レコード ${msg.summary.records.toLocaleString('ja-JP')}件、ワークアウト ${msg.summary.workouts}件、ルート ${msg.summary.routes}件`;
        toast('読み込みが完了しました');
        setActiveFile(msg.fileId);
        setTimeout(() => {
          renderFilesView(container, { onFileActivated });
          onFileActivated?.(msg.fileId);
        }, 800);
      } else if (msg.type === 'error') {
        progressText.textContent = 'エラー: ' + msg.message;
        progressBar.querySelector('.bar').style.background = 'var(--c-danger)';
        drop.style.pointerEvents = '';
        drop.style.opacity = '';
        toast('読み込みに失敗しました');
      }
    });
  };

  input.addEventListener('change', () => {
    const f = input.files && input.files[0];
    // Reset so the same file can be selected again later.
    try { input.value = ''; } catch {}
    if (f) handleFile(f);
  });
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('hot'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('hot'));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('hot');
    const f = e.dataTransfer?.files?.[0];
    if (f) handleFile(f);
  });

  container.appendChild(importCard);

  // Saved files list
  const listCard = h('div', { class: 'card' });
  listCard.appendChild(h('h2', null, '読み込み済みファイル'));

  if (!files.length) {
    listCard.appendChild(h('div', { class: 'empty' },
      h('div', { class: 'big' }, '📂'),
      h('div', null, 'まだファイルがありません'),
      h('div', { class: 'tiny' }, 'ZIPファイルを読み込んでください')
    ));
  } else {
    const list = h('div', { class: 'list' });
    for (const f of files) {
      const isActive = f.id === activeId;
      const range = (f.rangeStart && f.rangeEnd)
        ? `${new Date(f.rangeStart).toLocaleDateString('ja-JP')} 〜 ${new Date(f.rangeEnd).toLocaleDateString('ja-JP')}`
        : '範囲不明';
      const counts = f.counts || {};
      const summary = [
        counts.records ? `レコード ${counts.records.toLocaleString('ja-JP')}件` : '',
        counts.workouts ? `ワークアウト ${counts.workouts}件` : '',
        counts.routes ? `ルート ${counts.routes}件` : '',
      ].filter(Boolean).join(' / ');

      const item = h('div', { class: 'list-item', style: { flexWrap: 'wrap' } },
        h('div', { class: 'ic' }, isActive ? '📌' : '📄'),
        h('div', { style: { flex: '1 1 auto', minWidth: 0 } },
          h('div', { class: 'ttl' }, f.name, isActive ? ' ' : '',
            isActive ? h('span', { class: 'badge active' }, '選択中') : null),
          h('div', { class: 'sub' }, range),
          summary ? h('div', { class: 'tiny' }, summary) : null,
          h('div', { class: 'tiny' }, '読込日時: ' + fmtDateTime(f.importedAt))
        ),
      );

      const actions = h('div', { class: 'row', style: { flex: '1 1 100%', marginTop: '8px', gap: '6px' } });
      if (!isActive) {
        actions.appendChild(h('button', {
          class: 'btn btn-primary',
          onclick: (e) => {
            e.stopPropagation();
            setActiveFile(f.id);
            toast('このファイルを選択しました');
            onFileActivated?.(f.id);
            renderFilesView(container, { onFileActivated });
          }
        }, '選択'));
      }
      actions.appendChild(h('button', {
        class: 'btn',
        onclick: async (e) => {
          e.stopPropagation();
          const newName = await promptDialog('新しい名前', f.name);
          if (!newName || newName === f.name) return;
          f.name = newName;
          await updateFile(f);
          renderFilesView(container, { onFileActivated });
        }
      }, '名前変更'));
      actions.appendChild(h('button', {
        class: 'btn btn-danger',
        onclick: async (e) => {
          e.stopPropagation();
          const ok = await confirmDialog(
            `<b>${escapeHtml(f.name)}</b> を削除します。<br>この操作は取り消せません。`,
            { okText: '削除', danger: true }
          );
          if (!ok) return;
          await deleteFile(f.id);
          if (activeId === f.id) setActiveFile(null);
          toast('削除しました');
          renderFilesView(container, { onFileActivated });
          onFileActivated?.(null);
        }
      }, '削除'));

      item.appendChild(actions);
      list.appendChild(item);
    }
    listCard.appendChild(list);
  }

  container.appendChild(listCard);

  // Storage info
  if ('storage' in navigator && navigator.storage.estimate) {
    const est = await navigator.storage.estimate();
    const usedMB = est.usage ? (est.usage / 1048576).toFixed(1) : '--';
    const quotaMB = est.quota ? (est.quota / 1048576).toFixed(0) : '--';
    container.appendChild(h('div', { class: 'tiny', style: { textAlign: 'center', padding: '10px' } },
      `ストレージ使用量: ${usedMB} MB / ${quotaMB} MB`
    ));
  }
}

async function ingestFile(file, displayName, onMsg) {
  if (currentWorker) {
    try { currentWorker.terminate(); } catch {}
    currentWorker = null;
  }
  return new Promise((resolve, reject) => {
    const w = new Worker('./js/worker.js');
    currentWorker = w;
    w.onmessage = (ev) => {
      onMsg(ev.data);
      if (ev.data.type === 'done') { w.terminate(); currentWorker = null; resolve(ev.data); }
      if (ev.data.type === 'error') { w.terminate(); currentWorker = null; reject(new Error(ev.data.message)); }
    };
    w.onerror = (e) => {
      onMsg({ type: 'error', message: e.message || 'ワーカーエラー' });
      w.terminate();
      currentWorker = null;
      reject(e);
    };
    w.postMessage({ type: 'ingest', file, name: displayName });
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
