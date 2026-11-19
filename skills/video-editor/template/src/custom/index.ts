import React from 'react';
import type {SceneProps} from '../scenes';
import {Example} from './Example';

/**
 * Register bespoke scenes here. In video.json: {"kind": "custom", "component": "Example", "duration": 4, ...props}
 * Use them only when no built-in kind fits; reuse components from ../components and helpers from ../lib.
 */
export const CUSTOM: Record<string, React.FC<SceneProps>> = {
  Example,
};
