import React from 'react';
import {useCurrentFrame} from 'remotion';
import {MONO, T} from '../lib/theme';
import {highlightShell, sliceToks, Tok} from '../lib/highlight';
import {Window} from './ui';

export type TermLine =
  | {kind: 'cmd'; text: string; at: number; dir: string; cps?: number; nextDir?: string}
  | {kind: 'out'; parts: Tok[]; at: number}
  | {kind: 'gap'; at: number};

/** Output line shorthand used in video.json: "✓ text", "+ path", "! warning" or plain text. */
export const outParts = (s: string): Tok[] => {
  const S = T.syntax;
  if (s.startsWith('✓ ')) return [['  ✓ ', S.ok], [s.slice(2), T.muted]];
  if (s.startsWith('+ ')) return [['  + ', S.ok], [s.slice(2), T.muted]];
  if (s.startsWith('! ')) return [['  ! ', S.type], [s.slice(2), T.muted]];
  if (s.startsWith('✗ ')) return [['  ✗ ', S.op], [s.slice(2), T.muted]];
  return [['  ' + s, T.muted]];
};

export const Terminal: React.FC<{lines: TermLine[]; width: number; height: number; title: string; fontSize?: number; idleDir?: string; prompt?: 'arrow' | 'dollar'}> = ({lines, width, height, title, fontSize = 30, idleDir = '~', prompt = 'arrow'}) => {
  const f = useCurrentFrame();
  const S = T.syntax;
  const blink = Math.floor(f / 15) % 2 === 0;
  const cursor = (on: boolean) => <span style={{display: 'inline-block', width: fontSize * 0.58, height: fontSize * 1.1, verticalAlign: 'text-bottom', background: on ? T.fg : 'transparent'}} />;
  const Prompt = ({dir}: {dir: string}) =>
    prompt === 'arrow' ? (
      <>
        <span style={{color: S.ok}}>➜ </span>
        <span style={{color: S.dir, fontWeight: 600}}>{dir}</span>
        <span> </span>
      </>
    ) : (
      <span style={{color: T.muted}}>$ </span>
    );

  let typingIdx = -1;
  lines.forEach((l, i) => {
    if (l.kind === 'cmd' && f >= l.at && (f - l.at) * (l.cps ?? 2.5) < l.text.length) typingIdx = i;
  });
  const visible = lines.filter((l) => f >= l.at);
  const lastCmd = [...visible].reverse().find((l) => l.kind === 'cmd') as Extract<TermLine, {kind: 'cmd'}> | undefined;

  // auto-scroll: keep the newest lines in view
  const lineH = fontSize * 1.6;
  const rows = visible.reduce((n, l) => n + (l.kind === 'cmd' ? Math.ceil((l.text.length + 16) / Math.floor((width - 80) / (fontSize * 0.6))) : l.kind === 'gap' ? 0.6 : 1), 1);
  const maxRows = Math.floor((height - 54 - 56) / lineH);
  const scroll = Math.max(0, rows - maxRows) * lineH;

  return (
    <Window title={title} width={width} height={height}>
      <div style={{padding: '28px 36px', fontFamily: MONO, fontSize, lineHeight: 1.6, color: T.fg, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', translate: `0 ${-scroll}px`}}>
        {visible.map((l, i) => {
          const idx = lines.indexOf(l);
          if (l.kind === 'gap') return <div key={i} style={{height: fontSize * 0.6}} />;
          if (l.kind === 'out')
            return (
              <div key={i}>
                {l.parts.map(([t, c], j) => (
                  <span key={j} style={{color: c}}>{t}</span>
                ))}
              </div>
            );
          const n = Math.max(0, Math.floor((f - l.at) * (l.cps ?? 2.5)));
          return (
            <div key={i}>
              <Prompt dir={l.dir} />
              {sliceToks(highlightShell(l.text), n).map(([t, c], j) => (
                <span key={j} style={{color: c}}>{t}</span>
              ))}
              {idx === typingIdx && cursor(true)}
            </div>
          );
        })}
        {typingIdx === -1 && (
          <div>
            <Prompt dir={lastCmd ? lastCmd.nextDir ?? lastCmd.dir : idleDir} />
            {cursor(blink)}
          </div>
        )}
      </div>
    </Window>
  );
};

/** Build a timed line list from simple {cmd, out[]} steps. */
export const scheduleLines = (
  steps: {cmd: string; dir?: string; nextDir?: string; out?: string[]; pause?: number; cps?: number}[],
  start: number,
  opts: {gap?: number; outDelay?: number; outStagger?: number; defaultDir?: string} = {},
): {lines: TermLine[]; end: number} => {
  const {gap = 14, outDelay = 8, outStagger = 4, defaultDir = '~'} = opts;
  const lines: TermLine[] = [];
  let t = start;
  let dir = defaultDir;
  for (const s of steps) {
    const cps = s.cps ?? (s.cmd.length > 70 ? 4 : s.cmd.length > 40 ? 3 : 2.5);
    const d = s.dir ?? dir;
    lines.push({kind: 'cmd', text: s.cmd, at: t, dir: d, cps, nextDir: s.nextDir});
    dir = s.nextDir ?? d;
    t += Math.ceil(s.cmd.length / cps) + outDelay;
    (s.out ?? []).forEach((o, i) => lines.push({kind: 'out', parts: outParts(o), at: t + i * outStagger}));
    t += (s.out?.length ?? 0) * outStagger + gap + (s.pause ?? 0);
  }
  return {lines, end: t};
};
