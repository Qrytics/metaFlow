# Frontend design workflow (portable)

Portable version of the Claude Code `frontend-design` skill, for any agent working on `frontend/`.
Run all four passes on every build, improve, redesign, restyle or fix of the UI. Do not ask whether to.

metaFlow already has an established design system: `.interface-design/system.md` plus the `:root` tokens in
`frontend/src/styles.css`. Reuse it. Do not generate a new one unless the user asks for a new identity.

## Pass 0: find the existing system
Read `.interface-design/system.md`, `frontend/src/styles.css` (`:root`), and the shared components in
`frontend/src/pages/shared.tsx`. If a system exists, skip generating tokens and use only what it defines.

## Pass 1: design system (only when none exists)
Derive from the brand, then write as CSS variables before any component code:
- Color: one primary or ink, one accent used for meaning, a neutral ramp tinted toward the primary, semantic colors, surface/text/border roles. WCAG AA: 4.5:1 body, 3:1 large text and UI.
- Type: a font pairing and a named scale (1.2 to 1.25).
- Spacing: a 4px or 8px base and a scale. No off-scale values.
- Shape and depth: a radius scale with roles, ONE depth strategy (hairlines, shadows or tonal shifts, not a mix), motion durations and easings.
- Forbidden: framework default colors, purple-to-blue gradients, untinted pure gray everywhere.

## Pass 2: plan before code (Interface Design)
Write a short plan first:
- Who is the user, what must they do, how should it feel (in words that mean something).
- The one focal point of the view, and how it wins (size, weight, contrast or space).
- The component list, reusing existing components before making new ones.
- States for every interactive or data component: default, hover, focus-visible, active, disabled, loading, empty, error, success.
- Native HTML first. Keyboard order, 44px hit areas, `prefers-reduced-motion`, semantic markup.
- Before each component, state intent, hierarchy, palette, depth, surfaces, typography and spacing, each with a reason. If you cannot give the reason, you are defaulting.
Then implement with tokens only. No hardcoded colors or one-off pixel values.

## Pass 3: typography
- Use the type scale, with 5 or 6 sizes at most. Hierarchy from size, weight and color together, not size alone.
- Body 16 to 18px, line height about 1.45 to 1.6, measure about 62ch, never edge to edge.
- `text-wrap: balance` on headings, `pretty` on body. Tabular numerals on every figure. Tighter tracking on large display type.
- Left-align running text. One signal for emphasis. Links identifiable without relying on color alone.
- Accessibility outranks taste: text must survive 1.5x line height, 0.12em letter spacing and browser zoom without clipping.

## Pass 4: audit last, before showing the result
Fix everything that flags, then re-check:
- purple/blue gradients; gradient text for no reason
- a centered hero with three equal cards, then testimonials, then a CTA
- one border radius on everything
- identical spacing between every section; everything centered
- no focal point
- icon-in-colored-circle cards; emoji as icons
- default fonts with no pairing
- glass blur, glowing blobs, decorative orbs
- an eyebrow label above every heading; one colored word in a headline
- decorative status dots; middle-dot meta strings (use commas or line breaks); an arrow glued to link text
- side-stripe borders (a colored left border on a card)
- filler copy ("Unlock the power of...", "Seamless"); invented logos, quotes or numbers
- missing states; colors or spacing outside the tokens; low contrast
- swap test: if the product name changed and nothing else would, add one move that belongs to this product

If Node is available, also run the Claude Code Hallmark linter from this repo's frontend folder:
`node <path-to-hallmark>/scripts/sloplint.mjs src --scope app` (add `--render --url http://localhost:5173` for the rendered tier,
which needs puppeteer-core). Fix every FAIL. Fix or waive each REFLEX with a stated reason. Line 1 of `styles.css` carries the Hallmark stamp; keep it first.

## Always
Run `cd frontend && npm run build` (typecheck plus build) and fix errors. Do not touch `backend/` or the API calls. Keep all seven pages and routes.

## Report when done
- Which of the four passes ran (and whether the existing system was reused).
- What the audit caught and what you changed.
- Anything you could not verify (rendered lint, mobile layout, screenshots).
