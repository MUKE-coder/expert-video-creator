import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {MONO, SANS, T} from '../lib/theme';
import {tween, useLayout} from '../lib/anim';
import {highlightCode, highlightShell} from '../lib/highlight';
import {Answer, Cursor, FadeUp, Pill, Question, Window} from '../components/ui';
import {Terminal, scheduleLines} from '../components/Terminal';
import manifestRaw from '../data/manifest.json';
import {CUSTOM} from '../custom';

export type SceneProps = Record<string, any> & {kind: string; durationFrames: number};

type Capture = {id: string; file: string; url?: string; w: number; h: number; scale?: number; focus?: {selector?: string; x: number; y: number; w: number; h: number}[]};
const manifest = manifestRaw as Capture[];
const findCapture = (id: string): Capture => {
  const c = manifest.find((m) => m.id === id || m.file === id);
  if (c) return c;
  return {id, file: id, w: 2880, h: 1800, scale: 2, focus: []};
};
const src = (file: string) => (/^https?:/.test(file) ? file : staticFile(file.includes('/') ? file : `captures/${file}`));

/** Header for content scenes: a lifting question if given, otherwise a small title. */
const Header: React.FC<{p: SceneProps; liftAt?: number}> = ({p, liftAt = 24}) => {
  const L = useLayout();
  if (p.question) return <Question n={p.n} text={p.question} liftAt={liftAt} liftTo={p.liftTo} endSize={L.fs(52, 60)} />;
  if (p.title)
    return (
      <FadeUp at={0} style={{position: 'absolute', left: L.margin, right: L.margin, top: L.vertical ? L.safeTop : 70, textAlign: 'center', fontFamily: SANS, fontWeight: 600, fontSize: L.fs(56, 64), letterSpacing: '-0.04em', color: T.fg}}>
        {p.title}
      </FadeUp>
    );
  return null;
};
const contentTop = (p: SceneProps, L: ReturnType<typeof useLayout>) => (p.question ? (L.vertical ? 430 : 250) : p.title ? (L.vertical ? 380 : 200) : L.vertical ? L.safeTop : 120);
/** Centre a block of height h in the space below the header (biased slightly upward). */
const centerTop = (p: SceneProps, L: ReturnType<typeof useLayout>, h: number) => {
  const t0 = contentTop(p, L);
  const avail = L.H - t0 - (L.vertical ? L.safeBottom : 70);
  return t0 + Math.max(0, (avail - h) * (L.vertical ? 0.3 : 0.45));
};
const Centered: React.FC<{top: number; children: React.ReactNode}> = ({top, children}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top, display: 'flex', justifyContent: 'center'}}>{children}</div>
);

/* ── question ─────────────────────────────────────────────── */
const QuestionScene: React.FC<SceneProps> = (p) => {
  const L = useLayout();
  const liftAt = p.liftAt ?? 30;
  const answerTop = L.vertical ? 700 : p.chips ? 480 : 530;
  return (
    <AbsoluteFill>
      <Question n={p.n} text={p.question} liftAt={p.answer ? liftAt : Infinity} liftTo={L.vertical ? 420 : 270} />
      {p.answer && (
        <Answer at={liftAt + 12} top={answerTop} text={p.answer} highlight={p.highlight} sub={p.sub}>
          {p.chips && (
            <div style={{display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginTop: L.vertical ? 70 : 56}}>
              {(p.chips as string[]).map((t, i) => (
                <FadeUp key={t} at={liftAt + 50 + i * 4} dist={12}>
                  <Pill style={{fontSize: L.fs(24, 30), color: T.muted}}>{t}</Pill>
                </FadeUp>
              ))}
            </div>
          )}
        </Answer>
      )}
    </AbsoluteFill>
  );
};

