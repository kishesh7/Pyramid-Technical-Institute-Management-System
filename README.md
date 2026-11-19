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

## Images

Gallery images are served from `public/images` and are already included:

- `public/images/samrikhadka.jpeg`
- `public/images/pyramid1.png`
- `public/images/pyramid2.png`
- `public/images/pyramid3.png`
- `public/images/pyramidlogo.jpeg`

Add `public/images/tailoring.jpeg` to replace the remaining gallery placeholder.

The institute logo is rendered as inline SVG.
