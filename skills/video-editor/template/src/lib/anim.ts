import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {T} from './theme';

export const ease = Easing.bezier(0.16, 1, 0.3, 1);
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** 0→1 between frames a and b with the house ease. */
export const tween = (f: number, a: number, b: number, from = 0, to = 1) =>
  interpolate(f, [a, b], [from, to], {...clamp, easing: ease});

/** Entrance progress honoring the theme's motion style. */
export const useEnter = (at: number, len = 16) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (T.motion === 'springy') return spring({frame: f - at, fps, config: {damping: 12, stiffness: 140}});
  if (T.motion === 'fast') return tween(f, at, at + Math.round(len * 0.6));
  return tween(f, at, at + len);
};

/** Layout helpers: everything is designed on a 1920×1080 grid and adapts for vertical/square. */
export const useLayout = () => {
  const {width: W, height: H} = useVideoConfig();
  const vertical = H > W * 1.2;
  const square = !vertical && H > W * 0.85;
  const margin = vertical ? 64 : square ? 80 : 160;
  const contentW = Math.min(W - margin * 2, vertical ? 1000 : 1640);
  /** pick a size: horizontal value, vertical value (defaults to horizontal) */
  const fs = (h: number, v?: number) => (vertical ? v ?? h : square ? Math.round((v ?? h) * 0.95) : h);
  // safe areas (platform UI on 9:16)
  const safeTop = vertical ? 200 : 60;
  const safeBottom = vertical ? 320 : 80;
  return {W, H, vertical, square, margin, contentW, fs, safeTop, safeBottom};
};