/* ── title ────────────────────────────────────────────────── */
const TitleScene: React.FC<SceneProps> = (p) => {
  const L = useLayout();
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', padding: L.margin}}>
      {p.logo && (
        <FadeUp at={0}>
          <Img src={staticFile(p.logo)} style={{height: L.fs(120, 140), marginBottom: 40}} />
        </FadeUp>
      )}
      <FadeUp at={4} style={{fontFamily: SANS, fontWeight: 700, fontSize: L.fs(150, 140), letterSpacing: '-0.06em', color: T.dark ? '#FFF' : T.fg, lineHeight: 1, textAlign: 'center'}}>
        {p.text ?? p.title}
      </FadeUp>
      {p.tagline && (
        <FadeUp at={14} style={{fontFamily: SANS, fontSize: L.fs(44, 48), color: T.muted, marginTop: 30, textAlign: 'center', textWrap: 'balance'} as React.CSSProperties}>
          {p.tagline}
        </FadeUp>
      )}
    </AbsoluteFill>
  );
};

/* ── terminal ─────────────────────────────────────────────── */
const TerminalScene: React.FC<SceneProps> = (p) => {
  const L = useLayout();
  const start = p.question ? 50 : 24;
  const {lines} = scheduleLines(p.steps ?? [], start, {defaultDir: p.dir ?? '~'});
  const fontSize = p.fontSize ?? L.fs(28, 30);
  const width = p.width ?? L.contentW;
  const perRow = Math.floor((width - 80) / (fontSize * 0.6));
  const rows = lines.reduce((n, l) => n + (l.kind === 'cmd' ? Math.ceil((l.text.length + 16) / perRow) : l.kind === 'gap' ? 0.6 : 1), 1.5);
  const maxH = L.H - contentTop(p, L) - (L.vertical ? L.safeBottom : 70);
  const height = Math.min(p.height ?? 9999, maxH, Math.max(L.vertical ? 700 : 420, 54 + 56 + rows * fontSize * 1.6 + fontSize));
  const top = centerTop(p, L, height);
  return (
    <AbsoluteFill>
      <Header p={p} />
      <Centered top={top}>
        <FadeUp at={p.question ? 36 : 6} dist={30}>
          <Terminal lines={lines} width={width} height={height} title={p.window ?? 'zsh'} fontSize={fontSize} idleDir={p.dir ?? '~'} prompt={p.prompt} />
        </FadeUp>
      </Centered>
    </AbsoluteFill>
  );
};

/* ── code ─────────────────────────────────────────────────── */
const CodeScene: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame();
  const L = useLayout();
  const lines: string[] = String(p.code).replace(/\t/g, '    ').split('\n');
  const width = p.width ?? L.contentW;
  const longest = Math.max(...lines.map((l) => l.length), 20);
  const fontSize = p.fontSize ?? Math.max(18, Math.min(L.fs(26, 30), Math.floor((width - 150) / (longest * 0.6))));
  const hl: number[] = p.highlight ?? [];
  const hlAt = p.highlightAt ?? 60 + lines.length * 2;
  const h = tween(f, hlAt, hlAt + 16);
  const first = p.firstLine ?? 1;
  const height = Math.min(54 + 52 + lines.length * fontSize * 1.65, L.H - contentTop(p, L) - (L.vertical ? L.safeBottom : 70));
  const top = centerTop(p, L, height);
  return (
    <AbsoluteFill>
      <Header p={p} />
      <Centered top={top}>
        <FadeUp at={p.question ? 34 : 6} dist={30}>
          <Window
            width={width}
            height={height}
            bar={
              <div style={{display: 'flex', marginLeft: 28, height: 54, alignItems: 'flex-end'}}>
                <div style={{fontFamily: MONO, fontSize: 20, color: T.fg, background: T.surface, border: `1px solid ${T.border}`, borderBottom: 'none', borderRadius: '10px 10px 0 0', padding: '12px 22px', marginBottom: -1, whiteSpace: 'nowrap'}}>
                  <span style={{color: T.syntax.cmd}}>● </span>
                  {p.file}
                </div>
              </div>
            }
          >
            <div style={{padding: '26px 0', fontFamily: MONO, fontSize, lineHeight: 1.65, whiteSpace: 'pre'}}>
              {lines.map((ln, i) => {
                const isHl = hl.includes(i + first);
                return (
                  <div key={i} style={{display: 'flex', opacity: tween(f, (p.question ? 40 : 10) + i * 2, (p.question ? 50 : 20) + i * 2), background: isHl ? `color-mix(in srgb, ${T.syntax.type} ${10 * h}%, transparent)` : undefined, boxShadow: isHl ? `inset 3px 0 0 color-mix(in srgb, ${T.syntax.type} ${100 * h}%, transparent)` : undefined}}>
                    <span style={{width: 80, flexShrink: 0, textAlign: 'right', paddingRight: 28, color: T.dim}}>{i + first}</span>
                    <span>
                      {highlightCode(ln, p.lang ?? 'ts').map(([t, c], j) => (
                        <span key={j} style={{color: c}}>{t}</span>
                      ))}
                    </span>
                  </div>
                );
              })}
            </div>
          </Window>
        </FadeUp>
      </Centered>
    </AbsoluteFill>
  );
};

