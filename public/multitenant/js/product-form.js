
   document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('fileInput');
  const uploadArea = document.getElementById('uploadArea');
  const chooseBtn = document.getElementById('chooseBtn');
  const removeBtn = document.getElementById('removeBtn');
  const clearBtn = document.getElementById('clearBtn');
  const previewBox = document.getElementById('previewBox');
  const previewText = document.getElementById('previewText');
  const imgError = document.getElementById('imgError');
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  if (!fileInput || !uploadArea) return; // ✅ Prevents running on wrong page

  // ---------- Helper functions ----------
  function showError(msg) {
    imgError.textContent = msg;
    imgError.style.display = 'block';
  }

  function clearError() {
    imgError.textContent = '';
    imgError.style.display = 'none';
  }

  function renderPreview(file) {
    clearError();
    const reader = new FileReader();
    reader.onload = function (e) {
      previewBox.innerHTML = '';
      const img = document.createElement('img');
      img.src = e.target.result;
      img.alt = file.name || 'Preview';
      previewBox.appendChild(img);
      removeBtn.style.display = 'inline-flex';
      if (previewText) previewText.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }

  function resetPreview() {
    previewBox.innerHTML = '<p class="help" id="previewText">Drop an image here or click to choose</p>';
    removeBtn.style.display = 'none';
    clearError();
    fileInput.value = '';
  }

  // ---------- Button events ----------
  chooseBtn.addEventListener('click', () => fileInput.click());
  removeBtn.addEventListener('click', resetPreview);
  clearBtn.addEventListener('click', resetPreview);

  // ---------- File Input ----------
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return resetPreview();
    if (!file.type.startsWith('image/')) return showError('Only image files are allowed.');
    if (file.size > MAX_SIZE) return showError('Image too large. Max 5MB.');
    renderPreview(file);
  });

  // ---------- Drag & Drop ----------
  ['dragenter', 'dragover'].forEach(evt => {
    uploadArea.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadArea.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(evt => {
    uploadArea.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadArea.classList.remove('dragover');
    });
  });

  uploadArea.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    if (!dt || !dt.files || !dt.files.length) return;
    const file = dt.files[0];
    if (!file.type.startsWith('image/')) return showError('Only image files are allowed.');
    if (file.size > MAX_SIZE) return showError('Image too large. Max 5MB.');
    fileInput.files = dt.files; // attach to input so form submits it
    renderPreview(file);
  });

  // ---------- Allow click on upload area ----------
  uploadArea.addEventListener('click', () => fileInput.click());

  // ---------- Form validation ----------
  const form = document.querySelector('.product-card');
  if (form) {
    form.addEventListener('submit', (e) => {
      const name = form.querySelector('input[name="name"]');
      const price = form.querySelector('input[name="price"]');

      if (!name.value.trim()) {
        e.preventDefault();
        name.focus();
        alert('Please provide a product name.');
        return;
      }

      if (!price.value || Number(price.value) < 0) {
        e.preventDefault();
        price.focus();
        alert('Please provide a valid price.');
        return;
      }
    });
  }
});
