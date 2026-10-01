# App readiness check

Used by `SKILL.md` (step 2) before any DOM inspection, design sign-off or run. The application is not hosted: it runs locally, so it must be initialized and started before it can be inspected or tested. Do not continue to the DOM step against a URL that does not answer.

Discover the commands from the repository each time (README, root and app `package.json` scripts, `vite.config.ts`, `server.ts`). The values below are what the Waitlist app used when this was written; confirm them before relying on them.

## Waitlist app (monorepo `apps/api`, `apps/web`, `packages/shared`)

| Item | Value | Where it comes from |
|---|---|---|
| Node | 24 with npm 11 | README "Requirements" |
| Install | `npm install` at the repo root | README "Set up" |
| API | `npm run dev -w @waitlist/api`, port 3001, `DEMO_LOGIN=true` set by the script | `apps/api/package.json`, `src/server.ts` |
| Web | `npm run dev -w @waitlist/web`, port 5173, proxies `/api` to port 3001 | `apps/web/vite.config.ts` |
| Database | SQLite file `data/waitlist.db`; override with `DATABASE_FILE` | `src/db/connection.ts` |
| Migrate and seed | Done by the API on start when demo login is on; `npm run seed` does it without starting the API | `src/server.ts`, `src/db/seed-cli.ts` |
| Sign-in | Passwordless demo login, only when `DEMO_LOGIN=true`. Seeded actors are listed by `GET /demo/users` | `src/routes/demo.ts` |
| API health | `GET http://localhost:3001/demo/users` returns 200 with seeded patients and staff | `src/routes/demo.ts` |
| Web health | `GET http://localhost:5173/` returns 200 | Vite dev server |

## Checks, in order

Report each as pass or fail. Stop at the first failure that blocks the next one, say what is missing, and give the command that fixes it. Do not start servers or install packages without telling the user first.

1. **Runtime:** `node --version` matches the required major version and `npm --version` works.
2. **Installed:** `node_modules` exists at the repo root (and `playwright-suite/node_modules` for the suite). If not, the fix is `npm install`.
3. **Builds:** `npm run build` at the repo root exits 0. If it does not, the application code is broken or incomplete; report the error and stop. Do not edit application code.
4. **Implementation state:** read the OpenSpec change's `tasks.md` (checked versus unchecked) and compare it with the QA spec's assumptions. State which behaviour the QA cases need that is not built yet (for the telephone-path change: contact preference, staff record actions, the V3 seed, hidden position and Leave controls). Cases for unbuilt behaviour cannot pass and their locators cannot be verified.
5. **Data:** the seeded actors named in the QA spec exist. Call the health endpoint and compare its list with the QA spec's test data conventions. Missing or renamed actors mean the seed does not match the spec.
6. **Running:** the API health URL and the web URL both answer. If a port is already in use by something else, report it; do not kill the process.
7. **Clean state:** a run starts from an empty waitlist. Use a dedicated database file for suite runs (set `DATABASE_FILE`, for example `data/e2e.db`) so the demo data is not touched, and state how it is reset (delete the file and restart, or per-test API cleanup).

## How to start the app (with the user's agreement)

Run each server as a background process so the session stays usable, and keep their logs.

1. API: `DATABASE_FILE=data/e2e.db npm run dev -w @waitlist/api`
2. Web: `npm run dev -w @waitlist/web`
3. Poll the two health URLs until both return 200 or until 30 seconds pass. If they do not, show the last lines of the logs and stop.

Stop the servers when the work that needed them ends, unless the user asks to leave them running.

## What to record in the design

An **Environment** section with: the verified commands, URLs and ports, database file and reset method, the seeded actors found, the implementation state from check 4, and the result of each check with the date. If any check failed or was skipped, the design status stays `Blocked on environment` and the section lists what is needed.

## Not allowed

- Starting servers, installing packages or deleting the database file without the user's agreement.
- Pointing a run at a database or URL that holds real patient data. The app is a local demo; refuse if the URL or database is anything else.
- Editing application code or its configuration to make a check pass.
