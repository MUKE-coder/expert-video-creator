import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {MONO, SANS, T} from '../lib/theme';
import {tween, useEnter, useLayout} from '../lib/anim';

const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

export const Backdrop: React.FC = () => {
  const f = useCurrentFrame();
  const line = rgba(T.fg, T.dark ? 0.04 : 0.06);
  return (
    <AbsoluteFill style={{background: T.bg}}>
      {(T.backdrop === 'grid-glow' || T.backdrop === 'glow') && (
        <>
          {T.backdrop === 'grid-glow' && (
            <AbsoluteFill
              style={{
                backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`,
                backgroundSize: '96px 96px',
                maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent 80%)',
              }}
            />
          )}
          <AbsoluteFill
            style={{
              background: `radial-gradient(ellipse 50% 35% at 50% 0%, ${
                T.accent.toUpperCase() === '#FFFFFF' || !T.dark ? rgba(T.fg, 0.1) : rgba(T.accent, 0.22)
              }, transparent 70%)`,
            }}
          />
        </>
      )}
      {T.backdrop === 'blobs' &&
        [0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 900,
              height: 900,
              borderRadius: '50%',
              filter: 'blur(120px)',
              opacity: 0.35,
              background: i === 1 ? T.accent : rgba(T.accent, 0.5),
              left: `${[-10, 55, 20][i] + Math.sin(f / 90 + i) * 3}%`,
              top: `${[-20, 40, 70][i] + Math.cos(f / 110 + i) * 3}%`,
            }}
          />
        ))}
      {T.backdrop === 'noise' && (
        <AbsoluteFill style={{opacity: 0.07, backgroundImage: `radial-gradient(${rgba(T.fg, 1)} 1px, transparent 1px)`, backgroundSize: '4px 4px', translate: `${random(Math.floor(f / 2)) * 4}px 0`}} />
      )}
    </AbsoluteFill>
  );
};

export const FadeUp: React.FC<{at: number; children: React.ReactNode; style?: React.CSSProperties; dist?: number}> = ({at, children, style, dist = 20}) => {
  const p = useEnter(at);
  return <div style={{opacity: Math.min(1, p), translate: `0 ${(1 - p) * dist}px`, ...style}}>{children}</div>;
};

/** Underline that draws in under a key phrase. */
export const Mark: React.FC<{at: number; children: React.ReactNode}> = ({at, children}) => {
  const f = useCurrentFrame();
  const w = tween(f, at, at + 14, 0, 100);
  const c = T.accent;
  return (
    <span style={{position: 'relative', display: 'inline-block', color: T.dark ? '#FFFFFF' : T.fg}}>
      {children}
      <span style={{position: 'absolute', left: 0, bottom: -6, height: 4, width: `${w}%`, background: c, borderRadius: 2}} />
    </span>
  );
};

export const Pill: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <span style={{fontFamily: MONO, fontSize: 26, color: T.fg, border: `1px solid ${T.border}`, background: T.surface, borderRadius: 999, padding: '12px 24px', whiteSpace: 'nowrap', ...style}}>
    {children}
  </span>
);

/** macOS-style window: terminal, editor, browser. Pass `bar` to replace the centred title. */
export const Window: React.FC<{title?: React.ReactNode; width: number; height?: number; children: React.ReactNode; bar?: React.ReactNode}> = ({title, width, height, children, bar}) => (
  <div
    style={{
      width,
      height,
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: T.radius,
      overflow: 'hidden',
      boxShadow: T.dark ? '0 0 0 1px rgba(255,255,255,0.03), 0 40px 120px rgba(0,0,0,0.8)' : '0 30px 80px rgba(0,0,0,0.12)',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <div style={{height: 54, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: `1px solid ${T.border}`, background: T.surface2, position: 'relative'}}>
      <div style={{display: 'flex', gap: 10, zIndex: 1}}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
          <div key={c} style={{width: 15, height: 15, borderRadius: 8, background: c}} />
        ))}
      </div>
      {bar ?? <div style={{position: 'absolute', left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontSize: 20, color: T.muted}}>{title}</div>}
    </div>
    <div style={{flex: 1, position: 'relative', overflow: 'hidden'}}>{children}</div>
  </div>
);

/**
 * Question lands centred, holds, then glides up and dims so content can appear below it.
 * Set liftAt to Infinity to keep it centred (a question-only beat).
 */
export const Question: React.FC<{n?: number | string; text: string; liftAt: number; liftTo?: number; endSize?: number}> = ({n, text, liftAt, liftTo, endSize}) => {
  const f = useCurrentFrame();
  const L = useLayout();
  // enters after the scene's crossfade (12 frames) is mostly done, so it never lands on the outgoing scene
  const enter = useEnter(8, 20);
  const lift = tween(f, liftAt, liftAt + 18);
  const big = L.fs(120, 96);
  const small = endSize ?? L.fs(60, 64);
  const top0 = L.H * 0.39 - big * 0.5;
  const top1 = liftTo ?? (L.vertical ? L.safeTop : 60);
  const g = interpolate(lift, [0, 1], [0, 1]);
  return (
    <div style={{position: 'absolute', left: L.margin, right: L.margin, top: interpolate(lift, [0, 1], [top0, top1]), display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: Math.min(1, enter), translate: `0 ${(1 - enter) * 24}px`}}>
      {n !== undefined && (
        <div style={{fontFamily: MONO, fontSize: L.fs(24, 28), color: T.muted, border: `1px solid ${T.border}`, borderRadius: 999, padding: '8px 18px', marginBottom: interpolate(lift, [0, 1], [30, 20]), letterSpacing: 1}}>
          {typeof n === 'number' ? `Q${n}` : n}
        </div>
      )}
      <div
        style={{
          fontFamily: SANS,
          fontWeight: 600,
          fontSize: interpolate(lift, [0, 1], [big, small]),
          letterSpacing: '-0.04em',
          color: g > 0.5 ? T.muted : T.fg,
          opacity: 1 - g * 0.15,
          textAlign: 'center',
          lineHeight: 1.08,
          textWrap: 'balance',
        } as React.CSSProperties}
      >
        {text}
      </div>
    </div>
  );
};

/** Headline with one highlighted phrase, plus an optional muted sub-line. */
export const Answer: React.FC<{at: number; top: number; text: string; highlight?: string; sub?: string; size?: number; children?: React.ReactNode}> = ({at, top, text, highlight, sub, size, children}) => {
  const L = useLayout();
  const parts = highlight && text.includes(highlight) ? text.split(highlight) : [text];
  return (
    <div style={{position: 'absolute', left: L.margin, right: L.margin, top, textAlign: 'center'}}>
      <FadeUp at={at} style={{fontFamily: SANS, fontWeight: 600, fontSize: size ?? L.fs(88, 76), letterSpacing: '-0.045em', color: T.fg, lineHeight: 1.12, textWrap: 'balance'} as React.CSSProperties}>
        {parts.length === 2 ? (
          <>
            {parts[0]}
            <Mark at={at + 16}>{highlight}</Mark>
            {parts[1]}
          </>
        ) : (
          text
        )}
      </FadeUp>
      {sub && (
        <FadeUp at={at + 14} style={{fontFamily: SANS, fontSize: L.fs(38, 44), color: T.muted, marginTop: 34, letterSpacing: '-0.01em', lineHeight: 1.3, textWrap: 'balance'} as React.CSSProperties}>
          {sub}
        </FadeUp>
      )}
      {children}
    </div>
  );
};

/** Animated pointer with a click ripple at `clickAt`. Coordinates are in the parent's px. */
export const Cursor: React.FC<{from: [number, number]; to: [number, number]; moveAt: number; clickAt?: number}> = ({from, to, moveAt, clickAt}) => {
  const f = useCurrentFrame();
  const p = tween(f, moveAt, moveAt + 22);
  const x = interpolate(p, [0, 1], [from[0], to[0]]);
  const y = interpolate(p, [0, 1], [from[1], to[1]]) - Math.sin(p * Math.PI) * 40;
  const c = clickAt !== undefined ? tween(f, clickAt, clickAt + 14) : 0;
  const press = clickAt !== undefined && f >= clickAt && f < clickAt + 5 ? 0.85 : 1;
  return (
    <div style={{position: 'absolute', left: x, top: y, pointerEvents: 'none', zIndex: 10}}>
      {c > 0 && c < 1 && <div style={{position: 'absolute', left: -30 * c, top: -30 * c, width: 60 * c, height: 60 * c, borderRadius: '50%', border: `3px solid ${T.accent}`, opacity: 1 - c}} />}
      <svg width="34" height="34" viewBox="0 0 24 24" style={{scale: `${press}`, transformOrigin: '0 0', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'}}>
        <path d="M4 2l16 9.5-7 1.5-3.5 6.5z" fill="#FFFFFF" stroke="#000" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    </div>
  );
};
