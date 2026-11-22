# Pyramid Technical Institute

The site uses the Next.js App Router, React, TypeScript, and Tailwind CSS v4.

## Project structure

```text
public/
  images/       Gallery photos served at /images/*
src/
  app/          Next.js routes, layout, and global styles
  assets/       Assets imported by TypeScript modules
  components/   Reusable React components
```

## Run locally

From this directory, install dependencies and start the development server:

```bash
npm install
npm run dev
```

The forms validate input and display demo success messages; they do not send data to a backend.

## Database deployments

Production builds apply the committed Prisma migrations before building the Next.js app. Set `DATABASE_URL` for each Vercel environment; a deployment without database access will fail instead of serving an app whose schema is out of date.

The migration at `prisma/migrations/20261122100000_add_program_table` creates the missing `Program` table and its foreign key to `Project`. After its first production deployment, seed the program choices once from a machine with the production `DATABASE_URL`:

```bash
npm run db:seed-programs
```

The seed script is idempotent: it reuses the training project and skips program records that already exist.

## Images

Gallery images are served from `public/images` and are already included:

- `public/images/samrikhadka.jpeg`
- `public/images/pyramid1.png`
- `public/images/pyramid2.png`
- `public/images/pyramid3.png`
- `public/images/pyramidlogo.jpeg`

Add `public/images/tailoring.jpeg` to replace the remaining gallery placeholder.

The institute logo is rendered as inline SVG.
