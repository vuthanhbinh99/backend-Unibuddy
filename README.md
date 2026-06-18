# UniBuddy Backend

Express + TypeScript backend using Clean Architecture and PostgreSQL via `pg`.

## Layers

- `presentation`: Express routes, controllers, request validation.
- `application`: use cases and repository/service ports.
- `domain`: entities, value objects, business rules.
- `infrastructure`: PostgreSQL repositories, JWT, bcrypt, external services.
- `shared`: cross-cutting code such as config, database, errors, middleware.

## Commands

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm run openapi:sync
```

`npm run dev` now keeps `openapi.yaml` in sync with the Express route tree during local development. If you only want to refresh the docs once, run `npm run openapi:sync`.

## Notes

- This project uses raw SQL through `pg`, no Prisma or ORM.
- PostgreSQL folds unquoted identifiers to lowercase. The SQL in repositories uses lowercase table and column names that match typical PostgreSQL DDL created from your database document.
- Keep business rules such as `BR-AUTH-01`, `BR-GROUP-01`, and `BR-SCH-01` in use cases/domain services, not controllers.
