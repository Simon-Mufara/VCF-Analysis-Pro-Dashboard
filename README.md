<div align="center">
<img width="1200" height="475" alt="VCF-Analysis-Pro-Dashboard Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# VCF-Analysis-Pro-Dashboard

**An AI-powered, clinical-grade genomics platform for VCF variant analysis.**  
Supports dual-domain analysis: **Cancer Somatic Genomics** and **Infectious Disease / Pathogen Genomics**.

[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-purple?logo=vite)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-teal?logo=tailwindcss)](https://tailwindcss.com)
[![Firebase](https://img.shields.io/badge/Firebase-12-orange?logo=firebase)](https://firebase.google.com)

</div>

---

## Overview

VCF-Analysis-Pro-Dashboard is a full-stack bioinformatics web application that uses **Google Gemini AI** to provide deep, clinical-grade interpretation of Variant Call Format (VCF) files. It automatically detects the genomic domain from the VCF and routes the data through the appropriate analysis pipeline — either a **Cancer Somatic** pipeline (Tumour-Normal pairs) or an **Infectious Disease** pipeline (pathogen AMR profiling).

---

## Features

| Feature | Description |
|---|---|
| 🧬 **VCF File Upload & Parsing** | Drag-and-drop VCF file ingestion with automatic domain detection |
| 🤖 **AI-Powered Variant Interpretation** | Google Gemini AI generates clinician-ready summaries and reports |
| 🦠 **Cancer Somatic Analysis** | VAF filtering, driver gene identification, TMB/MSI calculation, ACMG/AMP tiering |
| 🧫 **Infectious Disease / AMR Analysis** | Resistance marker detection, lineage assignment, heteroresistance profiling |
| 📊 **Interactive Dashboards** | CNV, QC, Heterogeneity, Pathway, and Drug Interaction visualizations |
| 🔬 **IGV Genome Browser** | Integrated Genomics Viewer (IGV.js) for read-level variant inspection |
| 💊 **PharmAI Predictor** | AI-based drug response and pharmacogenomics predictions |
| 🔎 **Comparative Analysis** | Side-by-side multi-sample comparison |
| 📚 **Knowledge Base** | Curated genomics reference integrated into the UI |
| 🔐 **Firebase Auth** | Google Sign-In with per-user analysis history stored in Firestore |
| 📝 **Markdown Reports** | Exportable, structured clinical reports |

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite 6, TailwindCSS 4, Framer Motion
- **AI:** Google Gemini API (`@google/genai`)
- **Visualizations:** D3.js, Recharts, IGV.js
- **Backend / Auth:** Firebase (Authentication + Firestore)
- **Testing:** Vitest, Testing Library

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) (v18 or later recommended)
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)
- A [Firebase project](https://console.firebase.google.com) with Authentication and Firestore enabled

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Simon-Mufara/VCF-Analysis-Pro-Dashboard.git
   cd VCF-Analysis-Pro-Dashboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**

   Copy the example file and add your Gemini API key:
   ```bash
   cp .env.example .env.local
   ```

   Then edit `.env.local`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

   > **Firebase:** The Firebase project configuration is stored in `firebase-applet-config.json` at the project root. Update that file with your own Firebase project credentials if you are self-hosting.

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server on port 3000 |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run the TypeScript type-checker |
| `npm test` | Run the test suite with Vitest |

---

## Project Structure

```
/src
  /components     # UI components (dashboards, file uploader, reports, etc.)
  /modules        # Shared bioinformatics logic (QC, variant annotation)
  /pipelines      # Cancer and Infectious Disease analysis pipelines
  /services       # Gemini AI service layer
  /types          # Shared TypeScript types (Variant, Report, etc.)
  /lib            # Firebase, error utilities
```

For a detailed description of the pipeline architecture, see [PIPELINE_ARCHITECTURE.md](PIPELINE_ARCHITECTURE.md).  
For the modular design specification, see [DESIGN_DOC.md](DESIGN_DOC.md).

---

## License

This project is private. All rights reserved.
