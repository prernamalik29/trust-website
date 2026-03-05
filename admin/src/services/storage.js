import { storage } from '../config/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

/**
 * Upload an image file to Firebase Storage.
 * Requires the user to be authenticated (admin panel enforces this via ProtectedRoute).
 *
 * @param {File}     file        - The image File object from the file input
 * @param {string}   folder      - Storage folder path, e.g. 'causes', 'events', 'blog'
 * @param {Function} onProgress  - Optional callback receiving 0-100 progress value
 * @returns {Promise<string>}    - Resolves with the public download URL
 */
export function uploadImage(file, folder, onProgress) {
  return new Promise((resolve, reject) => {
    // Build a unique path: folder/timestamp_filename
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${folder || 'uploads'}/${Date.now()}_${safeName}`;
    const storageRef = ref(storage, storagePath);

    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
    });

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(Math.round(pct));
      },
      (error) => {
        console.error('Firebase Storage upload error:', error.code, error.message);
        reject(error);
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}
