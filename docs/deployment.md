# Deployment

## Local build and preview

```bash
npm install
npm run build
npm run preview
```

`npm run build` writes static output to `dist/`. `npm run preview` serves that output locally with Vite.

## GitHub Pages project site

For a project site at `https://<user>.github.io/coinbook-pwa/`, build with the project base path:

```bash
npm run build:pages
```

This sets `VITE_BASE_PATH=/coinbook-pwa/`, which Vite uses for asset URLs and the PWA manifest `start_url`/`scope`.

Deploy with:

```bash
npm run deploy
```

`npm run deploy` runs `npm run build:pages` and publishes `dist/` with `gh-pages`.

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

After building for a subpath, inspect generated `dist/` HTML/manifest references for accidental root paths such as `/assets/...` or `/icons/...` when they should include `/coinbook-pwa/`. Root/custom-domain builds should use `/` paths.
