const express = require('express');
const multer = require('multer');
const { Octokit } = require('@octokit/rest');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 100 * 1024 * 1024,
    files: 1000
  }
});

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(express.static('public'));

app.post('/upload', upload.array('files'), async (req, res) => {
  try {
    const { repoUrl, token, commitMessage, branch, filePaths } = req.body;
    const files = req.files;

    if (!repoUrl || !token || !files || files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'URL repository, GitHub token, dan file harus diisi!' 
      });
    }

    const repoMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
    if (!repoMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'URL repository tidak valid!' 
      });
    }

    const owner = repoMatch[1];
    const repo = repoMatch[2];

    const octokit = new Octokit({ auth: token });

    const uploadedFiles = [];
    const errors = [];

    const filePathsArray = Array.isArray(filePaths) ? filePaths : filePaths ? [filePaths] : [];

    console.log(`Uploading ${files.length} files to ${owner}/${repo}`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const fileContent = fs.readFileSync(file.path);
        
        if (fileContent.length > 1024 * 1024) {
          errors.push({
            file: filePathsArray[i] || file.originalname,
            error: 'File terlalu besar (max 1MB untuk GitHub API)'
          });
          fs.unlinkSync(file.path);
          continue;
        }
        
        const contentEncoded = Buffer.from(fileContent).toString('base64');
        const filePath = filePathsArray[i] || file.originalname;

        let existingFile;
        try {
          const { data } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path: filePath,
            ref: branch || 'main'
          });
          existingFile = data;
        } catch (error) {
          if (error.status !== 404) throw error;
        }

        await octokit.rest.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: filePath,
          message: commitMessage || `Upload ${filePath}`,
          content: contentEncoded,
          branch: branch || 'main',
          ...(existingFile && { sha: existingFile.sha })
        });

        uploadedFiles.push(filePath);
        console.log(`✓ Uploaded: ${filePath}`);
        
        fs.unlinkSync(file.path);
      } catch (error) {
        console.error(`✗ Failed: ${filePathsArray[i] || file.originalname}`, error.message);
        errors.push({
          file: filePathsArray[i] || file.originalname,
          error: error.message
        });
        
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    if (uploadedFiles.length > 0) {
      res.json({
        success: true,
        message: `Berhasil upload ${uploadedFiles.length} file!`,
        uploadedFiles,
        errors: errors.length > 0 ? errors : undefined
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Gagal upload semua file',
        errors
      });
    }

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Terjadi kesalahan saat upload' 
    });
  }
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File terlalu besar! Maksimal 100MB per file.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Terlalu banyak file! Maksimal 1000 file.'
      });
    }
  }
  res.status(500).json({
    success: false,
    message: error.message || 'Terjadi kesalahan'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server berjalan di port ${PORT}`);
});

server.timeout = 600000;
