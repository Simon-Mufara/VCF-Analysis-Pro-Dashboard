<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# VCF Analysis Pro Dashboard

AI-assisted genomics dashboard for somatic and comparative variant analysis, with Firebase login and report history.

![CI](https://github.com/Simon-Mufara/VCF-Analysis-Pro-Dashboard/actions/workflows/ci.yml/badge.svg)
![Deploy to GitHub Pages](https://github.com/Simon-Mufara/VCF-Analysis-Pro-Dashboard/actions/workflows/deploy-pages.yml/badge.svg)
[![Live Site](https://img.shields.io/badge/Live%20Site-GitHub%20Pages-2ea44f?logo=github)](https://simon-mufara.github.io/VCF-Analysis-Pro-Dashboard/)

## Live app (quick access)

- GitHub Pages: **https://simon-mufara.github.io/VCF-Analysis-Pro-Dashboard/**
- AI Studio app: https://ai.studio/apps/4979d32e-957d-4252-9c28-5056c5538e3c

## What this project does

- Upload and parse genomic files (`.vcf`, `.bam`, `.cram`, `.sam`, `.bed`, `.gtf`, `.fastq`, `.fasta`, `.csv`, `.h5ad`)
- Run AI-assisted somatic interpretation and comparative analysis
- Show prediction dashboards and optional IGV exploration
- Save user analysis history (when signed in) via Firebase Auth + Firestore
- Export structured analysis outputs/reports

## Clone from GitHub and run locally

**Prerequisites**

- Node.js 20+ and npm
- A Firebase project with Google sign-in enabled

1. Clone your repository and enter it:

   ```bash
   git clone <your-github-repo-url>
   cd <your-repo-folder>
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create `.env.local` from `.env.example` and set your key:

   ```bash
   GEMINI_API_KEY="your_key_here"
   APP_URL="http://localhost:3000"
   ```

4. Start the local host:

   ```bash
   npm run dev
   ```

5. Open: `http://localhost:3000`

## Login and Firebase setup (local)

Google login uses Firebase Auth (`src/lib/firebase.ts`) and project config from `firebase-applet-config.json`.

In Firebase Console:

1. Enable **Authentication -> Sign-in method -> Google**.
2. Add authorized domains for local use (for example `localhost` and `127.0.0.1`).
3. Ensure Firestore exists and security rules are deployed from `firestore.rules`.

If login popup fails locally, check browser popup blocking and authorized domains first.

## Environment variables

Create `.env.local`:

```bash
GEMINI_API_KEY="your_key_here"
APP_URL="http://localhost:3000"
```

## Scripts

- `npm run dev` - run local dev server on port 3000
- `npm run lint` - TypeScript type-check
- `npm run test` - run Vitest tests
- `npm run build` - create production build
- `npm run preview` - serve production build locally

## Optional: host built app with GitHub Pages

This is optional for static preview hosting.

This repository includes:

- `.github/workflows/ci.yml` for lint + test + build on pushes and pull requests
- `.github/workflows/deploy-pages.yml` for automatic Pages deployment from `main`

To enable GitHub Pages deployment:

1. In your repository settings, set **Pages -> Build and deployment -> Source** to **GitHub Actions**.
2. Add repository secret `GEMINI_API_KEY` under **Settings -> Secrets and variables -> Actions**.
3. Push to `main` (or run the workflow manually) to deploy.

The Vite config automatically sets the correct Pages base path in GitHub Actions using `GITHUB_REPOSITORY`.
