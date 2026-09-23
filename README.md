# DocuPrep — Document, Photo & PDF Preparation Suite

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![100% Client-Side Privacy](https://img.shields.io/badge/Privacy-100%25%20Client--Side-10B981?logo=shield&logoColor=white)](#privacy-guarantee)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable%20%26%20Offline-7C3AED?logo=pwa&logoColor=white)](#progressive-web-app-pwa)

**DocuPrep** is a fast, 100% private, client-side document, photo, signature, and PDF preparation tool designed to help applicants effortlessly meet the strict formatting and file-size guidelines required by government portals, competitive exams, visa authorities, and job applications.

All transformations execute directly inside your browser. **Your files, photos, signatures, and confidential documents are never uploaded to any remote server.**

---

## 🌟 Key Features

### 1. Photo & Document Resizer
- **Preset Compliance**: Pre-configured with official guidelines for competitive exams (UPSC, SSC, IBPS, NEET, JEE, RRB) and global passports/visas (US, Schengen, UK, India, Canada, Australia).
- **Physical Unit Conversion**: Seamlessly switch between millimeters (`mm`), centimeters (`cm`), inches (`in`), and pixels (`px`) with exact DPI calculations (72, 150, 200, 300, 600 DPI).
- **Aspect Ratio Locking**: Proportional scaling ensures passport photos and documents are never squashed or stretched.
- **Intelligent Compression**: Binary-search compression targets 94%–98% of the maximum allowed file size without unnecessary downsampling or severe quality loss.
- **Strict Size Padding**: Meets lower-bound thresholds (e.g. *"size must be between 20 KB and 50 KB"*) safely without corrupting image data.

### 2. Signature & Stamp Processing
- **Paper Whitening**: Removes phone camera shadows, yellow lighting, and gray tint from photographed signatures and physical receipts.
- **Contrast & Sharpness Enhancement**: Emphasizes dark ink strokes with adaptive unsharp masking for maximum legibility on official portals.
- **Transparent Signature Extraction**: Removes paper backgrounds to generate clean PNG signatures with transparent backgrounds.

### 3. Complete PDF Suite
- **Images to PDF**: Convert multiple images into a unified PDF document with drag-and-drop page reordering, page size presets (A4, Letter, Legal, Fit), custom margins, and orientation controls.
- **PDF to Images**: Extract pages as high-resolution images (using 2× super-sampling) with single page or bulk ZIP downloads.
- **PDF Merge**: Combine multiple PDF files into a single document in seconds.
- **PDF Split**: Extract custom page ranges or separate individual pages.
- **PDF Rotate**: Rotate upside-down or sideways pages permanently by 90°, 180°, or 270°.
- **PDF Compression**: Reduce large PDF document sizes locally before submission.

### 4. Dual Editor Experience
- **Simple Mode (Default)**: Streamlined, preset-driven workflow with zero confusing technical jargon. Ideal for quickly preparing photos and signatures for specific applications.
- **Advanced Mode**: Unlocks granular controls for custom canvas width/height, custom DPI scaling, crop matrix adjustments, and JPEG/WebP quality factors.

### 5. Custom Preset Builder
- Save your own portal or organization requirements (dimensions, units, DPI, maximum/minimum file sizes, and preferred format) directly in your browser.

### 6. Autosave & Privacy Safeguards
- **15-Minute Session Recovery**: Work is cached in temporary session storage so you never lose progress if the browser tab accidentally refreshes.
- **One-Click Workspace Clearing**: Modal-protected button to immediately purge all cached drafts, history, and custom presets.

---

## 🔒 Privacy Guarantee

DocuPrep is architected from the ground up for strict data security:
- **Zero Server Uploads**: Every image crop, color enhancement, compression pass, and PDF manipulation is processed using HTML5 Canvas, WebAssembly, and local JavaScript libraries (`pdf-lib`, `pdfjs-dist`).
- **No Cloud Database Required**: Does not store or log personal identification documents.
- **Works Completely Offline**: You can disconnect from the internet or toggle Airplane Mode after loading the page, and the application will remain fully functional.

---

## 📱 Progressive Web App (PWA)

DocuPrep is a fully certified Progressive Web App:
- **Offline Capable**: Cached by Service Workers for reliable performance anywhere.
- **Installable**: Install DocuPrep onto your desktop (Chrome/Edge/Safari) or mobile home screen (iOS/Android) as a standalone native-feeling application.

---

## 📋 Preset Catalog Highlights

| Category | Presets Included |
| :--- | :--- |
| **Passports & Visas** | US Visa / Passport (2x2 in, 600x600 px), Schengen Visa (35x45 mm), Indian Passport, UK Passport, Canada Passport, Australia Visa, Singapore Visa, UAE Visa |
| **National Exams (India)** | UPSC Civil Services Photo & Signature, SSC CGL / CHSL / MTS, IBPS Bank PO / Clerk, NEET UG Photo & Postcard, JEE Main Photo & Signature, RRB Railway Recruitment |
| **Identity & Driving** | PAN Card Photo & Signature, Indian Driving License, Aadhaar Card Document, OCI Card Photo |
| **Standard Paper Sizes** | A4 Document (300 DPI), US Letter (300 DPI), Legal Document |

---

## 🛠️ Technology Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Tooling**: [Vite 8](https://vitejs.dev/) with optimized vendor chunk splitting
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **PDF Processing**: [pdf-lib](https://pdf-lib.js.org/) & [pdfjs-dist](https://mozilla.github.io/pdf.js/)
- **Archive Generation**: [JSZip](https://stuk.github.io/jszip/)
- **Production Server**: Node.js + [Express](https://expressjs.com/) with static asset middleware (`server.ts`)

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0.0 or higher recommended)
- `npm` or `yarn` or `pnpm` or `bun`

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/DelightReza/DocuPrep.git
   cd DocuPrep
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Build for production:**
   ```bash
   npm run build
   ```
   This generates the production bundle in `dist/` and compiles the Node.js production server to `dist/server.cjs`.

5. **Start the production server:**
   ```bash
   npm start
   ```

---

## 🧪 Verification & Quality Checks

Run the TypeScript type-checker:
```bash
npm run lint
```

Build and test production packaging:
```bash
npm run build
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
