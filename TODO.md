# Todo

## Add Google Drive sync

Add an optional Google Drive synchronization feature for Coinbook data.

### Initial scope notes

- Add Google sign-in and Drive authorization only after confirming the preferred Google API/auth approach.
- Store and sync the app snapshot data currently persisted locally, preserving the `coinbook_v1_state` shape and compatibility points.
- Prefer a user-owned Drive app data file or appDataFolder-style storage if it fits the PWA/auth constraints.
- Include clear sync states: signed out, syncing, synced, offline, conflict/error.
- Define conflict behavior before implementation, especially when local and Drive data both changed.
- Keep local IndexedDB persistence working as the offline source of truth.

### Open questions

- Should sync be automatic, manual, or both?
- Should Drive data replace local data on first sign-in, merge with local data, or ask the user?
- Should JSON export/import remain separate from Drive sync?
