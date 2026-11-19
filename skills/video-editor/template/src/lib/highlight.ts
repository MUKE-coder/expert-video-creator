import {T} from './theme';

export type Tok = [string, string]; // [text, color]

/** Shell: commands, flags, strings (field:type aware), operators, URLs, args. */
export const highlightShell = (cmd: string): Tok[] => {
  const S = T.syntax;
  const out: Tok[] = [];
  const re = /("[^"]*"|'[^']*')|(&&|\|\||\||;|>>?|<)|(\s+)|(--?[A-Za-z][\w-]*(?:=[^\s]*)?)|(#.*$)|([^\s"'|&;<>]+)/g;
  let expectCmd = true;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cmd))) {
    const [t, str, op, ws, flag, comment, word] = m;
    if (str) {
      const q = str[0];
      const inner = str.slice(1, -1);
      out.push([q, S.str]);
      if (/^[\w-]+:[\w:]+(,[\w-]+:[\w:]+)*$/.test(inner)) {
        inner.split(',').forEach((item, i) => {
          if (i) out.push([',​', T.muted]);
          const [k, ...rest] = item.split(':');
          out.push([k, S.str]);
          rest.forEach((r) => {
            out.push([':', T.muted]);
            out.push([r, S.type]);
          });
        });
      } else out.push([inner, S.str]);
      out.push([q, S.str]);
    } else if (op) {
      out.push([t, S.op]);
      expectCmd = true;
    } else if (ws) out.push([t, T.fg]);
    else if (flag) out.push([t, S.flag]);
    else if (comment) out.push([t, S.comment]);
    else if (word) {
      if (expectCmd && !/^[A-Z_]+=/.test(t)) {
        out.push([t, S.cmd]);
        expectCmd = false;
      } else if (/^https?:\/\//.test(t)) out.push([t, S.dir]);
      else out.push([t, T.fg]);
    }
  }
  return out;
};

const KW: Record<string, string[]> = {
  go: 'package import func type struct interface return if else for range go defer var const map chan select case switch default break continue nil true false'.split(' '),
  ts: 'import from export default const let var function return if else for of in while new class extends interface type async await try catch throw null undefined true false typeof as'.split(' '),
  py: 'import from def class return if elif else for in while with as try except raise None True False lambda async await yield pass'.split(' '),
  rust: 'fn let mut pub struct enum impl trait use mod return if else match for in while loop as Self self true false async await'.split(' '),
  sql: 'SELECT FROM WHERE INSERT INTO VALUES UPDATE SET DELETE CREATE TABLE PRIMARY KEY REFERENCES NOT NULL JOIN ON AND OR ORDER BY GROUP LIMIT'.split(' '),
  json: ['true', 'false', 'null'],
};
const BUILTIN_TYPES = new Set('string number boolean int int64 uint uint64 float64 bool byte error any void str dict list'.split(' '));

/** Small, dependable code highlighter for go / ts / tsx / js / py / rust / sql / json / yaml / sh. */
export const highlightCode = (line: string, lang: string): Tok[] => {
  const S = T.syntax;
  if (lang === 'sh' || lang === 'bash') return highlightShell(line);
  const l = lang === 'tsx' || lang === 'js' || lang === 'jsx' ? 'ts' : lang === 'yaml' || lang === 'yml' ? 'yaml' : lang;
  const kws = new Set(KW[l] ?? []);
  const out: Tok[] = [];
  const commentRe = l === 'py' || l === 'yaml' ? /#.*$/ : /\/\/.*$/;
  const re = new RegExp(
    `(${commentRe.source})|("(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*'|\`[^\`]*\`)|(\\b\\d+(?:\\.\\d+)?\\b)|([A-Za-z_][\\w]*)|(\\s+)|([^\\sA-Za-z_\\d"'\`]+)`,
    'g',
  );
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    const [t, comment, str, num, id, ws, punct] = m;
    if (comment) out.push([t, S.comment]);
    else if (str) {
      // JSON/YAML keys read as keys
      const after = line.slice(re.lastIndex).trimStart();
      out.push([t, (l === 'json' && after.startsWith(':')) ? S.cmd : S.str]);
    } else if (num) out.push([t, S.type]);
    else if (id) {
      const next = line.slice(re.lastIndex);
      if (kws.has(t) || (l === 'sql' && kws.has(t.toUpperCase()))) out.push([t, S.kw]);
      else if (l === 'yaml' && next.startsWith(':')) out.push([t, S.cmd]);
      else if (next.startsWith('(')) out.push([t, S.cmd]);
      else if (BUILTIN_TYPES.has(t) || /^[A-Z]/.test(t)) out.push([t, S.type]);
      else out.push([t, T.fg]);
    } else if (ws) out.push([t, T.fg]);
    else if (punct) out.push([t, T.muted]);
  }
  return out;
};

export const sliceToks = (toks: Tok[], n: number): Tok[] => {
  const res: Tok[] = [];
  let left = n;
  for (const [t, c] of toks) {
    if (left <= 0) break;
    res.push([t.slice(0, left), c]);
    left -= t.length;
  }
  return res;
};
