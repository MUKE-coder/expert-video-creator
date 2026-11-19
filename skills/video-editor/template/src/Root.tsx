import React from 'react';
import {Composition} from 'remotion';
import {Video, totalFrames} from './Video';
import video from './video.json';

export const Root: React.FC = () => (
  <Composition
    id="Main"
    component={Video}
    durationInFrames={totalFrames()}
    fps={video.fps ?? 30}
    width={video.width ?? 1920}
    height={video.height ?? 1080}
  />
);
