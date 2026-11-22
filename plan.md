# ZeroMeta feature and visual upgrade plan

## Product direction

ZeroMeta will evolve from a functional metadata cleaner into a calm, evidence-led privacy workspace. The browser-only processing boundary remains unchanged: file bytes are read, transformed, compared, and downloaded in the client; no metadata-processing API, server upload, account, or database is introduced.

## Design system

- **Design movement:** editorial privacy lab — a dark graphite workspace with electric mint and warm amber evidence accents, generous rounded panels, thin data-grid rules, and restrained motion.
- **Core principles:** make privacy state legible; keep the primary action obvious; expose limitations beside evidence; use progressive disclosure for dense metadata; preserve calm on failure.
- **Color philosophy:** graphite and ink create trust and focus; mint means cleaned/verified; amber means preserved or review-needed; coral is reserved for failures and unsupported cases.
- **Layout paradigm:** a two-column desktop workspace with a left action rail and a right evidence rail; a single-column mobile flow with sticky action controls.
- **Signature elements:** a “local-only” boundary badge; numbered file status rows; evidence cards with risk chips and before/after counts.
- **Interaction philosophy:** every async operation has a visible state, a cancel/retry path where safe, and an explanation of what was or was not inspected.
- **Animation:** short opacity/translate transitions only; respect `prefers-reduced-motion`; no animation is required to understand the workflow.
- **Typography:** retain the local Avenir Next family; use tighter display headings, readable body copy, and tabular numerals for counts.
- **Brand essence:** a private, inspectable cleanup bench for people who share files and need evidence, not blanket promises. Personality: precise, calm, candid.
- **Brand voice:** “Clean locally. Check visibly.” and “Detected differences are evidence, not a universal guarantee.”
- **Wordmark/mark:** retain the ZeroMeta name and add a compact shield-plus-spark local-processing mark in the UI rather than introducing an unrelated logo.
- **Signature color:** electric mint `#55E6B5`, paired with graphite `#10161F` and amber `#F2B84B`.

## Implementation scope

1. **Metadata details viewer:** extend comparison fields with category, risk, explanation, and original/cleaned values; add collapsible grouped details for GPS/device/dates/software/document/container data.
2. **Privacy risk summary:** classify detected fields into high/medium/low review risk without claiming that a low score means anonymity; surface a clear “review visible content and filename” reminder.
3. **Workflow improvements:** add clipboard paste, directory selection where supported, progress and current-file messaging, cancel processing, retry failed files, and improved per-file error messages.
4. **Batch dashboard:** add aggregate counts, status filters, failed-file list, and a combined batch evidence summary while keeping the existing per-file comparison.
5. **Offline/PWA mode:** add an installable manifest/service worker for app shell assets and a truthful offline status; metadata processing remains local and unsupported formats remain rejected.
6. **Additional formats:** add safe, structure-specific support for OGG and TIFF first; add HEIC/HEIF and AVI only where the implementation can preserve content and validate bounds. Unsupported or ambiguous files fail safely.
7. **Exportable evidence report:** add a local print view and downloadable JSON evidence summary; never upload or export original file bytes as part of the report.
8. **Accessibility and UX:** improve labels, keyboard focus, live-region announcements, reduced-motion behavior, contrast, focus-visible styling, and clear recovery actions.
9. **Verification:** add unit-level pure-function coverage where practical, extend Playwright privacy fixtures for every new path, run lint, build, privacy regression tests, and targeted browser checks; fix failures before checkpointing.

## Boundaries

- Keep static export and no-server/no-database architecture.
- Preserve current supported formats and comparison semantics.
- Do not describe structural inspection as universal metadata removal.
- Do not silently add a format unless the cleaner, detector, browser decode/content preservation, and tests all agree.
- If a requested format cannot be implemented safely in this pass, show it as planned/unsupported rather than shipping a corrupting guess.
