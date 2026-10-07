# CLAUDE.md

## Purpose
Landing page for "IT Parc", an internal IT asset management tool. It has a triage wizard (which
request type, what need, how urgent), a modules list, placeholder equipment cards and a support form.
Audience: employees who need to declare or find an IT asset.

## Layout
- `index.html`: the whole product. CSS in one `<style>`, one IIFE `<script>` at the bottom, no
  external requests, no CDN, no web fonts.
- `.claude/settings.local.json`: enables the `frontend-design` plugin.
- No build, package manager, tests, linter or git.

## Preview
Open `index.html` directly in a browser (file://). Check at 360px, 760px and 1080px widths, and
with `prefers-reduced-motion` on.

## Design rules
- Dark-only theme. Colors come from `:root` tokens: `--bg #0a0e13`, `--s1/--s2/--s3` surfaces,
  `--line/--line-hi` borders, `--text`, `--muted`, `--accent #2ee6d0` (teal) with `--accent-ink`
  and `--accent-dim`, status `--ok/--warn/--bad`. Never hard-code a hex value in a rule.
- Fonts are system stacks only: `--sans` for prose and headings (weight 650, tight tracking),
  `--mono` for labels, nav, data, footer and the `›` / `//` heading prefixes (the terminal look).
- Radius `--r` (10px) for cards, 8px for controls and inner boxes. Transitions use `--t`.
- Spacing: container `.wrap` is 1080px max with 16px side gutters. Sections use 52px vertical
  padding with a 1px `--line` top border. Touch targets are at least 46px high.
- Mobile-first. Breakpoints: `min-width: 760px` and `max-width: 400px`.
- Focus: global `:focus-visible` is a 2px `--accent` outline plus `--glow`. Fields and `.choice`
  buttons use the glow instead. Don't remove either.

## Content rules
- All copy is French (`lang="fr"`), addressing the reader with "vous", short sentences.
- Text in `[square brackets]` (`[À compléter]`, `[Site à compléter]`) is deliberate placeholder
  content. Leave it as is.
- No invented clients, testimonials, logos, statistics, asset IDs, sites or contact details.
  Equipment cards stay explicit placeholders.
- The page states that nothing is submitted or stored. Keep the copy true if behavior changes.

## Invariants (easy to break)
- Wizard `actions`, `typeHint`, `delays` keys must match the buttons' `data-value` and the urgency
  `<option value>`. `"Réseau"` displays as "Équipement réseau".
- The site options exist twice: `#site` (wizard) and `#office` (support form). Edit both.
- Render results with `textContent` and DOM nodes, never `innerHTML` with user input.
- Step changes move focus to the step `<legend tabindex="-1">` or to the result. Errors use
  `role="alert"` in `#e-<fieldId>`. The result is `aria-live`.

## Do
- Reuse existing classes (`.block`, `.choice`, `.tag`, `.note`) before adding new ones.
- Add a section by giving it an id and a nav link in the sticky `.bar`.
- Keep everything inline in the single file.

## Don't
- Don't add a framework, bundler, external font, image CDN or analytics.
- Don't add a light theme or a second accent color.
- Don't translate copy to English or fill in bracketed placeholders.
- Don't wire the form to a backend or storage without the user asking.
