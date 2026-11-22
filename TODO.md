# ZeroMeta feature and visual upgrade

## Preserve the privacy model

- Keep all file reading, metadata removal, comparison, report generation, and downloads in the browser.
- Do not add a file-processing upload endpoint, account requirement, database, or server-side metadata transformation.
- Preserve the existing supported-format behavior, safe-failure behavior, comparison limitations, blog explanations, and static export.

## Metadata evidence

- Add grouped metadata details for before/after fields, including category, risk level, readable values, and a short explanation.
- Add a privacy-risk summary that distinguishes high-risk personal metadata from medium/low review items and explicitly avoids claiming anonymity.
- Keep “detected differences, not proof of complete removal” visible beside every evidence result.
- Add a local print view and downloadable JSON evidence summary without including original file bytes.

## Workflow and batch UX

- Support paste-from-clipboard where the browser exposes files, directory selection where supported, and the existing drag/drop/file-picker paths.
- Show queue progress, current file, completed/failed counts, and a safe cancel action during processing.
- Allow retry of failed files without reprocessing successful files.
- Add batch summary counts, status filters, failed-file explanations, and a combined evidence overview.
- Preserve the existing automatic single-file download and multi-file ZIP behavior.

## Format coverage

- Add OGG and TIFF only with structure-specific cleaners, detectors, content preservation checks, and regression fixtures.
- Add HEIC/HEIF and AVI only if safe browser-compatible parsing and validation are available; otherwise keep them clearly unsupported and document the reason.
- Update accepted-format labels, format coverage documentation, comparison limitations, and tests when coverage changes.

## Offline and accessibility

- Add an installable PWA app shell with a manifest and service worker appropriate for the static export.
- Report offline/online state truthfully; never imply that a first-load offline app can process a format whose parser is unavailable.
- Add semantic labels, keyboard navigation, visible focus, live-region announcements, reduced-motion support, and accessible error/retry actions.

## Visual redesign

- Apply the approved editorial privacy-lab theme: graphite surfaces, electric mint verified states, amber review states, coral errors, rounded evidence cards, data-grid separators, and progressive disclosure.
- Keep the main action prominent on desktop and mobile, with a two-column workspace on wide screens and a single-column flow on small screens.
- Preserve the existing navigation, blog, and how-it-works content while updating their visual treatment for the new theme.

## Verification and delivery

- Add or extend focused unit/browser tests for each new utility and user path.
- Run language diagnostics, lint, production build, privacy regression tests, and targeted browser checks.
- Fix every actionable failure before checkpointing.
- Fetch and integrate `origin/main`, commit intended files, push to `origin/main`, and confirm the checkpoint SHA and successful publication.
