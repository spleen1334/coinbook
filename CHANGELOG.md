# Changelog

All notable changes to this project are documented here.

## [1.3.2] - 2026-11-05

### Added

- Show a subtle app-version hint in Settings, sourced from the package version so it stays current with releases.

## [1.3.1] - 2026-11-05

### Fixed

- Preserve saves through localStorage when IndexedDB fails, recover the latest fallback snapshot, and warn when neither backend can save.
- Prevent imported category IDs such as `__proto__` and `constructor` from crashing ledger, chart, or category-picker models.
- Validate add/edit submissions before changing entries so amounts, notes, dates, and recurrence settings remain consistent after reload.
- Display the correct RUB and CNY symbols throughout string and parts formatting.
- Validate stored display settings and safely fill partial number-format preferences.

### Changed

- Share pure expense filtering and totals, and reuse cached view models during animation-only updates without changing ledger/search behavior.
- Update compatible runtime and development dependencies, including Vite and Vitest security fixes. Production dependency audit is clean; six low/moderate PWA/Workbox build-tool findings remain pending a verified upstream fix.
- Expand regression coverage for storage failures, imports, submission round trips, formatting, settings, and cache invalidation.

## [1.3.0] - 2026-09-20

### Added

- Add weekly, monthly, and yearly recurring expenses with a finite date range, monthly defaults, and a ledger marker.

### Changed

- Rename the ungrouped ledger sort control to Amount.

## [1.2.0] - 2026-09-20

### Added

- Add a single `npm run fix` command for routine lint and formatting repairs.
- Document the branch-to-release deployment flow and mobile-only product constraints for contributors.

### Changed

- Simplify small utility, animation, CSS, lint, and PWA verification internals without changing user behavior.
- Refresh repository documentation to match the current architecture, persistence flow, tests, and release history.

## [1.1.2] - 2026-09-20

### Fixed

- Hide the submit action while editing an expense memo.

## [1.1.1] - 2026-09-20

### Added

- Keep add-sheet fields visible above the mobile keyboard.

## [1.1.0] - 2026-08-23

### Added

- Chart total-spend color progression.
- Chart edge period navigation.

## [1.0.0]

### Added

- Initial release.
