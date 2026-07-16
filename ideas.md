# Design Direction: Ultimate Tic Tac Toe

## Selected Approach: Dark Neon Tactical Arcade

**Theme Name:** Neon Grid Command

**Very Brief Intro:** A dark tactical arcade aesthetic — midnight navy atmosphere, luminous grid structure, HUD-like panels, and restrained electric accents. Feels like a command console for a strategic board game.

**Probability:** 0.07

---

## Chosen Approach (Full Spec)

**Design Movement:** Dark arcade HUD / tactical terminal — inspired by military command interfaces and neon arcade cabinets.

**Core Principles:**
1. Midnight navy background (#0f172a) as the immersive canvas — nothing competes with the board
2. Every UI element reads as a HUD panel, not a generic web card
3. Color discipline: cyan = X, coral = O, gold = active/decisive, white = structure
4. Typography is a brand signal — terminal/monospace for titles, compact for body

**Color Philosophy:**
- Background: #0f172a (deep midnight navy)
- X player: #38bdf8 (electric cyan) — precision, speed
- O player: #f87171 (coral red) — warmth, aggression
- Active state: #fbbf24 (warm gold) — decision, urgency
- Structure: #e2e8f0 (bright white) — grid lines, borders
- Muted: #475569 (slate) — inactive elements

**Layout Paradigm:** Full-screen canvas as the game world; React overlay as the HUD. The board IS the background — always visible, always present. Menu and HUD float over it as translucent panels.

**Signature Elements:**
1. Luminous grid lines with soft glow — the board radiates presence
2. Neon X and O symbols with colored glow shadows
3. Gold pulsing border on the active sub-board

**Interaction Philosophy:** Every click is a tactical decision. Feedback is immediate: piece appears with a spring animation, active board glows gold, opponent's required board is instantly highlighted.

**Animation:**
- Piece placement: spring/bounce scale-in (300ms, easeOutBack)
- Active board: subtle gold glow pulse
- Win announcement: fade-in overlay with gold text glow
- AI thinking: bouncing dots in coral

**Typography System:**
- Title: Space Mono / Courier New (monospace, bold, all-caps) — arcade terminal feel
- HUD labels: Rajdhani / system sans (compact, tracking-widest, uppercase)
- Body: system sans, small, muted

**Brand Essence:** The definitive browser version of Ultimate Tic Tac Toe — for players who want depth, not just luck.

**Brand Voice:** Terse, confident, tactical. "ULTIMATE TIC TAC TOE" not "Play the Ultimate Game of Tic Tac Toe". CTAs: "2 Players" / "vs AI" — no filler.

**Wordmark & Logo:** Bold ✕ and ○ symbols side by side, each in their player color with glow. "ULTIMATE" in white monospace above, "TIC TAC TOE" in gold below.

**Signature Brand Color:** #fbbf24 (warm gold) — the color of decision and active state.

## Style Decisions

- Visual direction: "Dark neon tactical arcade: midnight navy background, luminous grid structure, HUD-like panels, and restrained electric accents."
- Color roles: Cyan represents X, coral/pink represents O, warm yellow/gold represents active or decisive state, and no other accent colors should compete with these.
- Typography rule: Use Space Mono or Courier New for the title and key labels; body text stays clean and readable but remains compact and game-UI-like.
- Buttons feel like game-mode selectors: stronger contrast, HUD-native material treatment, not generic rounded CTAs.
