# VEX IQ Role Readiness Assessment

A full-stack web app where students complete an English-language, multiple-choice
assessment based on VEX IQ Robotics Competition participation. After submitting,
the student sees only a simple confirmation. The analysis — a **preliminary learning
profile** of which team roles the student tends to be strong in, what they understand
well, and what to practice next — is produced as a teacher-readable report available
only in the teacher dashboard (and optionally emailed to a fixed teacher address).

> **Important:** This tool provides a *preliminary learning profile* for educational
> guidance and team placement only. It does **not** certify students, assign final team
> roles, or claim any affiliation with or endorsement by VEX Robotics. All game concepts
> are paraphrased in original wording — no official manual text or logos are included.

## What it evaluates

Six learning areas. The first four are the core VEX IQ team roles; the last two are
included because competition success also depends on strategy, communication, rules,
and teamwork:

1. **Builder** — structure, mechanisms, inspection awareness, iteration
2. **Programmer / Coder** — autonomous logic, sensors, debugging, explaining code
3. **Driver** — control under pressure, timing, field awareness, accuracy
4. **Notebook Writer** — documenting goals, tests, data, decisions, citations
5. **Strategist** — scoring analysis, routes, rules-aware planning, alliance coordination
6. **Team Collaborator** — communication, respect, safety, rules, student-centered work

## Tech stack

- **Next.js (App Router)** + **TypeScript**
- **Tailwind CSS** (custom components)
- **Prisma ORM** with **PostgreSQL** (Supabase in production; Postgres locally too)
- **Zod** validation, API routes
- **CSV export**
- Optional **Resend** email integration
- Deploys to **Netlify** (Next.js runtime)

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Landing page, purpose, privacy notice, start + teacher login |
| `/assessment` | Student info form + quiz (one question per screen): competition-understanding questions + thinking-style questions |
| `/assessment/result/[submissionId]` | Simple "submission received" confirmation — no score or analysis shown to students |
| `/teacher/login` | Password login (env `TEACHER_PASSWORD`) |
| `/teacher/dashboard` | List, search/filter, summary, CSV export |
| `/teacher/submissions/[submissionId]` | Detailed teacher report |
| `/admin/questions` | Read-only question bank with weights & feedback |

## Setup

The app uses **PostgreSQL** locally as well as in production, so there is no
SQLite/Postgres mismatch. For local dev, point `DATABASE_URL` at a Postgres
instance — either a free Supabase project (simplest) or a local Postgres
(e.g. `docker run -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres`).

```bash
# 1. Install dependencies (also runs `prisma generate`)
npm install

# 2. Create your environment file
cp .env.example .env       # Windows: copy .env.example .env
# then edit DATABASE_URL to your Postgres connection string

# 3. Create the database tables from the Prisma schema
npm run db:push

# 4. (Optional) Seed a couple of demo submissions for the dashboard
npm run db:seed

# 5. Start the dev server
npm run dev
```

> Need SQLite for a quick offline local run? Temporarily set
> `provider = "sqlite"` in `prisma/schema.prisma` and `DATABASE_URL="file:./dev.db"`,
> but never commit that and never use SQLite in production.

Open http://localhost:3000.

- Take the assessment at **/assessment**.
- Log in as a teacher at **/teacher/login** (default dev password: `teacher1234`).

### Useful scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Generate Prisma client + production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Create/update the database from the schema |
| `npm run db:seed` | Insert demo submissions |
| `npm run db:reset` | Reset the database and re-seed |

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string (Supabase in production, Postgres locally). |
| `TEACHER_PASSWORD` | Recommended | Teacher login password. In dev, falls back to `teacher1234` if unset. **Set a strong value in production.** |
| `APP_URL` | Recommended | Public base URL used to build report links in emails (e.g. `https://your-site.netlify.app`). |
| `RESEND_API_KEY` | Optional | Resend API key. Required (with the two below) to email reports. |
| `FROM_EMAIL` | Optional | Verified Resend "from" address. |
| `TEACHER_NOTIFICATION_EMAIL` | Optional | Fixed teacher/admin recipient for report emails. The student form no longer collects a teacher email, so this is the only address reports are sent to. |

A report email is sent only when **all three** of `RESEND_API_KEY`, `FROM_EMAIL`,
and `TEACHER_NOTIFICATION_EMAIL` are set. If any is missing, email is skipped, the
report is stored, and the dashboard shows **"Email delivery is not configured."**
Students are never shown or told about email delivery.

