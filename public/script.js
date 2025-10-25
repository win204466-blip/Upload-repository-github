let selectedFiles = [];

const fileDropArea = document.getElementById('fileDropArea');
const fileInput = document.getElementById('fileInput');
const folderInput = document.getElementById('folderInput');
const fileList = document.getElementById('fileList');
const uploadForm = document.getElementById('uploadForm');
const submitBtn = document.getElementById('submitBtn');
const resultDiv = document.getElementById('result');
const selectFilesBtn = document.getElementById('selectFilesBtn');
const selectFolderBtn = document.getElementById('selectFolderBtn');

selectFilesBtn.addEventListener('click', (e) => {
    e.preventDefault();
    fileInput.click();
});

selectFolderBtn.addEventListener('click', (e) => {
    e.preventDefault();
    folderInput.click();
});

fileDropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileDropArea.classList.add('drag-over');
});

fileDropArea.addEventListener('dragleave', () => {
    fileDropArea.classList.remove('drag-over');
});

fileDropArea.addEventListener('drop', async (e) => {
    e.preventDefault();
    fileDropArea.classList.remove('drag-over');
    
    const items = e.dataTransfer.items;
    
    if (items) {
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Membaca folder...';
        submitBtn.disabled = true;
        
        const files = [];
        const promises = [];
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i].webkitGetAsEntry();
            if (item) {
                promises.push(traverseFileTree(item, '', files));
            }
        }
        
        await Promise.all(promises);
        addFiles(files);
        
        submitBtn.innerHTML = '<i class="bi bi-upload"></i> Upload ke GitHub';
        submitBtn.disabled = false;
    } else {
        const droppedFiles = Array.from(e.dataTransfer.files).map(file => {
            file.relativePath = file.name;
            return file;
        });
        addFiles(droppedFiles);
    }
});

async function traverseFileTree(item, path, filesList) {
    if (item.isFile) {
        return new Promise((resolve) => {
            item.file((file) => {
                const newFile = new File([file], file.name, {
                    type: file.type,
                    lastModified: file.lastModified
                });
                newFile.relativePath = path + file.name;
                filesList.push(newFile);
                resolve();
            });
        });
    } else if (item.isDirectory) {
        const dirReader = item.createReader();
        
        async function readAllEntries() {
            return new Promise((resolve) => {
                const allEntries = [];
                
                function readBatch() {
                    dirReader.readEntries(async (entries) => {
                        if (entries.length === 0) {
                            resolve(allEntries);
                        } else {
                            allEntries.push(...entries);
                            readBatch();
                        }
                    });
                }
                
                readBatch();
            });
        }
        
        const entries = await readAllEntries();
        const promises = [];
        for (let i = 0; i < entries.length; i++) {
            promises.push(traverseFileTree(entries[i], path + item.name + '/', filesList));
        }
        await Promise.all(promises);
    }
}

fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files).map(file => {
        file.relativePath = file.name;
        return file;
    });
    addFiles(files);
});

folderInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files).map(file => {
        file.relativePath = file.webkitRelativePath || file.name;
        return file;
    });
    addFiles(files);
});

function addFiles(files) {
    const largeFiles = files.filter(f => f.size > 1024 * 1024);
    if (largeFiles.length > 0) {
        showResult('warning', 
            `<i class="bi bi-exclamation-triangle"></i> Peringatan: ${largeFiles.length} file lebih dari 1MB. GitHub API memiliki limit 1MB per file. File besar akan di-skip.`
        );
    }
    
    selectedFiles = [...selectedFiles, ...files];
    updateFileList();
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFileList();
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function updateFileList() {
    if (selectedFiles.length === 0) {
        fileList.innerHTML = '';
        return;
    }

    fileList.innerHTML = selectedFiles.map((file, index) => {
        const fileName = file.relativePath || file.name;
        const isInFolder = fileName.includes('/');
        const icon = isInFolder ? 'bi-folder-fill' : 'bi-file-earmark';
        const isLarge = file.size > 1024 * 1024;
        const sizeClass = isLarge ? 'text-warning' : '';
        
        return `
            <div class="file-item ${isLarge ? 'border-warning' : ''}">
                <div class="d-flex align-items-center flex-grow-1">
                    <i class="${icon} text-danger me-2"></i>
                    <span class="file-name">${fileName}</span>
                    ${isLarge ? '<span class="badge bg-warning text-dark ms-2">Terlalu besar</span>' : ''}
                </div>
                <div class="d-flex align-items-center">
                    <span class="file-size me-2 ${sizeClass}">${formatFileSize(file.size)}</span>
                    <button type="button" class="btn btn-sm btn-danger" onclick="removeFile(${index})">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
        showResult('danger', '<i class="bi bi-exclamation-triangle"></i> Pilih minimal 1 file!');
        return;
    }

    const repoUrl = document.getElementById('repoUrl').value;
    const token = document.getElementById('token').value;
    const branch = document.getElementById('branch').value;
    const commitMessage = document.getElementById('commitMessage').value;

    const formData = new FormData();
    formData.append('repoUrl', repoUrl);
    formData.append('token', token);
    formData.append('branch', branch);
    formData.append('commitMessage', commitMessage);

    selectedFiles.forEach(file => {
        formData.append('files', file);
        formData.append('filePaths', file.relativePath || file.name);
    });

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Uploading...';

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Server error: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            showResult('success', 
                `<i class="bi bi-check-circle"></i> ${result.message}`, 
                result.uploadedFiles, 
                result.errors
            );
            selectedFiles = [];
            updateFileList();
            uploadForm.reset();
            document.getElementById('branch').value = 'main';
        } else {
            showResult('danger', 
                `<i class="bi bi-x-circle"></i> ${result.message}`, 
                null, 
                result.errors
            );
        }
    } catch (error) {
        console.error('Upload error:', error);
        showResult('danger', `<i class="bi bi-exclamation-triangle"></i> Error: ${error.message}`);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-upload"></i> Upload ke GitHub';
    }
});

function showResult(type, message, files = null, errors = null) {
    let html = `<div class="alert alert-${type} show-result">`;
    html += `<div class="mb-2">${message}</div>`;
    
    if (files && files.length > 0) {
        html += '<div class="mt-2"><strong><i class="bi bi-check2-all"></i> Berhasil:</strong><ul class="mb-0 mt-1">';
        files.forEach(file => {
            html += `<li><small>${file}</small></li>`;
        });
        html += '</ul></div>';
    }
    
    if (errors && errors.length > 0) {
        html += '<div class="mt-2"><strong><i class="bi bi-exclamation-circle"></i> Gagal:</strong><ul class="mb-0 mt-1">';
        errors.forEach(error => {
            html += `<li><small>${error.file}: ${error.error}</small></li>`;
        });
        html += '</ul></div>';
    }
    
    html += '</div>';
    resultDiv.innerHTML = html;
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
