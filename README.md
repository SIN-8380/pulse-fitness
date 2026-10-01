# PULSE Fitness — modular edition

## Run

Install Node.js 24 LTS from https://nodejs.org/ . Extract this folder, open a terminal beside package.json, then run:

```sh
npm install
npm run dev
```

Open the Local URL printed by Vite. Do not double-click index.html. Use Ctrl+C to stop the server. The asset-copy script runs automatically on installation, development startup, and builds.

```sh
npm test
npm run build
npm run preview
```

Deploy the contents of dist after building. Node dependencies and generated assets are intentionally excluded from this ZIP; npm install prepares them.

## Changes in this edition

- The workout close button uses the same background/border treatment as Profile and Settings close controls.
- The active routine title uses semibold text.
- Exercise illustrations are static first frames, with transparent backgrounds and light-theme visibility support.
- About & Help credits **L A W**, with a temporary portfolio link to https://example.com/ . Replace both placeholder URLs in index.html when your portfolio is ready.
- Removed the numeric conversion demo from Units & Language.
- Restored JSON file selection: the input is outside the settings loop so Vue keeps a single element ref.
- Backup restoration validates before changing data, supports older timed-exercise and history field names, saves all categories, and rolls back storage changes if a write fails. Importing an older backup preserves categories it did not contain.

## Where to debug

| File | Responsibility |
| --- | --- |
| src/main.js | Mount Vue and register components |
| src/app.js | Assemble the features and expose template bindings |
| src/features/state.js | Shared refs, defaults and configuration |
| src/features/catalog.js | Catalog search, filters, details and illustration selection |
| src/features/timer.js | Preparation, sets, rest, pause, sounds and screen-awake behavior |
| src/features/routines.js | Routine creation, editing, duplication and local sharing |
| src/features/profile.js | Profile fields, interests and avatar cropping |
| src/features/metrics.js | Statistics, chart data, achievements and timer presentation |
| src/features/settings.js | Display preferences, reminders and support actions |
| src/features/storage.js | File picker, export/restore, local persistence and reset |
| src/features/lifecycle.js | Startup, watchers, events and cleanup |
| src/utils/backup.js | Pure backup validation/migration and rollback helpers |
| src/components/ExerciseArt.js | Static transparent illustration component |
| src/components/Icon.js | SVG icon component and paths |
| src/style.css | Responsive layout and appearance |
| index.html | Screen markup and Vue bindings |
| tests/smoke.mjs | Timer, restore, catalog and template regression checks |

Features receive an explicit shared `ctx` object. Values such as `ctx.userProfile` are Vue refs; use `.value` in feature code. Function-local variables remain local. State is created first, actions and computed values next, and lifecycle hooks last. This keeps cross-feature dependencies visible without introducing globals or duplicating state. HTML and CSS remain in their own files; no backend was added.

## Use the exercise library

Open Library > Workouts, search or filter, and open an exercise for full-screen details. Add to Routine lets you choose an existing routine or create one. Save Routine commits your changes. In the routine editor, the illustration dropdown can attach/remove a catalog image. Existing custom exercises need an illustration selected before they display one during a workout. Foods is intentionally empty.

## Backups and browser data

Export a backup before changing server address or moving hosts; browser storage belongs to the current origin. Settings > Data & Backup > Select File imports an exported PULSE JSON file. Backups up to 20 MB are supported. Invalid files leave your current state unchanged. Keep backup files private because they can include your profile, avatar and workout history.

Online accounts and social visibility still require a server. The existing online controls are marked unavailable. Reminders require an open page; device/browser permissions affect audio, notifications and screen-awake support.

## Validation

Production build and regression checks pass. Tests cover modular initialization, timer pause/resume, catalog selection, file-picker invocation, legacy JSON migration, invalid/cancelled restore, export-format round trips, storage rollback and template compilation. Visual browser testing was unavailable in the build environment.

## Artwork