## Scoring design (two separate dimensions)

The assessment measures **two independent things**, so "knowing the right answer"
never decides a student's role and no single role can win just by choosing
sensible answers.

**1. Competition Understanding (knowledge)**

- **Understanding score** = percentage of the *knowledge* questions answered correctly.
  Knowledge questions add **nothing** to role tendency.
- **Understanding level**: 0–49 Developing · 50–79 Ready for Guided Practice ·
  80–100 Strong Understanding. (No "Competition Ready"; a high score means ready for
  guided practice, not finished.)

**2. Role Tendency / thinking style**

- Built **only** from the forced-choice thinking-style questions, which have **no wrong
  answer**. Every option is reasonable and maps to one role; picking it adds one point to
  that role.
- **Normalized role score** = `earnedRoleScore / maxPossibleRoleScoreForThatRole`, where the
  maximum is how many thinking-style questions offered that role. Roles are compared by this
  **percentage**, not by raw totals — so a role offered more often cannot dominate, and a role
  offered less often is not mistaken for a weakness.
- **Suggested focus / possible additional strength** = the two highest **normalized** roles.
  Ties break by role order.
- Top two within 10 points → **close preliminary strengths**; three or more within 10 points →
  **balanced preliminary profile**.
- **Suggested growth areas** = roles whose normalized score is below ~55% (up to 2). A role at
  100% is never a growth area.

The question bank is audited so the correct knowledge answer is **not** systematically the
longest or the only "good-behavior" option, and correct answers are spread across A/B/C/D.
Automated **anti-pattern tests** (`tests/scoring.test.ts`) verify that always picking the
longest answer or always picking the same letter scores near chance and does not produce a
fixed role, and that different role patterns produce different foci.

Results are a **preliminary learning profile**, reviewed only by teachers in the dashboard —
students see a confirmation only. The teacher report shows the understanding level and the role
tendency **separately**: a normalized role table (role · raw · max · percentage · interpretation),
a suggested focus, the **evidence** (which thinking-style choices suggested it), a recommended
trial activity, suggested growth areas, an answer-by-answer review, and a disclaimer that this is
a preliminary profile needing hands-on observation — not a fixed or assigned role.

Key logic lives in dedicated, framework-free files:
`src/lib/scoring.ts` (scoring engine + normalization) and `src/lib/report.ts` (report generator).

## Deployment (Netlify + Supabase/Postgres)

The app is configured for **Netlify**. `netlify.toml` sets the build command,
publish directory, and Node version; Netlify auto-detects Next.js and applies the
official Next.js runtime (SSR, Server Components, Route Handlers, and API routes
all work — there are no Vercel-only APIs in this project).

### 1. Set up Supabase (Postgres)

