import {staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import raw from '../theme.json';

export type Theme = {
  bg: string;
  fg: string;
  muted: string;
  dim: string;
  border: string;
  surface: string;
  surface2: string;
  accent: string;
  radius: number;
  fontSans: string;
  fontMono: string;
  backdrop: 'grid-glow' | 'glow' | 'blobs' | 'noise' | 'plain';
  motion: 'calm' | 'springy' | 'fast';
  dark: boolean;
  fontFiles?: {sans?: string; mono?: string};
  /** brand gradient for highlighted words, e.g. ["#0052E0", "#0070F3", "#00C2FF"]; underline highlight when absent */
  gradient?: string[];
  /** weight for headlines/answers (Geist looks right at 600; display faces like Onest at 800) */
  headlineWeight?: number;
  syntax: {cmd: string; flag: string; str: string; type: string; op: string; kw: string; comment: string; dir: string; ok: string};
};

const DEFAULT: Theme = {
  bg: '#000000',
  fg: '#EDEDED',
  muted: '#8F8F8F',
  dim: '#5E5E5E',
  border: '#2A2A2A',
  surface: '#0A0A0A',
  surface2: '#111111',
  accent: '#FFFFFF',
  radius: 14,
  fontSans: 'Geist',
  fontMono: 'Geist Mono',
  backdrop: 'grid-glow',
  motion: 'calm',
  dark: true,
  syntax: {cmd: '#52A8FF', flag: '#BF7AF0', str: '#62C073', type: '#F5A524', op: '#FF6166', kw: '#FF4D8D', comment: '#8F8F8F', dir: '#3DD6C9', ok: '#62C073'},
};

export const T: Theme = {...DEFAULT, ...(raw as Partial<Theme>), syntax: {...DEFAULT.syntax, ...((raw as Partial<Theme>).syntax ?? {})}};

loadFont({family: 'Geist', url: staticFile('fonts/Geist-Variable.woff2'), weight: '100 900'});
loadFont({family: 'Geist Mono', url: staticFile('fonts/GeistMono-Variable.woff2'), weight: '100 900'});
if (T.fontFiles?.sans) loadFont({family: T.fontSans, url: staticFile(T.fontFiles.sans), weight: '100 900'});
if (T.fontFiles?.mono) loadFont({family: T.fontMono, url: staticFile(T.fontFiles.mono), weight: '100 900'});

export const HW = T.headlineWeight ?? 600;
export const SANS = `"${T.fontSans}", Geist, sans-serif`;
export const MONO = `"${T.fontMono}", "Geist Mono", monospace`;
