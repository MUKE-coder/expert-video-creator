// Print and write each scene's global start frame (for SFX cues and voiceover offsets).
import {readFileSync, writeFileSync} from 'node:fs';
const v = JSON.parse(readFileSync('src/video.json', 'utf8'));
const fps = v.fps ?? 30, xf = v.transitionFrames ?? 12;
let t = 0;
const rows = v.scenes.map((s, i) => {
  const d = Math.round(s.duration * fps);
  const overlap = i && (s.transition ?? 'fade') !== 'none' ? xf : 0;
  t -= overlap;
  const r = {i: i + 1, kind: s.kind, id: s.id ?? `s${i + 1}`, start: t, end: t + d, durationFrames: d};
  t += d;
  return r;
});
writeFileSync('timing.json', JSON.stringify({fps, total: t, scenes: rows}, null, 2));
console.table(rows);
console.log(`total ${t} frames = ${(t / fps).toFixed(2)} s`);
