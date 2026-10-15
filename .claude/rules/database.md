---
paths:
  - "container/**"
  - "mock_data/**"
  - "src/main/java/com/vivacon/entity/**"
  - "src/main/java/com/vivacon/dao/**"
  - "src/main/java/com/vivacon/repository/**"
  - "src/main/java/com/vivacon/common/relational_db/**"
  - "src/main/resources/application*.yml"
---

# Database (PostgreSQL 14 locally, 17 on Supabase)

## Sources of truth, in order

1. **JPA entities** in `entity/` (+ `entity/report/`): the live schema is produced by
   Hibernate `ddl-auto: update` / `generate-ddl: true` in both profiles.
2. `container/prepare/schema/schema.sql`: only **11** tables (`role`, `account`,
   `participant`, `following`, `liking`, `attachment`, `comment`, `conversation`,
   `message`, `post`, `setting`).
3. `container/prepare/functions/*.sql`: stored functions.
4. A `pg_dump` in `container/data/` (gitignored, may be absent on this machine).

The other 8 tables (`device_metadata`, `hashtag`, `hashtag_rel_post`, `notification`,
`account_report`, `post_report`, `comment_report`, `report_template`, per the Kiro notes)
exist only after the backend boots. Derive their exact names and columns from the entity
classes (`@Table`, `@Entity(name=...)`, inheritance strategy, `@JoinColumn`), not from
memory. `schema.sql` alone is **not** a complete schema: e.g.
`getLastestLoginLocationPerAccount()` fails on it because `device_metadata` is missing.

## Stored functions called by name from `dao/impl/`

`postQuantityStatisticInRecentMonths`, `postQuantityStatisticInQuarters`,
`postQuantityStatisticInYears`, `getTopPostInteraction`, `getTopNewestPost`,
`getTopTrendingHashTagInCertainTime`, `getTopAccountMostFollowers`,
`userQuantityStatisticInRecentMonths`, `userQuantityStatisticInQuarters`,
`userQuantityStatisticInYears`, `getAllFollowerPerUser`,
`getLastestLoginLocationPerAccount`, `checkConversationBetweenTwoAccount`,
`searchConversationByName`. Renaming any of them breaks runtime, not compile.

Known defect: the statistics functions drop and recreate permanent views
(`month_year`, `quarter_year`, `list_year`) on every call, so concurrent dashboard calls
race. Suggested fix is inlining them as CTEs; not done yet.

## Safety

- Read-only queries are fine against a local dev database the user has started.
  Anything that writes, migrates, restores a dump, or `DROP`s needs explicit approval,
  and must never target Supabase without it.
- Starting the backend against a database **is** a schema change (`ddl-auto: update`).
- Compose init scripts in `/docker-entrypoint-initdb.d` run only on an empty volume
  (`vivacon-db-data`). To restore a dump: `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`
  then load the dump with `\connect` / `CREATE|DROP|ALTER DATABASE` lines filtered out.
  See `.kiro/steering/deployment.md`.
- Supabase: session pooler port 5432 (not transaction 6543, which breaks Hibernate prepared
  statements), username `postgres.<project-ref>` via `DB_USERNAME`, and always
  `sslmode=require`.
- The Postgres MCP server Kiro used (`.kiro/settings/mcp.json`, gitignored) is not present on
  this Mac and was not migrated. If wanted, add it at **local** scope so the connection
  string never lands in a tracked file.
