# CLYRO Design System

## 1. Visual Identity & Mood
- **Brand Name**: CLYRO
- **Tagline**: Private Code Review ("A clearer view before the merge", "See what's hiding in the dark.")
- **Mood**: A calm dusk at the sea. Deep plum-black base, soft mauve-to-rose horizon glow, delicate stars, warm cream typography, and warm gold accents. Cinematic, private, quiet, and elegant.

## 2. Color Tokens
| Token | Hex / Value | Purpose |
| :--- | :--- | :--- |
| `--bg-primary` | `#120b1a` | Deep plum-black page background |
| `--bg-secondary` | `#190f24` | Elevated panel / sidebar background |
| `--bg-card` | `rgba(26, 17, 37, 0.76)` | Translucent glass panels with blur |
| `--bg-card-solid` | `#1d132b` | Solid fallback for cards |
| `--bg-input` | `#0f0816` | Dark plum input fields |
| `--border-color` | `rgba(201, 119, 127, 0.22)` | Subtle rose-lavender border |
| `--border-hover` | `rgba(201, 119, 127, 0.45)` | Interactive border state |
| `--text-primary` | `#f6e7dc` | Warm cream for display headlines & active text |
| `--text-secondary` | `#b8a5b8` | Soft mauve-grey for body copy, labels, and icons |
| `--text-muted` | `#7e6980` | Muted plum-grey for secondary captions & placeholders |
| `--accent-gold` | `#f0c98a` | Warm gold / amber for links, status dots, and badges |
| `--accent-rose` | `#c9777f` | Coral-rose primary gradient start |
| `--accent-mauve` | `#a26db0` | Mauve primary gradient midpoint |
| `--accent-violet` | `#8a63b5` | Violet primary gradient end |

## 3. Gradients & Shadows
- **Primary Gradient**: `linear-gradient(135deg, #c9777f 0%, #a26db0 52%, #8a63b5 100%)`
- **Primary Glow**: `0 4px 24px rgba(201, 119, 127, 0.32), 0 0 12px rgba(138, 99, 181, 0.24)`
- **Glass Blur**: `backdrop-filter: blur(16px)`

## 4. Harmonized Severity System
| Severity | Color Token | Hex | Badge Style |
| :--- | :--- | :--- | :--- |
| **Critical** | Rose-Red | `#f43f5e` | `bg-rose-500/15 text-rose-300 border-rose-500/30` |
| **High** | Amber-Orange | `#f97316` | `bg-orange-500/15 text-orange-300 border-orange-500/30` |
| **Medium** | Soft Gold | `#f0c98a` | `bg-amber-500/15 text-amber-300 border-amber-500/30` |
| **Low** | Lavender-Blue | `#a5b4fc` | `bg-indigo-500/15 text-indigo-300 border-indigo-500/30` |
| **Clean / Safe** | Sage Green | `#86efac` | `bg-emerald-500/15 text-emerald-300 border-emerald-500/30` |

## 5. Typography
- **Headlines & Display**: `Playfair Display`, `Merriweather`, Georgia, serif (Warm cream `#f6e7dc`)
- **Body & UI**: `Inter`, sans-serif (Soft mauve-grey `#b8a5b8`)
- **Code & Numbers**: `JetBrains Mono`, monospace

## 6. Motion & Transitions
- **Timing Function**: `cubic-bezier(0.22, 1, 0.36, 1)`
- **Duration**: `300ms` for micro-interactions, `150ms` for hovers
- **Properties Animated**: Only `transform` and `opacity`

