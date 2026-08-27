# GACODA Website

A Next.js App Router and Prisma/PostgreSQL implementation for the Greater Accra Concerned Online Drivers Association.

## Local setup

Requirements: Node.js 20+, npm, and a PostgreSQL database from Neon, Supabase, or another PostgreSQL provider.

```bash
cp .env.example .env
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Open `http://localhost:3000`. The seed creates a demo administrator:

- Email: `admin@demo.gacoda.org`
- Password: `demo-admin-password`

Change or remove this account before production use.

## Environment

Set `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, and `NEXT_PUBLIC_SITE_URL` in `.env`. `AUTH_SECRET` must be a long random production secret. The admin cookie is signed with HMAC and is HTTP-only, same-site, and secure in production.

## Deployment

1. Create a serverless PostgreSQL database.
2. Configure the environment variables in Vercel.
3. Run `npm run db:generate` during the build and apply the Prisma schema with `npm run db:push` or a reviewed migration workflow.
4. Deploy with `npm run build`.
5. Configure external object storage for production media URLs; the database stores media metadata and URLs rather than binary files.

## Implemented CMS workflows

- Public database-backed news, gallery, resources, statistics, About content, and team profiles.
- Authenticated admin dashboard and management workspaces.
- Membership, contact, and newsletter persistence with basic request throttling.
- News create, edit, draft/publish/archive status, scheduling timestamp, SEO fields, deletion permissions, and audit entries.
- Signed admin sessions, role checks, password hashing, management mutations, and audit records.

## Verification

The source can be verified after installing the toolchain with:

```bash
npm run build
npm run lint
```

The current development environment does not provide `node` or `npm`, so dependency installation, Prisma generation, database connectivity, build, lint, and browser acceptance tests must be run on a Node-enabled machine.
