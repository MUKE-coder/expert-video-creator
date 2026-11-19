# Style presets

Discovery offers these; the asset-builder resolves the chosen one into
`.video/theme.json`, which the editor template reads. Every preset defines the
same token names, so scenes never hard-code colours.

| Token | mono (Vercel/Resend) | brand | playful | bold |
|---|---|---|---|---|
| `bg` | `#000000` | from captures (darkest dominant) | `#FFF8EE` | `#0B0B0F` |
| `fg` | `#EDEDED` | auto-contrast | `#1E1B18` | `#FFFFFF` |
| `muted` | `#8F8F8F` | 60 % fg | `#6B645C` | `#A3A3B2` |
| `border` | `#2A2A2A` | 12 % fg | `#E8DCCB` | `#262633` |
| `surface` | `#0A0A0A` | bg ± 4 % | `#FFFFFF` | `#14141C` |
| `accent` | `#FFFFFF` | brand primary | `#FF6B4A` | `#C6FF3D` |
| `fontSans` | Geist | brand font if open-licensed, else Geist | Bricolage Grotesque / Geist | Inter Tight / Geist |
| `fontMono` | Geist Mono | Geist Mono | Geist Mono | Geist Mono |
| `radius` | 14 | brand | 22 | 8 |
| backdrop | hairline grid + top glow | soft brand gradient | paper grain + blobs | huge type + noise |
| motion | calm fades, lift | calm | springy pops, bounce | fast cuts, slides |
| music mood | lofi / ambient | per brief | upbeat | driving |

**mono** is the default for developer tools: black, white, grey, Geist,
hairlines, one underline highlight per answer, colour only in code.

**brand** pulls primary/secondary colours from the captured screens
(`asset-builder/scripts/brand_colors.py`) and the logo from the site. Check
contrast before using a brand colour for text.

**custom**: the user gives colours/fonts/a reference video; write them into
`theme.json` with the same token names.
