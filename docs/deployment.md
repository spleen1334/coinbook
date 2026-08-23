# Deployment

## Local build and preview

```bash
npm install
npm run build
npm run preview
```

`npm run build` writes static output to `dist/`. `npm run preview` serves that output locally with Vite.

## GitHub Pages project site

For the project site at `https://spleen1334.github.io/coinbook/`, build with the project base path:

```bash
npm run build:pages
```

This sets `VITE_BASE_PATH=/coinbook/`, which Vite uses for asset URLs and the PWA manifest `start_url`/`scope`.

Deploy with:

```bash
npm run deploy
```

`npm run deploy` runs `npm run build:pages` and publishes `dist/` with `gh-pages`.

## Release checklist

Before deploying a release:

- Increment the version in `package.json` and `package-lock.json`.
- Add a dated entry to `CHANGELOG.md`.
- Switch to a clean, up-to-date `main` checkout before merging the release branch.
- Merge the release branch into `main`.
- Run `npm run check` on `main` before tagging.
- Create an annotated `vX.Y.Z` tag on the intended `main` merge commit.
- Push `main` and the tag.
- Check out that tag from `main` and only deploy to GitHub Pages from that checkout with `npm run deploy`.
- Smoke-test `https://spleen1334.github.io/coinbook/`, including service-worker cache and update behavior.

## Custom domain or root deploy

For a root deployment such as `https://example.com/`, use the default base path:

```bash
npm run build
```

If deploying to another subdirectory, set `VITE_BASE_PATH` to that path with leading and trailing slashes, for example `/apps/coinbook/`.

## PWA stale cache troubleshooting

The app uses a generated service worker with auto-update. If a deployed change appears missing:

- hard refresh the page
- close/reopen the installed PWA
- unregister the service worker in browser devtools
- clear site data/cache for the origin
- verify the browser is loading the expected deployed URL and base path

## Built-output checks

After building for a subpath, inspect generated `dist/` HTML/manifest references for accidental root paths such as `/assets/...` or `/icons/...` when they should include `/coinbook/`. Root/custom-domain builds should use `/` paths.
