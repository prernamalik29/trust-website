import { useState } from 'react';
import { uploadImage } from '../services/storage';
import './ImageUpload.css';

export default function ImageUpload({ currentImageUrl, onUploadComplete, folder, onUploadingChange }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(currentImageUrl || '');
  const [error, setError] = useState('');
  const [useUrl, setUseUrl] = useState(false);
  const [urlInput, setUrlInput] = useState(currentImageUrl || '');

  function setUploadingState(val) {
    setUploading(val);
    if (onUploadingChange) onUploadingChange(val);
  }

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
    setUploadingState(true);
    setProgress(0);

    try {
      const url = await uploadImage(file, folder || 'uploads', setProgress);
      setPreview(url);
      setUrlInput(url);
      onUploadComplete(url);
    } catch (err) {
      console.error('Upload error:', err);
      const msg = err?.message || 'Unknown error';
      if (msg.toLowerCase().includes('network')) {
        setError('Network error — please check your connection and try again.');
      } else if (msg.toLowerCase().includes('cancel')) {
        setError('Upload was cancelled.');
      } else {
        setError(`Upload failed: ${msg}. Try "Enter URL" instead.`);
      }
    }
    setUploadingState(false);
  }

  function handleUrlSubmit() {
    if (urlInput.trim()) {
      setPreview(urlInput.trim());
      onUploadComplete(urlInput.trim());
      setError('');
    }
  }

  function handleRemove() {
    setPreview('');
    setUrlInput('');
    setError('');
    onUploadComplete('');
  }

  return (
    <div className="image-upload">
      {preview && (
        <div className="image-preview">
          <img src={preview} alt="Preview" />
          <button type="button" className="remove-image-btn" onClick={handleRemove} title="Remove image">
            <i className="fas fa-times"></i>
          </button>
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
