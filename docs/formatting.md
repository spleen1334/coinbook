# Formatting and linting

This project uses Prettier for formatting and ESLint for JavaScript and JSX linting.

## Commands

- `npm run format`: format project files with Prettier.
- `npm run format:check`: check Prettier formatting without writing changes.
- `npm run lint`: run ESLint across the project.
- `npm run lint:fix`: run ESLint and apply automatic fixes where available.
- `npm run check`: run formatting checks, linting, and the production build.

## Conventions

- Use single quotes.
- Omit trailing commas.
- Keep lines within a 120 character print width where practical.
- Use semicolons.

Generated and dependency directories such as `node_modules`, `dist`, `coverage`, and `.slim` are ignored by formatting and linting tools.
