// Copy Geist + Geist Mono variable fonts (OFL) into public/fonts so renders never need the network.
import {copyFileSync, existsSync, mkdirSync} from 'node:fs';
const dir = 'node_modules/geist/dist/fonts';
mkdirSync('public/fonts', {recursive: true});
for (const [src, dst] of [
  [`${dir}/geist-sans/Geist-Variable.woff2`, 'public/fonts/Geist-Variable.woff2'],
  [`${dir}/geist-mono/GeistMono-Variable.woff2`, 'public/fonts/GeistMono-Variable.woff2'],
]) {
  if (existsSync(src)) copyFileSync(src, dst);
  else console.warn('font not found:', src);
}
