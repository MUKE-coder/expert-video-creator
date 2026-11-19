import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {slide} from '@remotion/transitions/slide';
import {Backdrop} from './components/ui';
import {Captions} from './components/Captions';
import {SCENES} from './scenes';
import video from './video.json';

type Scene = {kind: string; duration: number; transition?: 'fade' | 'slide' | 'none'; [k: string]: unknown};
const V = video as unknown as {fps?: number; transitionFrames?: number; captions?: boolean; scenes: Scene[]};
const FPS = V.fps ?? 30;
const XF = V.transitionFrames ?? 12;

/** Slow push-in over each scene so long reading holds never look frozen. Set "drift": 0 on a scene to disable. */
const Drift: React.FC<{d: number; amount: number; children: React.ReactNode}> = ({d, amount, children}) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{scale: `${interpolate(f, [0, d], [1, 1 + amount])}`}}>{children}</AbsoluteFill>;
};

export const totalFrames = () =>
  V.scenes.reduce((t, s, i) => t + Math.round(s.duration * FPS) - (i && (s.transition ?? 'fade') !== 'none' ? XF : 0), 0);

export const Video: React.FC = () => (
  <AbsoluteFill>
    <Backdrop />
    <TransitionSeries>
      {V.scenes.flatMap((s, i) => {
        const C = SCENES[s.kind];
        if (!C) throw new Error(`unknown scene kind "${s.kind}" (scene ${i + 1})`);
        const d = Math.round(s.duration * FPS);
        const tr = s.transition ?? 'fade';
        return [
          ...(i && tr !== 'none'
            ? [
                <TransitionSeries.Transition
                  key={`t${i}`}
                  presentation={tr === 'slide' ? (slide({direction: 'from-right'}) as never) : (fade() as never)}
                  timing={linearTiming({durationInFrames: XF})}
                />,
              ]
            : []),
          <TransitionSeries.Sequence key={`s${i}`} name={`${i + 1} ${s.kind}`} durationInFrames={d}>
            <Drift d={d} amount={typeof s.drift === 'number' ? s.drift : 0.02}>
              <C {...s} durationFrames={d} />
            </Drift>
          </TransitionSeries.Sequence>,
        ];
      })}
    </TransitionSeries>
    {V.captions && <Captions />}
  </AbsoluteFill>
);
