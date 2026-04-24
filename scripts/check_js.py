"""Robust tokenizer-like check for JS files: strip strings/comments/regex
then count braces/parens/brackets."""
import os

BS = chr(92)  # backslash
SQ = chr(39)  # '
DQ = chr(34)  # "
BT = chr(96)  # `

REGEX_PRECEDES = set("(,;=?+-*/%!&|^<>~:[{")

def strip(text):
    out = []
    i = 0
    n = len(text)
    prev_tok = None
    while i < n:
        c = text[i]
        # line comment
        if c == '/' and i + 1 < n and text[i+1] == '/':
            while i < n and text[i] != '\n':
                i += 1
            continue
        # block comment
        if c == '/' and i + 1 < n and text[i+1] == '*':
            i += 2
            while i + 1 < n and not (text[i] == '*' and text[i+1] == '/'):
                i += 1
            i += 2
            continue
        # double-quoted string
        if c == DQ:
            out.append('""')
            i += 1
            while i < n and text[i] != DQ:
                if text[i] == BS and i + 1 < n:
                    i += 2
                else:
                    i += 1
            if i < n: i += 1
            continue
        # single-quoted string
        if c == SQ:
            out.append("''")
            i += 1
            while i < n and text[i] != SQ:
                if text[i] == BS and i + 1 < n:
                    i += 2
                else:
                    i += 1
            if i < n: i += 1
            continue
        # template literal — keep inner ${...} code, skip surrounding text
        if c == BT:
            out.append('``')
            i += 1
            depth = 0
            while i < n:
                ch = text[i]
                if depth == 0 and ch == BT:
                    i += 1
                    break
                if ch == BS and i + 1 < n:
                    i += 2
                    continue
                if ch == '$' and i + 1 < n and text[i+1] == '{':
                    depth += 1
                    i += 2
                    continue
                if depth > 0 and ch == '}':
                    depth -= 1
                    # still inside template
                if depth > 0:
                    out.append(ch)
                i += 1
            continue
        # regex literal
        if c == '/' and prev_tok in REGEX_PRECEDES:
            i += 1
            in_class = False
            while i < n:
                ch = text[i]
                if ch == BS and i + 1 < n:
                    i += 2
                    continue
                if ch == '[' and not in_class:
                    in_class = True
                elif ch == ']' and in_class:
                    in_class = False
                elif ch == '/' and not in_class:
                    i += 1
                    while i < n and text[i].isalpha():
                        i += 1
                    break
                elif ch == '\n':
                    break
                i += 1
            continue
        out.append(c)
        if not c.isspace():
            prev_tok = c
        i += 1
    return ''.join(out)

ROOT = os.path.join(os.path.dirname(__file__), '..', 'docs', 'js')
any_bad = False
for root, _, names in os.walk(ROOT):
    for n in sorted(names):
        if n.endswith('.js'):
            p = os.path.join(root, n)
            with open(p, encoding='utf-8') as f:
                src = f.read()
            clean = strip(src)
            b  = clean.count('{') - clean.count('}')
            pa = clean.count('(') - clean.count(')')
            bk = clean.count('[') - clean.count(']')
            ok = (b == 0 and pa == 0 and bk == 0)
            if not ok: any_bad = True
            status = 'OK' if ok else 'MISMATCH'
            rel = os.path.relpath(p, os.path.dirname(ROOT)).replace('\\', '/')
            print(f"{status:9} {rel}  braces={b} parens={pa} brackets={bk}")

print()
print('Result:', 'ALL OK' if not any_bad else 'SEE MISMATCHES ABOVE')
