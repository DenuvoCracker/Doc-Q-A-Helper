import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDocuments, uploadDocument, deleteDocument } from '../api';
import styles from './Home.module.css';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function Home() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(''); // '' | 'processing' | 'done' | 'error'
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const loadDocs = useCallback(async () => {
    try {
      const docs = await fetchDocuments();
      setDocuments(docs);
    } catch (err) {
      setError('Could not connect to server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const handleFile = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }
    setError('');
    setUploading(true);
    setUploadProgress(0);
    setUploadStatus('processing');

    try {
      await uploadDocument(file, setUploadProgress);
      setUploadStatus('done');
      await loadDocs();
      setTimeout(() => { setUploading(false); setUploadStatus(''); }, 1500);
    } catch (err) {
      setUploadStatus('error');
      setError(err.response?.data?.error || 'Upload failed. Try again.');
      setTimeout(() => { setUploading(false); setUploadStatus(''); }, 3000);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this document and all its data?')) return;
    try {
      await deleteDocument(id);
      setDocuments(d => d.filter(doc => doc.id !== id));
    } catch {
      setError('Could not delete document.');
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoMark}>✦</span>
          <span className={styles.logoText}>DocMind</span>
        </div>
        <p className={styles.tagline}>Upload a PDF. Ask it anything.</p>
      </header>

      <main className={styles.main}>
        {/* Upload zone */}
        <div
          className={`${styles.uploadZone} ${dragging ? styles.dragging : ''} ${uploading ? styles.uploadingState : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          aria-label="Upload PDF"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className={styles.hiddenInput}
            onChange={(e) => handleFile(e.target.files[0])}
          />

          {uploading ? (
            <div className={styles.uploadProgress}>
              <div className={styles.progressLabel}>
                {uploadStatus === 'processing' && uploadProgress < 100
                  ? `Uploading… ${uploadProgress}%`
                  : uploadStatus === 'processing'
                  ? 'Embedding chunks — this takes ~10–30 seconds…'
                  : uploadStatus === 'done'
                  ? '✓ Done!'
                  : '✗ Upload failed'}
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: uploadProgress < 100 ? `${uploadProgress}%` : '100%' }}
                />
              </div>
            </div>
          ) : (
            <>
              <div className={styles.uploadIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <p className={styles.uploadPrimary}>Drop a PDF here</p>
              <p className={styles.uploadSecondary}>or click to browse · max 20 MB</p>
            </>
          )}
        </div>

        {error && (
          <div className={styles.errorBanner} role="alert">
            {error}
          </div>
        )}

        {/* Document library */}
        <section className={styles.library}>
          <h2 className={styles.libraryHeading}>
            {loading ? 'Loading…' : documents.length === 0 ? 'No documents yet' : `${documents.length} document${documents.length === 1 ? '' : 's'}`}
          </h2>

          {loading ? (
            <div className={styles.docGrid}>
              {[1, 2, 3].map(i => (
                <div key={i} className={`${styles.docCard} skeleton`} style={{ height: '100px' }} />
              ))}
            </div>
          ) : (
            <div className={styles.docGrid}>
              {documents.map((doc, i) => (
                <button
                  key={doc.id}
                  className={styles.docCard}
                  onClick={() => navigate(`/chat/${doc.id}`, { state: { doc } })}
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  <div className={styles.docCardTop}>
                    <svg className={styles.docIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <button
                      className={styles.deleteBtn}
                      onClick={(e) => handleDelete(e, doc.id)}
                      aria-label={`Delete ${doc.original_name}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
                  </div>
                  <p className={styles.docName}>{doc.original_name}</p>
                  <div className={styles.docMeta}>
                    <span>{doc.page_count} pages · {doc.chunk_count} chunks</span>
                    <span>{formatDate(doc.created_at)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