/* ── screenshot (browser / phone frame, zoom to focus, highlight, callout, cursor) ── */
const Shot: React.FC<{cap: Capture; focusIdx?: number | string; maxW: number; maxH: number; at: number; zoom?: number; callout?: string; url?: string; device?: string; cursor?: boolean; label?: boolean}> = ({cap, focusIdx = 0, maxW, maxH, at, zoom, callout, url, device = 'browser', cursor, label = true}) => {
  const f = useCurrentFrame();
  const L = useLayout();
  const scale = cap.scale ?? 2;
  const vpW = cap.w / scale;
  const aspect = cap.w / cap.h;
  const chrome = device === 'none' ? 0 : device === 'phone' ? 0 : 54;
  // Vertical video + landscape capture: a tall window that crops around the focus (re-layout, not shrink).
  const cover = L.vertical && aspect > 1 && device !== 'phone';
  let w = Math.min(maxW, (maxH - chrome) * aspect);
  if (device === 'phone') w = Math.min(w, maxH * aspect);
  let h = w / aspect;
  let imgW = w;
  if (cover) {
    h = Math.min(maxH - chrome, w * 1.35);
    imgW = h * aspect;
  }
  const imgH = imgW / aspect;
  const k = imgW / vpW;
  const fb = typeof focusIdx === 'string' ? cap.focus?.find((b) => b.selector === focusIdx) : cap.focus?.[focusIdx];
  const fbox = fb ? {x: fb.x * k, y: fb.y * k, w: fb.w * k, h: fb.h * k} : null;
  // horizontal pan so the focus sits in the middle of the cropped window
  const panX = cover ? Math.min(0, Math.max(w - imgW, w / 2 - (fbox ? fbox.x + fbox.w / 2 : imgW / 2))) : 0;
  const box = fbox ? {...fbox, x: fbox.x + panX} : null;
  // auto-zoom: enough to make the focus read, never past 1.35× (captures blur and context is lost)
  const z0 = zoom ?? (box ? Math.min(1.35, Math.max(1.06, (w * 0.62) / Math.min(box.w, w))) : 1.04);
  const zp = tween(f, at + 10, at + 55);
  const z = interpolate(zp, [0, 1], [1, z0]);
  const ox = box ? box.x + box.w / 2 : w / 2;
  const oy = box ? box.y + box.h / 2 : h / 2;
  const hb = tween(f, at + 50, at + 64);
  const img = (
    <div style={{position: 'relative', width: w, height: h, overflow: 'hidden', background: T.surface}}>
      <div style={{position: 'absolute', inset: 0, scale: `${z}`, transformOrigin: `${ox}px ${oy}px`}}>
        <Img src={src(cap.file)} style={{width: imgW, height: imgH, display: 'block', position: 'absolute', left: panX, top: 0}} />
        {box && (
          <div style={{position: 'absolute', left: box.x - 6, top: box.y - 6, width: box.w + 12, height: box.h + 12, borderRadius: 10, border: `${3 / z}px solid ${T.accent}`, boxShadow: `0 0 0 ${2000}px rgba(0,0,0,${0.35 * hb})`, opacity: hb}} />
        )}
      </div>
      {cursor && box && <Cursor from={[w * 0.92, h * 0.95]} to={[ox, oy]} moveAt={at + 58} clickAt={at + 82} />}
    </div>
  );
  const framed =
    device === 'phone' ? (
      <div style={{padding: 14, background: '#111', borderRadius: 56, border: `2px solid ${T.border}`, boxShadow: '0 40px 120px rgba(0,0,0,0.7)'}}>
        <div style={{borderRadius: 44, overflow: 'hidden'}}>{img}</div>
      </div>
    ) : device === 'none' ? (
      <div style={{borderRadius: T.radius, overflow: 'hidden', border: `1px solid ${T.border}`}}>{img}</div>
    ) : (
      <Window
        width={w}
        bar={
          label ? (
            <div style={{position: 'absolute', left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
              <div style={{fontFamily: SANS, fontSize: 20, color: T.muted, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 0', width: Math.min(640, w * 0.5), textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden'}}>
                {url ?? cap.url ?? ''}
              </div>
            </div>
          ) : undefined
        }
      >
        {img}
      </Window>
    );
  // callout below the focus box; flips above it when there is no room below
  const below = oy + (box ? (box.h * z0) / 2 : 0) + 30;
  const above = oy - (box ? (box.h * z0) / 2 : 0) - 90;
  const callTop = (box ? (below + 70 < h ? below : Math.max(10, above)) : h - 90) + chrome;
  return (
    <div style={{position: 'relative'}}>
      {framed}
      {callout && (
        <div style={{position: 'absolute', left: 0, right: 0, top: callTop, display: 'flex', justifyContent: 'center', opacity: tween(f, at + 62, at + 76), translate: `0 ${(1 - tween(f, at + 62, at + 76)) * 10}px`}}>
          <Pill style={{background: T.dark ? '#FFF' : T.fg, color: T.bg, border: 'none', fontFamily: SANS, fontWeight: 600, fontSize: L.fs(26, 32), boxShadow: '0 10px 30px rgba(0,0,0,0.4)'}}>{callout}</Pill>
        </div>
      )}
    </div>
  );
};

const ScreenshotScene: React.FC<SceneProps> = (p) => {
  const L = useLayout();
  const top = contentTop(p, L);
  const cap = findCapture(p.capture);
  const maxH = L.H - top - (L.vertical ? L.safeBottom : 60);
  return (
    <AbsoluteFill>
      <Header p={p} />
      <Centered top={top}>
        <FadeUp at={p.question ? 34 : 4} dist={30}>
          <Shot cap={cap} focusIdx={p.focus} maxW={p.width ?? L.contentW} maxH={maxH} at={p.question ? 34 : 4} zoom={p.zoom} callout={p.callout} url={p.url} device={p.device} cursor={p.cursor} />
        </FadeUp>
      </Centered>
    </AbsoluteFill>
  );
};

/* ── flow: a short user journey across several captures ─────── */
const FlowScene: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame();
  const L = useLayout();
  const steps: {capture: string; focus?: number | string; label: string; callout?: string}[] = p.steps;
  const head = p.question ? 34 : 0;
  const per = Math.floor((p.durationFrames - head) / steps.length);
  const top = contentTop(p, L) + (L.vertical ? 90 : 80);
  const maxH = L.H - top - (L.vertical ? L.safeBottom : 50);
  return (
    <AbsoluteFill>
      <Header p={p} />
      <Centered top={top - (L.vertical ? 90 : 76)}>
        <div style={{display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center'}}>
          {steps.map((s, i) => {
            const active = f >= head + i * per;
            return (
              <React.Fragment key={i}>
                {i > 0 && <span style={{color: T.dim, fontFamily: MONO, fontSize: 22}}>→</span>}
                <Pill style={{fontSize: L.fs(22, 26), color: active ? T.fg : T.dim, borderColor: active ? T.muted : T.border, padding: '8px 18px'}}>
                  {i + 1} {s.label}
                </Pill>
              </React.Fragment>
            );
          })}
        </div>
      </Centered>
      {steps.map((s, i) => {
        const a = head + i * per;
        const o = i === 0 ? tween(f, a, a + 12) : tween(f, a - 6, a + 8);
        const out = i < steps.length - 1 ? 1 - tween(f, a + per - 6, a + per + 8) : 1;
        if (f < a - 8 || (i < steps.length - 1 && f > a + per + 10)) return null;
        return (
          <div key={i} style={{position: 'absolute', left: 0, right: 0, top, display: 'flex', justifyContent: 'center', opacity: Math.min(o, out)}}>
            <Shot cap={findCapture(s.capture)} focusIdx={s.focus} maxW={L.contentW} maxH={maxH} at={a - 6} zoom={s.focus === undefined ? 1.04 : undefined} callout={s.callout} device={p.device} cursor={s.focus !== undefined} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ── schema: tables with fields and drawn relations ──────────── */
const SchemaScene: React.FC<SceneProps> = (p) => {
  const f = useCurrentFrame();
  const L = useLayout();
  const tables: {name: string; fields: [string, string, boolean?][]}[] = p.tables;
  const rels: {from: string; to: string; label?: string}[] = p.relations ?? [];
  const tw = L.vertical ? 760 : 520;
  const headH = 64;
  const rowH = L.vertical ? 62 : 56;
  const top = contentTop(p, L) + (p.answer ? (L.vertical ? 170 : 150) : 20);
  const gapX = L.vertical ? 0 : Math.min(260, (L.W - tables.length * tw) / (tables.length + 1));
  const totalW = L.vertical ? tw : tables.length * tw + (tables.length - 1) * gapX;
  const pos = tables.map((t, i) => ({x: L.vertical ? (L.W - tw) / 2 : (L.W - totalW) / 2 + i * (tw + gapX), y: L.vertical ? top + tables.slice(0, i).reduce((s, tt) => s + headH + tt.fields.length * rowH + 140, 0) : top}));
  const anchor = (ref: string, side: 'l' | 'r') => {
    const [tn, fn] = ref.split('.');
    const ti = tables.findIndex((t) => t.name === tn);
    const fi = Math.max(0, tables[ti]?.fields.findIndex((x) => x[0] === fn) ?? 0);
    return {x: pos[ti].x + (side === 'r' ? tw : 0), y: pos[ti].y + headH + fi * rowH + rowH / 2, ti};
  };
  const drawAt = p.drawAt ?? 96;
  const draw = tween(f, drawAt, drawAt + 34);
  return (
    <AbsoluteFill>
      <Header p={p} liftAt={p.liftAt ?? 30} />
      {p.answer && <Answer at={42} top={contentTop(p, L) + 10} text={p.answer} highlight={p.highlight} size={L.fs(60, 64)} />}
      {tables.map((t, i) => (
        <div key={t.name} style={{position: 'absolute', left: pos[i].x, top: pos[i].y, width: tw}}>
          <FadeUp at={66 + i * 12} dist={24}>
            <div style={{background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius, overflow: 'hidden'}}>
              <div style={{height: headH, display: 'flex', alignItems: 'center', padding: '0 28px', background: T.surface2, borderBottom: `1px solid ${T.border}`, fontFamily: MONO, fontSize: L.fs(28, 32), color: T.dark ? '#FFF' : T.fg, fontWeight: 600}}>{t.name}</div>
              {t.fields.map(([k, ty, fk], j) => (
                <div key={k} style={{height: rowH, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', borderTop: j ? `1px solid ${T.border}` : 'none', fontFamily: MONO, fontSize: L.fs(24, 28), background: fk ? 'rgba(127,127,127,0.08)' : 'transparent'}}>
                  <span style={{color: T.fg}}>{k}</span>
                  <span style={{color: fk ? T.syntax.type : T.muted}}>{ty}</span>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      ))}
      <svg width={L.W} height={L.H} style={{position: 'absolute', inset: 0}}>
        {rels.map((r, i) => {
          const a0 = anchor(r.from, 'r');
          const b0 = anchor(r.to, 'l');
          let d: string;
          let mid: {x: number; y: number};
          if (L.vertical || a0.ti === b0.ti) {
            const a = anchor(r.from, 'r');
            const b = anchor(r.to, 'r');
            const bend = Math.max(a.x, b.x) + 90;
            d = `M ${a.x} ${a.y} C ${bend} ${a.y} ${bend} ${b.y} ${b.x} ${b.y}`;
            mid = {x: bend - 20, y: (a.y + b.y) / 2};
          } else {
            const leftToRight = pos[a0.ti].x < pos[b0.ti].x;
            const a = anchor(r.from, leftToRight ? 'r' : 'l');
            const b = anchor(r.to, leftToRight ? 'l' : 'r');
            const mx = (a.x + b.x) / 2;
            d = `M ${a.x} ${a.y} C ${mx} ${a.y} ${mx} ${b.y} ${b.x} ${b.y}`;
            mid = {x: mx, y: (a.y + b.y) / 2};
          }
          return (
            <g key={i}>
              <path d={d} fill="none" stroke={T.accent} strokeWidth={2.5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
              {r.label && (
                <foreignObject x={mid.x - 120} y={mid.y - 26} width={240} height={52} opacity={tween(f, drawAt + 24, drawAt + 40)}>
                  <div style={{display: 'flex', justifyContent: 'center'}}>
                    <Pill style={{fontSize: 22, background: T.bg}}>{r.label}</Pill>
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

/* ── bullets ──────────────────────────────────────────────── */
const BulletsScene: React.FC<SceneProps> = (p) => {
  const L = useLayout();
  const top = centerTop(p, L, (p.items as unknown[]).length * (L.vertical ? 150 : 120));
  return (
    <AbsoluteFill>
      <Header p={p} />
      <div style={{position: 'absolute', top, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: L.fs(26, 34)}}>
        {(p.items as (string | {text: string; icon?: string})[]).map((it, i) => {
          const o = typeof it === 'string' ? {text: it} : it;
          return (
            <FadeUp key={i} at={(p.question ? 40 : 10) + i * 8} dist={14}>
              <div style={{display: 'flex', alignItems: 'center', gap: 26, width: Math.min(L.contentW, 1200), background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: L.vertical ? '32px 36px' : '26px 34px'}}>
                {o.icon ? (
                  <Img src={staticFile(`assets/icons/${o.icon}.svg`)} style={{width: 40, height: 40, filter: T.dark ? 'invert(1)' : undefined}} />
                ) : (
                  <span style={{fontFamily: MONO, fontSize: L.fs(24, 28), color: T.muted}}>0{i + 1}</span>
                )}
                <span style={{fontFamily: SANS, fontSize: L.fs(40, 44), color: T.fg, letterSpacing: '-0.02em', fontWeight: 500}}>{o.text}</span>
              </div>
            </FadeUp>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ── cheatsheet ───────────────────────────────────────────── */
const CheatsheetScene: React.FC<SceneProps> = (p) => {
  const L = useLayout();
  const rows: {cmd: string; note: string}[] = p.rows;
  const fs = L.fs(30, 30);
  const top = centerTop(p, L, 54 + 44 + rows.length * (L.vertical ? 100 : fs * 1.6 + 28));
  const cmdW = Math.max(...rows.map((r) => r.cmd.length)) * fs * 0.6 + 90;
  return (
    <AbsoluteFill>
      <Header p={p} liftAt={22} />
      <Centered top={top}>
        <FadeUp at={30} dist={30}>
          <Window width={p.width ?? Math.min(L.contentW, 1400)} title={p.window ?? 'cheatsheet'}>
            <div style={{padding: '22px 0'}}>
              {rows.map((r, i) => (
                <FadeUp key={r.cmd} at={38 + i * 5} dist={10}>
                  <div style={{display: L.vertical ? 'block' : 'flex', alignItems: 'center', padding: L.vertical ? '14px 36px' : '14px 44px', fontFamily: MONO, fontSize: fs, whiteSpace: 'pre'}}>
                    <span style={{display: 'inline-block', width: L.vertical ? undefined : cmdW}}>
                      {!r.cmd.startsWith('#') && <span style={{color: T.muted}}>$ </span>}
                      {highlightShell(r.cmd).map(([t, c], j) => (
                        <span key={j} style={{color: c}}>{t}</span>
                      ))}
                    </span>
                    <span style={{color: T.dim, display: L.vertical ? 'block' : undefined, fontSize: L.vertical ? 24 : undefined, marginTop: L.vertical ? 6 : 0}}># {r.note}</span>
                  </div>
                </FadeUp>
              ))}
            </div>
          </Window>
        </FadeUp>
      </Centered>
    </AbsoluteFill>
  );
};

/* ── outro ────────────────────────────────────────────────── */
const OutroScene: React.FC<SceneProps> = (p) => {
  const L = useLayout();
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', padding: L.margin}}>
      <FadeUp at={0} dist={10}>
        {p.logo ? (
          <Img src={staticFile(p.logo)} style={{height: L.fs(160, 180)}} />
        ) : (
          <div style={{fontFamily: SANS, fontWeight: 700, fontSize: L.fs(200, 180), letterSpacing: '-0.06em', color: T.dark ? '#FFF' : T.fg, lineHeight: 1, textAlign: 'center'}}>{p.title}</div>
        )}
      </FadeUp>
      {p.tagline && (
        <FadeUp at={8} style={{fontFamily: SANS, fontSize: L.fs(40, 46), color: T.fg, marginTop: 28, letterSpacing: '-0.02em', textAlign: 'center', textWrap: 'balance'} as React.CSSProperties}>
          {p.tagline}
        </FadeUp>
      )}
      {p.cta && (
        <FadeUp at={16} style={{marginTop: 54}}>
          <div style={{fontFamily: MONO, fontSize: L.fs(30, 26), background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: '20px 34px', whiteSpace: 'pre', maxWidth: L.contentW, overflow: 'hidden'}}>
            <span style={{color: T.muted}}>$ </span>
            {highlightShell(p.cta).map(([t, c], j) => (
              <span key={j} style={{color: c}}>{t}</span>
            ))}
          </div>
        </FadeUp>
      )}
      {p.url && (
        <FadeUp at={p.cta ? 26 : 18} style={{marginTop: p.cta ? 30 : 50}}>
          <Pill style={{fontSize: L.fs(26, 30), padding: '14px 30px'}}>{p.url}</Pill>
        </FadeUp>
      )}
    </AbsoluteFill>
  );
};

const CustomScene: React.FC<SceneProps> = (p) => {
  const C = CUSTOM[p.component];
  if (!C) throw new Error(`custom scene "${p.component}" is not registered in src/custom/index.ts`);
  return <C {...p} />;
};

export const SCENES: Record<string, React.FC<SceneProps>> = {
  question: QuestionScene,
  title: TitleScene,
  terminal: TerminalScene,
  code: CodeScene,
  screenshot: ScreenshotScene,
  flow: FlowScene,
  schema: SchemaScene,
  bullets: BulletsScene,
  cheatsheet: CheatsheetScene,
  outro: OutroScene,
  custom: CustomScene,
};
