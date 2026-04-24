// Minimal IndexedDB wrapper for the Healthcare Viewer.
// Schema:
//   files:   { id (auto), name, importedAt, rangeStart, rangeEnd, meta }
//   daily:   keyPath [fileId, metric, day]      (day = 'YYYY-MM-DD')
//   hourly:  keyPath [fileId, metric, hour]     (hour = 'YYYY-MM-DDTHH')
//   workouts: keyPath [fileId, idx]
//   routes:  keyPath [fileId, workoutIdx]       (value: {points: [[lat,lon,t]]})

const DB_NAME = 'healthcare-viewer';
const DB_VERSION = 1;

let _dbp = null;

export function openDB() {
  if (_dbp) return _dbp;
  _dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = req.result;
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('daily')) {
        db.createObjectStore('daily', { keyPath: ['fileId', 'metric', 'day'] });
      }
      if (!db.objectStoreNames.contains('hourly')) {
        db.createObjectStore('hourly', { keyPath: ['fileId', 'metric', 'hour'] });
      }
      if (!db.objectStoreNames.contains('workouts')) {
        db.createObjectStore('workouts', { keyPath: ['fileId', 'idx'] });
      }
      if (!db.objectStoreNames.contains('routes')) {
        db.createObjectStore('routes', { keyPath: ['fileId', 'workoutIdx'] });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return _dbp;
}

function tx(stores, mode = 'readonly') {
  return openDB().then((db) => db.transaction(stores, mode));
}

function req2promise(r) {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

function txDone(t) {
  return new Promise((resolve, reject) => {
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

// ----- Files -----

export async function listFiles() {
  const t = await tx(['files']);
  return req2promise(t.objectStore('files').getAll());
}

export async function getFile(id) {
  const t = await tx(['files']);
  return req2promise(t.objectStore('files').get(id));
}

export async function addFile(meta) {
  const t = await tx(['files'], 'readwrite');
  const id = await req2promise(t.objectStore('files').add(meta));
  await txDone(t);
  return id;
}

export async function updateFile(file) {
  const t = await tx(['files'], 'readwrite');
  await req2promise(t.objectStore('files').put(file));
  await txDone(t);
}

export async function deleteFile(id) {
  const db = await openDB();
  // delete file row + all related entries
  const t = db.transaction(['files', 'daily', 'hourly', 'workouts', 'routes'], 'readwrite');
  t.objectStore('files').delete(id);
  for (const storeName of ['daily', 'hourly']) {
    const s = t.objectStore(storeName);
    const low  = [id, '', ''];
    const high = [id, '\uffff', '\uffff'];
    const range = IDBKeyRange.bound(low, high);
    s.delete(range);
  }
  for (const storeName of ['workouts', 'routes']) {
    const s = t.objectStore(storeName);
    const low  = [id, -Infinity];
    const high = [id, Infinity];
    const range = IDBKeyRange.bound(low, high);
    s.delete(range);
  }
  await txDone(t);
}

// ----- Bulk inserts (from worker) -----

export async function bulkPut(storeName, items) {
  if (!items || !items.length) return;
  const db = await openDB();
  const CHUNK = 2000;
  for (let i = 0; i < items.length; i += CHUNK) {
    const part = items.slice(i, i + CHUNK);
    const t = db.transaction([storeName], 'readwrite');
    const s = t.objectStore(storeName);
    for (const it of part) s.put(it);
    await txDone(t);
  }
}

// ----- Queries -----

export async function getDailyRange(fileId, metric, startDay, endDay) {
  const t = await tx(['daily']);
  const s = t.objectStore('daily');
  const range = IDBKeyRange.bound([fileId, metric, startDay], [fileId, metric, endDay]);
  return req2promise(s.getAll(range));
}

export async function getAllDaily(fileId, metric) {
  const t = await tx(['daily']);
  const s = t.objectStore('daily');
  const range = IDBKeyRange.bound([fileId, metric, ''], [fileId, metric, '\uffff']);
  return req2promise(s.getAll(range));
}

export async function getHourlyRange(fileId, metric, startHour, endHour) {
  const t = await tx(['hourly']);
  const s = t.objectStore('hourly');
  const range = IDBKeyRange.bound([fileId, metric, startHour], [fileId, metric, endHour]);
  return req2promise(s.getAll(range));
}

export async function getAllHourly(fileId, metric) {
  const t = await tx(['hourly']);
  const s = t.objectStore('hourly');
  const range = IDBKeyRange.bound([fileId, metric, ''], [fileId, metric, '\uffff']);
  return req2promise(s.getAll(range));
}

export async function listWorkouts(fileId) {
  const t = await tx(['workouts']);
  const s = t.objectStore('workouts');
  const range = IDBKeyRange.bound([fileId, -Infinity], [fileId, Infinity]);
  return req2promise(s.getAll(range));
}

export async function getRoute(fileId, workoutIdx) {
  const t = await tx(['routes']);
  return req2promise(t.objectStore('routes').get([fileId, workoutIdx]));
}

// Count entries (for storage overview)
export async function countAll() {
  const db = await openDB();
  const t = db.transaction(['files', 'daily', 'hourly', 'workouts', 'routes']);
  const out = {};
  for (const n of ['files', 'daily', 'hourly', 'workouts', 'routes']) {
    out[n] = await req2promise(t.objectStore(n).count());
  }
  return out;
}
