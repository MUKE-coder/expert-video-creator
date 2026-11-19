import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {SANS, T} from '../lib/theme';
import {useLayout} from '../lib/anim';
import data from '../captions.json';

type Page = {text: string; startMs: number; endMs: number; words: {text: string; startMs: number; endMs: number}[]};

/** Bottom-safe-area captions with the current word highlighted. Data: src/captions.json from video-voiceover. */
export const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const L = useLayout();
  const ms = (f / fps) * 1000;
  const pages = ((data as {pages?: Page[]}).pages ?? []) as Page[];
  const page = pages.find((p) => ms >= p.startMs - 60 && ms <= p.endMs + 250);
  if (!page) return null;
  return (
    <div style={{position: 'absolute', left: L.margin, right: L.margin, bottom: L.vertical ? L.safeBottom + 40 : 56, display: 'flex', justifyContent: 'center'}}>
      <div style={{fontFamily: SANS, fontWeight: 600, fontSize: L.fs(40, 52), lineHeight: 1.25, textAlign: 'center', background: 'rgba(0,0,0,0.72)', color: '#FFF', padding: '12px 26px', borderRadius: 14, letterSpacing: '-0.01em', maxWidth: L.contentW}}>
        {page.words.map((w, i) => (
          <span key={i} style={{color: ms >= w.startMs && ms <= w.endMs + 80 ? (T.accent.toUpperCase() === '#FFFFFF' ? '#FFE15C' : T.accent) : '#FFF'}}>
            {(i ? ' ' : '') + w.text}
          </span>
        ))}
      </div>
    </div>
  );
};