Package: @bryllim/workout-guide 1.0.0
Source: https://github.com/bryllim/workout-guide
Original artwork by Everkinetic, expanded by Bryl Lim. Visual assets are CC BY-SA 4.0; package code is MIT. Upstream asset notices are copied automatically into public/workout-assets. Artwork files are unmodified; CSS inversion provides visibility in light mode.

## Fitness Journey update

- `login.html` is a separate welcome/setup entry. First-time visitors are redirected here. Returning profiles can continue directly, or use Settings > Local Profile > Back to welcome. This is **local onboarding, not authenticated login**. A backend/auth provider is required for real multi-user accounts.
- Setup collects name and optional username, email, height (cm), weight (kg), sex, experience, goal, equipment and planned weekly training days. BMI is calculated, not manually entered. Edit these in Profile > Fitness Journey; backups preserve the answers.
- Fresh installs have no sample routines, personal details or exercise records. Existing browser data is retained. Personal records now use real history: most sets in a session, longest streak, and longest session.
- Library tabs have slightly larger labels/icons. Its close button matches Profile. Catalog count/footer copy is removed; credits remain in About and movement details.
- The active exercise title appears above a divided set/repetition row. Exercises without selected artwork center the timer, controls and details.
- Routine create/edit scrollbars are hidden; scrolling remains available. The profile share button wraps without compression.
- `src/components/FitnessForm.js` shares setup/edit UI; `src/utils/fitness.js` handles validation, BMI, persistence and backup-compatible data; `src/entry.js` mounts the welcome page.
- Your supplied logo is included in `public/logo.svg` and used in navigation, the welcome screen and the favicon.
- Additional tests cover setup persistence, optional fields, invalid inputs, BMI, backup round trips and failed-save rollback. Build and automated tests pass; visual browser verification remains unavailable.

## Grouped setup and dropdown update

The welcome form now has three steps: About You, Measurements and Training. Back keeps entered answers; Continue validates the current step; only the last step saves. Progress dots show the current step. Optional markers appear inside placeholders/select prompts; explanatory device-storage copy is removed from welcome. The profile editor retains its direct-edit layout.

All native selects share themed borders, arrows, focus styles and option colors. Browsers supporting customizable native selects also receive rounded popup panels and option highlights; other browsers use their accessible system picker. Metadata includes descriptions, author, theme color, Open Graph and Twitter summary fields; no deployment URL is invented.

## Profile image fix

Fixed the crop canvas context shadowing shared state, restored preview drawing and avatar saving, and added image read/decode error handling. Empty usernames display/edit as `sample`; existing usernames are retained. Removed the setup Back button. Crop drawing, zoom bounds, avatar persistence and username regression checks pass.

## Dropdown and responsive profile update

`src/components/StyledSelect.js` supplies shared rounded option panels for onboarding, Fitness Journey, the workout editor, library filters and settings. Panels use a thin themed scrollbar, keyboard selection, Escape/outside dismissal, and fixed placement to avoid editor clipping. The original Vue models and change handlers remain connected.

Settings sections start closed and reset when settings opens/closes. Name/username edits leave input mode on blur/Enter and show an eye-icon Confirm/Cancel dialog; only Confirm persists the value. Mobile custom workouts center the timer vertically with controls toward the bottom. Weekly activity totals/day labels, the routine share header and the exercise type selector have responsive spacing fixes. Movement guide uses semibold type.

Automated checks cover select keyboard/change behavior, placement, profile confirmation/cancellation and accordion reset. Production build passes. Visual browser verification was unavailable.

## Dropdown visibility and editing follow-up

Removed the broad label/span hiding rule that concealed all four fitness dropdowns. Compact Reps/Timed text and controls no longer inherit oversized text. The share description spans the full row beneath its title and compact action. Notices now expire after three seconds, replacing any prior expiry timer. Name/username inputs explicitly receive focus on opening so an outside click triggers blur and confirmation; Enter uses keydown to prevent duplicate handling.

Regression tests pass. A temporary jsdom check also mounted the real Vue components and verified all four dropdowns are visible/selectable and the focus → outside blur → confirm → save flow works. This is a DOM interaction check, not a visual browser review.
