# GitHub File Uploader

## Overview
Website untuk upload file dan folder ke GitHub repository dengan mudah, tanpa perlu menggunakan terminal atau command line git. User cukup masukkan URL repository, GitHub token, pilih file/folder, dan klik upload.

## Tujuan Project
Memudahkan user untuk push/upload project ke GitHub repository tanpa harus menggunakan command line terminal. Website ini menyediakan interface yang user-friendly dengan drag-and-drop functionality dan support untuk upload folder lengkap.

## Fitur Utama
- 🚀 Upload file & folder ke GitHub repository via web interface
- 📁 Drag & drop atau browse file/folder
- 📂 **Support upload folder** lengkap dengan struktur direktori
- 🔄 Support multiple file upload
- 🌿 Customizable branch selection
- 📝 Custom commit message
- ✅ Real-time upload status dan error handling
- 🎨 UI/UX modern dengan tema dark + merah menggunakan Bootstrap 5
- 🔒 GitHub token wajib untuk autentikasi (requirement dari GitHub API)

## Teknologi Stack
### Backend
- **Node.js** dengan Express.js
- **Multer** untuk handle file upload
- **@octokit/rest** untuk GitHub REST API integration
- **CORS** untuk cross-origin requests

### Frontend
- **Bootstrap 5** untuk UI framework
- **Bootstrap Icons** untuk ikon modern
- HTML5, CSS3, JavaScript (Vanilla)
- Drag & drop file/folder upload
- Responsive design dengan tema dark + aksen merah

## Struktur Project
```
.
├── server.js           # Backend server (Express + GitHub API)
├── public/
│   ├── index.html      # Frontend HTML dengan Bootstrap 5
│   ├── style.css       # Custom styling (dark theme + red accent)
│   └── script.js       # Frontend logic dengan folder support
├── uploads/            # Temporary upload folder
└── package.json        # Dependencies
```

## Cara Penggunaan

### 1. Persiapan GitHub Token
- Buka [GitHub Settings > Developer Settings > Personal Access Tokens](https://github.com/settings/tokens)
- Klik "Generate new token (classic)"
- Pilih scope: **repo** (full control of private repositories)
- Copy token yang di-generate

**PENTING**: Token GitHub adalah **WAJIB** karena GitHub API memerlukan autentikasi untuk upload file ke repository.

### 2. Upload File/Folder
1. Masukkan **URL repository GitHub** (contoh: https://github.com/username/repo.git)
2. Paste **GitHub Personal Access Token**
3. Pilih **branch** (default: main)
4. Opsional: Tulis **commit message** custom
5. **Pilih file atau folder**:
   - Klik **"Pilih Files"** untuk upload beberapa file
   - Klik **"Pilih Folder"** untuk upload folder lengkap dengan struktur
   - Atau **drag & drop** file/folder langsung
6. Klik **Upload ke GitHub**

### 3. Hasil
Website akan menampilkan:
- ✅ File yang berhasil di-upload (dengan path lengkap untuk folder)
- ❌ File yang gagal (jika ada) dengan error message

## API Endpoints

### POST /upload
Upload file/folder ke GitHub repository

**Request:**
- `multipart/form-data` dengan fields:
  - `repoUrl`: URL GitHub repository
  - `token`: GitHub Personal Access Token (WAJIB)
  - `branch`: Branch name (optional, default: main)
  - `commitMessage`: Commit message (optional)
  - `files`: Array of files to upload
  - `filePaths`: Array of relative paths untuk folder structure

**Response:**
```json
{
  "success": true,
  "message": "Berhasil upload N file!",
  "uploadedFiles": ["file1.txt", "folder/file2.js"],
  "errors": []
}
```

### GET /health
Health check endpoint

**Response:**
```json
{
  "status": "ok"
}
```

## Catatan Teknis
- File di-encode ke base64 sebelum dikirim ke GitHub API
- Jika file sudah ada di repository, akan di-update (perlu SHA dari file existing)
- Temporary uploaded files di-delete setelah proses selesai
- Maximum file size tergantung GitHub API limits
- Folder upload menggunakan `webkitdirectory` attribute untuk browser compatibility
- File paths dipertahankan saat upload folder untuk mempertahankan struktur direktori

## Design
- Tema: Dark background dengan aksen merah (#dc3545)
- Framework: Bootstrap 5
- Icons: Bootstrap Icons
- Layout: Clean, minimalis, modern
- Responsive: Mobile-friendly

## Recent Changes
- **2025-10-24**: Initial implementation dengan semua fitur utama
- **2025-10-24**: UI redesign dengan Bootstrap 5, tema dark + merah, dan support untuk upload folder

## User Preferences
- Bahasa komunikasi: Bahasa Indonesia
- Preferensi: Website yang simple dan mudah digunakan tanpa perlu terminal
- Design: Tema dark dengan warna merah, menggunakan Bootstrap
- Fitur: Support upload folder lengkap
