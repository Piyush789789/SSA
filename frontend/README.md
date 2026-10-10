# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Tests

- **Unit + integration** (Vitest, no server needed): `npm test`
- **System / end-to-end** (Playwright, real browser). Never point these at the school's live backend: they create and reset data.
  1. Start a throw-away backend on port 8090 with an in-memory database (from `backend/`):
     `mvnw.cmd spring-boot:run -Dspring-boot.run.useTestClasspath=true "-Dspring-boot.run.arguments=--server.port=8090 --spring.datasource.url=jdbc:h2:mem:systest;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH;NON_KEYWORDS=DAY,VALUE --spring.datasource.username=sa --spring.datasource.password= --spring.jpa.hibernate.ddl-auto=create-drop --spring.config.import= --app.notify.push.enabled=false --app.cors.frontend-url=http://localhost:5190"`
  2. Build and serve the website against it:
     `set VITE_API_BASE_URL=http://localhost:8090/api && npx vite build --outDir systest-dist && npx vite preview --outDir systest-dist --port 5190`
  3. First time only: `npx playwright install chromium`. Then: `npx playwright test`
