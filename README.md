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
```

## Notes

- This project uses raw SQL through `pg`, no Prisma or ORM.
- PostgreSQL folds unquoted identifiers to lowercase. The SQL in repositories uses lowercase table and column names that match typical PostgreSQL DDL created from your database document.
- Keep business rules such as `BR-AUTH-01`, `BR-GROUP-01`, and `BR-SCH-01` in use cases/domain services, not controllers.
