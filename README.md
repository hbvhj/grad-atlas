# Grad Atlas

Bilingual graduate application tracker with 32 programs, country and school filters, rounds, requirements, study-extension policies and GRE/TOEFL planning.

## Deploy on Vercel

Import this private repository. Framework: **Next.js**. Root directory: repository root. Node.js: **22.x**. The included vercel.json sets the install command, build command and output directory. Remove any old custom Vite/dist overrides in the Vercel dashboard, then redeploy the newest main commit without the old build cache.

Without database configuration, the website opens as an explicitly labelled **read-only preview**. The catalog and language switch work; saving and monitoring are disabled. It does not silently save to temporary server memory.

## Enable private saved records

The original Sites database is not copied into GitHub or automatically transferred to Vercel. Create a D1 database in your own Cloudflare account and run `drizzle/0000_early_the_watchers.sql` in its SQL console. Add the following server-only environment variables in Vercel and redeploy:

- CLOUDFLARE_ACCOUNT_ID
- CLOUDFLARE_D1_DATABASE_ID
- CLOUDFLARE_D1_API_TOKEN: a token with D1 Edit permission scoped to that account
- APP_PASSWORD: a strong workspace password

The Vercel backend connects through the official D1 HTTPS API. No Cloudflare Worker binding is needed. With the database enabled, the entire workspace requires a browser login: use any username and APP_PASSWORD. A private GitHub repository alone does not protect deployed records. Do not share this password with read-only reviewers: authenticated visitors share the same editable workspace. A public no-database deployment is suitable for showing the catalog.

Use a new empty D1 database for a fresh workspace. Existing Sites records need a separate deliberate export/import; deploying this repository does not migrate them. If importing older records, apply the second privacy migration as well. Keep API tokens in Vercel environment settings; never commit them.

## Local development and checks

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm exec tsc --noEmit
node tests/verify.mjs
pnpm build
pnpm start
```

Copy .env.example to .env.local only if enabling a personal database. The production build does not need database credentials. Files under build/, examples/, and scripts/ are inherited Sites tooling; standard Next.js build/start scripts do not invoke them. The original Sites deployment is unchanged.

## Monitoring and data limits

Official-source checks run when the workspace is open, with a daily cache per program. They identify changes for manual review; they do not autonomously replace deadlines or run while the website is closed. Unverified dates and policies remain marked. New schools outside the supported domains use manual links.

## Repair notes

The first GitHub upload truncated lib/seed.json and pnpm-lock.yaml to 90,060 bytes each. Both have been restored from the complete local source. The user-supplied repaired JSON was valid but omitted seven programs and parts of HEC–Yale and Oxford Social Data Science; the intact original records restore those losses. No removed personal profile data was reintroduced.

This repository now uses a tested standard Next.js production build instead of the Sites/Cloudflare build. Production Vercel deployment and real D1 credentials must still be verified in the owner's account.
