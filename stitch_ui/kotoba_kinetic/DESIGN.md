# Design System Specification: Kinetic Sanctuary

## 1. Overview & Creative North Star
The evolution of this design system marks a shift from passive observation to active engagement. Our Creative North Star is **"The Kinetic Sanctuary."** 

We are moving away from the muted, sleepy tones of the past toward a high-energy, hyper-nature aesthetic. This system balances the stillness of a Zen garden with the raw, electric energy of spring’s first growth. To achieve a high-end editorial feel, we must reject the "templated" grid. Embrace **intentional asymmetry**: use wide margins, unexpected element placement, and dramatic typographic scales to create a layout that feels curated rather than generated. The goal is a UI that breathes, pulses, and feels alive.

## 2. Colors & Surface Philosophy
The palette is anchored by a high-vibrancy lime green, balanced against a soft, mint-tinted neutral base.

### The Color Logic
- **Primary (`#306800`) & Primary Container (`#7efc00`):** These are your "energy" tokens. Use them for high-intent actions and focal points.
- **Surface (`#deffe0`):** This is your canvas. It is not white; it is a tinted, "living" background that reduces eye strain while maintaining a fresh atmosphere.
- **Tertiary (`#00666d`):** Use this for secondary accents to provide a "cool" counterbalance to the heat of the lime green.

### The "No-Line" Rule
**Explicit Instruction:** Traditional 1px solid borders are strictly prohibited for sectioning or containment. 
Boundaries must be defined through **Tonal Transitions**. To separate a sidebar from a main feed, transition from `surface` to `surface-container-low`. To highlight a card, place a `surface-container-lowest` object on a `surface-container-high` background.

### The "Glass & Gradient" Rule
To elevate the design beyond a flat aesthetic, use **Glassmorphism** for floating elements (e.g., navigation bars or modals). 
- Use a semi-transparent `surface` color with a `backdrop-blur` of 20px–40px.
- Use **Signature Textures**: Apply a subtle linear gradient from `primary` to `primary_container` on large CTAs to give them a "liquid" depth that feels premium and tactile.

## 3. Typography
We utilize **Manrope** for its modern, geometric structure and high readability. The hierarchy must feel editorial—large, bold display types paired with generous tracking in labels.

- **Display (L/M/S):** Used for "hero" moments and section starts. These should be set with tight leading (1.1) to feel like a magazine header.
- **Headline (L/M/S):** Your primary navigational signposts.
- **Body (L/M/S):** Set at `body-lg` for primary content to maintain a premium, accessible feel. 
- **Label (M/S):** Used for metadata. Increase letter-spacing by 0.05rem for "Label" styles to ensure they feel intentional and distinct from body copy.

The typography is the architecture. Use `display-lg` (3.5rem) against `body-md` (0.875rem) to create a "Big/Small" contrast that signals high-end design.

## 4. Elevation & Depth
In this system, depth is a matter of light and stacking, not shadows and lines.

- **The Layering Principle:** Treat the UI as layers of fine paper. 
    - **Base Layer:** `surface`
    - **Section Layer:** `surface-container-low`
    - **Component Layer:** `surface-container-lowest` (this creates a soft "pop" of brightness)
- **Ambient Shadows:** Shadows should be used only for elements that "hover" over the entire interface (e.g., floating buttons). Use a blur of `xl` (48px+) and an opacity of 6% using a color derived from `on-surface` (`#0e361b`). Never use pure black shadows.
- **The Ghost Border Fallback:** If accessibility requires a stroke, use `outline-variant` at 15% opacity. It should feel like a suggestion of a border, not a boundary.

## 5. Components

### Buttons
- **Shape:** All buttons must use `rounded-full` (9999px).
- **Primary:** Background: `primary_container`, Text: `on_primary_container`. No shadow.
- **Secondary:** Background: `secondary_container`, Text: `on_secondary_container`.
- **States:** On hover, apply a subtle scale-up (1.02) rather than a dramatic color shift. This maintains the "Zen" flow.

### Cards & Containers
- **Construction:** Use `surface-container-high` for card backgrounds. 
- **Spacing:** Minimum padding of `lg` (2rem) for all containers. 
- **Rules:** No dividers. Use `1.5rem` to `3rem` of vertical whitespace to separate content groups.

### Inputs & Selection
- **Inputs:** Use a "flat-on-flat" approach. An input should be a `surface-container-highest` pill. On focus, the background shifts to `surface-container-lowest` with a 2px `primary` "Ghost Border."
- **Chips:** Always `rounded-full`. Use `tertiary_container` for selection chips to provide a visual break from the lime-green primary theme.

### Interactive Lists
- Forbid the use of horizontal divider lines. 
- Active state in a list should be indicated by a `surface-container-lowest` background shift and a small `primary` dot (4px) to the left of the text.

## 6. Do’s and Don’ts

### Do:
- **Do** use whitespace as a functional element. If a screen feels "busy," increase the padding; do not add lines.
- **Do** use the `primary` color sparingly for "pulses" of energy. It is an accent, not a background.
- **Do** align text and elements asymmetrically to create visual interest.

### Don’t:
- **Don’t** use a border-radius less than `1rem` unless it's for a tiny utility element. The "full-rounded" look is non-negotiable for the brand identity.
- **Don’t** use standard "drop shadows." If it doesn't feel like ambient light, it's too heavy.
- **Don’t** use high-contrast black text. Always use `on-surface` (`#0e361b`) to maintain the organic, fresh feel of the "Kinetic Sanctuary."