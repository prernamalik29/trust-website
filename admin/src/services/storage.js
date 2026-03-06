const CLOUD_NAME = 'dplbix7pz';
const UPLOAD_PRESET = 'trust-website';

/**
 * Upload an image file to Cloudinary using an unsigned upload preset.
 *
 * @param {File}     file        - The image File object from the file input
 * @param {string}   folder      - Cloudinary folder, e.g. 'causes', 'events', 'blog'
 * @param {Function} onProgress  - Optional callback receiving 0-100 progress value
 * @returns {Promise<string>}    - Resolves with the public secure URL
 */
export function uploadImage(file, folder, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', folder || 'uploads');

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data.secure_url);
        } catch {
          reject(new Error('Invalid response from Cloudinary'));
        }
      } else {
        let message = `Upload failed (HTTP ${xhr.status})`;
        try {
          const err = JSON.parse(xhr.responseText);
          if (err?.error?.message) message = err.error.message;
        } catch { /* ignore */ }
        reject(new Error(message));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error — upload failed')));
    xhr.addEventListener('abort', () => reject(new Error('Upload was cancelled')));

    xhr.send(formData);
  });
}
