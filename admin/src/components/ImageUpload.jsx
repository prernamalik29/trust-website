import { useState } from 'react';
import { uploadImage } from '../services/storage';
import './ImageUpload.css';

export default function ImageUpload({ currentImageUrl, onUploadComplete, folder }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(currentImageUrl || '');
  const [error, setError] = useState('');
  const [useUrl, setUseUrl] = useState(false);
  const [urlInput, setUrlInput] = useState(currentImageUrl || '');

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setError('');
    setUploading(true);
    setProgress(0);

    try {
      const url = await uploadImage(file, folder || 'uploads', setProgress);
      setPreview(url);
      setUrlInput(url);
      onUploadComplete(url);
    } catch (err) {
      console.error('Upload error:', err);
      // Surface meaningful Firebase Storage error codes
      const code = err?.code || '';
      if (code === 'storage/unauthorized') {
        setError('Permission denied — please make sure you are logged in.');
      } else if (code === 'storage/canceled') {
        setError('Upload was cancelled.');
      } else if (code === 'storage/unknown' || err?.message?.includes('network')) {
        setError('Network error — please check your connection and try again.');
      } else {
        setError(`Upload failed: ${err?.message || 'unknown error'}. Try "Enter URL" instead.`);
      }
    }
    setUploading(false);
  }

  function handleUrlSubmit() {
    if (urlInput.trim()) {
      setPreview(urlInput.trim());
      onUploadComplete(urlInput.trim());
      setError('');
    }
  }

  return (
    <div className="image-upload">
      {preview && (
        <div className="image-preview">
          <img src={preview} alt="Preview" />
        </div>
      )}
      
      <div className="upload-toggle">
        <button 
          type="button" 
          className={`toggle-btn ${!useUrl ? 'active' : ''}`}
          onClick={() => setUseUrl(false)}
        >
          Upload File
        </button>
        <button 
          type="button" 
          className={`toggle-btn ${useUrl ? 'active' : ''}`}
          onClick={() => setUseUrl(true)}
        >
          Enter URL
        </button>
      </div>

      {useUrl ? (
        <div className="url-input-wrapper">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="url-input"
          />
          <button type="button" className="url-submit-btn" onClick={handleUrlSubmit}>
            <i className="fas fa-check"></i>
          </button>
        </div>
      ) : (
        <label className="upload-label">
          <i className="fas fa-cloud-upload-alt"></i>
          <span>{uploading ? 'Uploading...' : 'Choose Image'}</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      )}
      
      {uploading && (
        <div className="upload-progress">
          <div className="upload-progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
      )}
      {error && <p className="upload-error">{error}</p>}
    </div>
  );
}
