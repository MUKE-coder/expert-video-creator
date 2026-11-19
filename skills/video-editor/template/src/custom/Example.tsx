import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SANS, T} from '../lib/theme';
import {FadeUp} from '../components/ui';
import type {SceneProps} from '../scenes';

export const Example: React.FC<SceneProps> = (p) => (
  <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
    <FadeUp at={0} style={{fontFamily: SANS, fontSize: 96, fontWeight: 700, color: T.fg}}>{p.text ?? 'Custom scene'}</FadeUp>
  </AbsoluteFill>
);
