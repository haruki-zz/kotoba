# Design System Document: The Serene Scholar

## 1. Overview & Creative North Star

### Creative North Star: "The Digital Zen Garden"
This design system rejects the cluttered, high-velocity aesthetic of traditional ed-tech. Instead, it embraces the "Digital Zen Garden"—a philosophy of high-end editorial layouts where negative space is as communicative as the content itself. By utilizing intentional asymmetry, breathing room, and a tactile "layered paper" approach, we transform a language-learning tool into a meditative, premium experience. 

This system moves beyond the "app" feel by utilizing high-contrast typography scales and removing structural noise (borders, dividers). The interface does not sit on the screen; it floats within a soft, atmospheric space.

---

### 2. Colors & Tonal Depth

The palette is now a vibrant blend of organic and energetic tones, anchored by a fresh primary green (`#468412`), a lively secondary orange (`#eb831b`), and an accent green (`#137d16`), all supported by a balanced neutral gray (`#959595`).

#### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders for sectioning or layout containment. 
Boundaries must be defined solely through:
- **Background Color Shifts:** Placing a `surface-container-low` object against a `surface` background.
- **Tonal Transitions:** Using whitespace and color blocks to dictate the end of a section.

#### Surface Hierarchy & Nesting
To achieve depth without structural rigidity, we treat the UI as a series of physical layers.
- **Base Layer:** `background` for the main canvas.
- **Content Sections:** `surface-container-low` for large layout blocks.
- **Interactive Cards:** `surface-container-lowest` to provide "lift."
- **Active States:** `primary-container` for subtle, high-end highlighting.

#### The "Glass & Gradient" Rule
To elevate the experience from "flat" to "bespoke," floating elements (like flashcard controls or navigation modals) should use **Glassmorphism**:
- **Fill:** `surface-container-lowest` at 80% opacity.
- **Effect:** 12px–20px Backdrop Blur.
- **Signature Texture:** Primary CTAs should utilize a subtle linear gradient from `primary` (`#468412`) to a slightly darker shade at a 135° angle to provide a velvet-like tactile quality.

---

### 3. Typography: Editorial Authority

We use a duo-font system to balance character with extreme legibility.

- **Display & Headlines (Manrope):** These are our "editorial anchors." Large, bold, and authoritative. Use `display-lg` for dashboard greetings and `headline-md` for section titles. The wider apertures of Manrope evoke a modern, open feel.
- **Body & Labels (Inter):** Reserved for high-density information like vocabulary definitions and API keys. 
- **The Breathing Rule:** Increase letter-spacing (tracking) by +0.02em for all `title` and `label` styles to enhance the premium, airy feel.

---

### 4. Elevation & Depth: Tonal Layering

Traditional shadows are too heavy for this system. We use "Ambient Light" principles.

- **The Layering Principle:** Depth is achieved by stacking. A `surface-container-lowest` card sitting on a `surface-container-low` section creates a natural "step" that the eye perceives as depth without needing a shadow.
- **Ambient Shadows:** When a card must float (e.g., during a study session), use an extra-diffused shadow:
  - **Blur:** 40px–60px.
  - **Opacity:** 4%–6%.
  - **Color:** Tinted with `on-surface` rather than pure black to keep the atmosphere light.
- **The Ghost Border Fallback:** If a boundary is absolutely required for accessibility, use the "Ghost Border": the `outline-variant` token at **15% opacity**. Never use 100% opaque lines.

---

### 5. Components

#### Buttons
- **Shape:** Moderately rounded (Corner `md`: 1.0rem / 16px).
- **Primary:** Gradient fill (Primary to Primary Dim), no border, white text.
- **Secondary:** `secondary-container` fill, `on-secondary-container` text.
- **Motion:** On hover, a subtle 2px vertical "lift" and a soft increase in shadow diffusion.

#### Dashboard Heatmap
- **Geometry:** Avoid sharp squares. Use `sm` (0.5rem) rounded squares.
- **Color Scale:** Transition from `surface-container-highest` (zero activity) to `primary` (`#468412`) (high activity).
- **Layout:** Place the heatmap on a `surface-container-low` card with wide 40px internal padding.

#### Vocabulary Management List
- **Constraint:** No horizontal dividers.
- **Separation:** Use `body-md` for the term and `body-sm` (dimmed via `on-surface-variant`) for the definition.
- **Interaction:** On hover, the entire row background shifts to `surface-container-high` with a 12px corner radius.

#### Flashcard Study View
- **The Hero Card:** Use the `xl` (3rem) corner radius. 
- **Composition:** Center the Japanese character using `display-lg`. 
- **Depth:** Use the Ambient Shadow (60px blur, 5% opacity).
- **Progress:** A thin, `primary` colored bar at the top of the card, using a 100% rounded cap.

#### Input Fields (API Keys/Settings)
- **Style:** "Bottom-heavy" minimalist. A `surface-container-low` fill with a `md` corner radius.
- **States:** On focus, the background shifts to `surface-container-lowest` and a 2px "Ghost Border" of `primary` (`#468412`) at 40% opacity appears.

---

### 6. Do's and Don'ts

#### Do
- **Do** favor asymmetric layouts. For example, left-align a headline and right-align the heatmap to create visual "flow."
- **Do** use `surface-bright` for the most important interactive focal points.
- **Do** utilize fluid motion. Transitions between dashboard and study mode should feel like a camera lens refocusing, not a hard page jump.
- **Do** use generous whitespace (32px, 48px, 64px) to separate different functional groups.

#### Don't
- **Don't** use 1px dividers to separate list items; let the alignment and whitespace do the work.
- **Don't** use pure black (#000000) for text. Always use `on-surface` to maintain the soft, organic tone.
- **Don't** assume "super-rounded" (e.g., Corner `md`: 1.5rem / 24px) for everything; utilize the moderate rounding (2) as the default for components like buttons.
- **Don't** crowd the edges. Every component needs at least 24px of "breathing room" from the nearest container edge.