# E-Learning Platform (سحابة الأردن)

## Overview
An Arabic-language cloud computing e-learning platform built with React, Express, and PostgreSQL. Features courses, labs, learning paths, quizzes, certificates, and user management with role-based access (admin, instructor, student).

## Tech Stack
- **Frontend**: React 18 + TypeScript, Vite, TailwindCSS, shadcn/ui components, Wouter routing
- **Backend**: Express 5, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Passport.js with local strategy, express-session
- **Build**: esbuild (server), Vite (client)

## Project Structure
```
client/          - React frontend
  src/
    components/  - UI components (shadcn/ui)
    pages/       - Page components
    lib/         - Utilities, auth context, theme provider
    hooks/       - Custom hooks
server/          - Express backend
  index.ts       - Server entry point (port 5000)
  routes.ts      - API routes
  storage.ts     - Database storage layer
  db.ts          - Database connection
  vite.ts        - Vite dev server middleware
  static.ts      - Static file serving (production)
shared/          - Shared types and schema
  schema.ts      - Drizzle schema definitions
script/          - Build scripts
```

## Scripts
- `npm run dev` - Development server (port 5000)
- `npm run build` - Production build
- `npm run start` - Production server
- `npm run db:push` - Push schema to database

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (auto-provisioned)
- `PORT` - Server port (defaults to 5000)

## Recent Changes
- **Section-based Lab Submissions**: Each lab has sections created by instructor, each section requires student submission (image + description), per-section status tracking (pending/approved/rejected)
- **Video Upload/Streaming**: Protected video upload (500MB, MP4/WebM/OGG) with multer, streaming with Range requests, download prevention
- **Instructor Lab Management**: Full CRUD for labs (create, edit, delete) + lab content (sections) management via instructor dashboard
- **Lab Content Page**: Supports both admin and instructor roles with dynamic API routing
- **Homepage Cloud Logos**: Animated scrolling logos for AWS, Azure, Google Cloud, Kubernetes, GitHub, Terraform

## Key Features
- **Video Protection**: HTML5 controls disable download, context menu, PiP; CSS overlay prevents screen recording
- **Role-based Access**: Admin, Instructor, Student with separate API routes and UI
- **Instructor Dashboard**: Manage courses (CRUD + content), labs (CRUD + sections), view submissions
- **Uploads**: Stored in `/uploads/videos/` with UUID filenames

## Deployment
- Build: `npm run build`
- Run: `npm run start`
- Target: Autoscale