1. Create a project at [supabase.com](https://supabase.com).
2. In the Supabase dashboard go to **Project Settings → Database → Connection
   string** and copy the **URI**. It looks like:
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
   For serverless platforms like Netlify, prefer the **pooled** connection
   (pgBouncer, port `6543`) and append `?pgbouncer=true&connection_limit=1`.
3. Use that string as `DATABASE_URL`.

### 2. Create the database tables (run once, manually, before launch)

Run this from your machine with `DATABASE_URL` pointed at Supabase. **Do not**
run destructive migrations automatically on every Netlify build — keep schema
changes a controlled, manual step:

```bash
npx prisma generate
npx prisma migrate deploy   # applies committed migrations; safe & non-destructive
```

> If this repo has no `prisma/migrations` folder yet, create the first migration
> locally with `npx prisma migrate dev --name init` (against a dev database),
> commit the generated `prisma/migrations/`, then use `migrate deploy` for prod.
> For a quick first launch you can instead run `npx prisma db push` once, but
> `migrate deploy` is preferred for production so schema changes are tracked.
>
> **Why not auto-migrate on every build?** A migration that runs on each deploy
> can drop or rewrite columns unexpectedly and cause data loss. Running
> `migrate deploy` manually (or as a deliberate one-off deploy step) keeps you
> in control of when the production schema changes.

### 3. Required environment variables (set in Netlify)

In **Netlify Dashboard → Site configuration → Environment variables**, add:

```env
DATABASE_URL="postgresql://..."          # Supabase connection string
TEACHER_PASSWORD="replace-with-strong-password"
APP_URL="https://your-netlify-site.netlify.app"
```

Optional (all three enable emailed reports to a fixed address):

```env
RESEND_API_KEY=""
FROM_EMAIL=""
TEACHER_NOTIFICATION_EMAIL=""
```

After changing any environment variable in Netlify you must **redeploy** (trigger
a new deploy) for the change to take effect.

### 4. Pre-deploy checks

```bash
npm install
npm run lint
npm test
npm run build
```

### 5a. Deploy — Option A: Netlify Dashboard (Git)

1. Push the code to GitHub.
2. In Netlify: **Add new site → Import an existing project** and select the repo.
3. Build settings (usually auto-filled from `netlify.toml`):
   - **Build command:** `npm run build` (already runs `prisma generate`). You can
     also use `npx prisma generate && npm run build` — both work.
   - **Publish directory:** `.next`
4. Add the environment variables from step 3.
5. **Deploy site.**

### 5b. Deploy — Option B: Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify init

netlify env:set DATABASE_URL "postgresql://..."
netlify env:set TEACHER_PASSWORD "your-strong-password"
netlify env:set APP_URL "https://your-site-name.netlify.app"
# optional:
# netlify env:set RESEND_API_KEY "..."
# netlify env:set FROM_EMAIL "reports@yourdomain.com"

netlify deploy --build           # deploy a preview
netlify deploy --build --prod    # deploy to production
```

### 6. Verify after deploy

Once live, walk the full flow:

- `/` — landing page + privacy notice loads
- `/assessment` — info form + quiz; submit one test student
- `/assessment/result/[submissionId]` — shows only a "submission received"
  confirmation (no score or analysis)
- `/teacher/login` — log in with `TEACHER_PASSWORD`
- `/teacher/dashboard` — the test submission appears (table on desktop, cards on
  mobile); filters work
- `/teacher/submissions/[submissionId]` — full teacher report renders
- **CSV export** from the dashboard downloads
- If all three email vars are configured, the fixed notification address receives
  the report email; otherwise the dashboard shows "Email delivery is not
  configured" (this is expected).

## Netlify troubleshooting

| Symptom | Likely cause / fix |
| --- | --- |
| Runtime DB errors / pages 500 on data access | `DATABASE_URL` missing or wrong in Netlify. Set it, then **redeploy**. |
| `@prisma/client did not initialize yet` / Prisma Client errors | Prisma Client wasn't generated. The build runs `prisma generate` (via `npm run build`); confirm the build command wasn't overridden in Netlify UI. |
| `the URL must start with the protocol postgresql://` | Wrong DB provider/URL. Provider is `postgresql`; `DATABASE_URL` must be a Postgres URL, not `file:./dev.db`. |
| Teacher login rejects the password | `TEACHER_PASSWORD` not set in Netlify (no dev fallback in production). Set it and redeploy. |
| Tables don't exist / "relation ... does not exist" | Migrations weren't applied to Supabase. Run `npx prisma migrate deploy` against `DATABASE_URL`. |
| Email never sends | `RESEND_API_KEY` and/or `FROM_EMAIL` missing, or `FROM_EMAIL` not verified in Resend. Email is optional and never blocks results. |
| Builds locally but fails on Netlify | Check `NODE_VERSION = "20"` (set in `netlify.toml`), ensure all env vars are present at build time, and read the Netlify build log for the failing step. Too many DB connections → use Supabase's pooled (port 6543) URL with `?pgbouncer=true&connection_limit=1`. |
| Env var change had no effect | Netlify bakes env vars at deploy time. **Trigger a new deploy** after editing them. |

> SQLite is for quick local experiments only; always use Postgres (Supabase) for
> any hosted deployment.

## Privacy

- Collects only the student's name or nickname, school name, and (optionally) team name.
- No other personal or sensitive data is collected.
- A consent checkbox is required before the quiz.
- Students never see their own score or analysis — after submitting they get only a
  confirmation. Results are available only to authorized teachers through the
  teacher dashboard (login required) and are not public.
- Submission IDs are unguessable (`cuid`).

## Limitations / notes

- Teacher auth is a single shared password (MVP), stored as a salted-hash session
  cookie — suitable for a classroom, not multi-account use.
- The question bank is read-only in the UI; edit `src/lib/questions.ts` to change it.
- Email sending is best-effort and never blocks a student's result.
