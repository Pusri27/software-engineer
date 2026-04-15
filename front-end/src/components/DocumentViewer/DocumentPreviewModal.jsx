import React, { useState, useEffect } from 'react';
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import { X } from 'lucide-react';
import './DocumentPreviewModal.css';

/**
 * Modal component for previewing documents using @cyntler/react-doc-viewer
 * Supports: PDF, Word, Excel, PowerPoint, Images, and more
 */
export const DocumentPreviewModal = ({ fileUrl, filename, onClose }) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get file extension for fileType
  const getFileType = (filename) => {
    if (!filename) return undefined;
    const ext = filename.split('.').pop()?.toLowerCase();
    // Map extensions to DocViewer supported types
    const typeMap = {
      'pdf': 'pdf',
      'doc': 'doc',
      'docx': 'docx',
      'xls': 'xls',
      'xlsx': 'xlsx',
      'ppt': 'ppt',
      'pptx': 'pptx',
      'png': 'png',
      'jpg': 'jpg',
      'jpeg': 'jpg',
      'gif': 'gif',
      'bmp': 'bmp',
      'txt': 'txt',
      'csv': 'csv',
    };
    return typeMap[ext];
  };

  // Prepare document for DocViewer
  const docs = [
    {
      uri: fileUrl,
      fileName: filename || 'document',
      fileType: getFileType(filename),
    }
  ];

  const handleError = (e) => {
    console.error('[DocumentPreviewModal] Error loading document:', e);
    setError('Failed to load document preview. The file format might not be supported for blob URLs.');
    setLoading(false);
  };

  const handleDocumentLoad = () => {
    console.log('[DocumentPreviewModal] Document loaded successfully');
    setLoading(false);
  };

  // Log for debugging
  useEffect(() => {
    console.log('[DocumentPreviewModal] Opened with:', { fileUrl, filename, fileType: getFileType(filename) });
  }, [fileUrl, filename]);

  return (
    <div className="document-preview-overlay" onClick={onClose}>
      <div className="document-preview-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="document-preview-header">
          <div className="document-preview-title">
            <span className="document-icon">📄</span>
            <span className="document-filename">{filename || 'Document Preview'}</span>
          </div>
          <button 
            className="document-preview-close"
            onClick={onClose}
            aria-label="Close preview"
          >
            <X size={24} />
          </button>
        </div>

        {/* Document Viewer */}
        <div className="document-preview-content">
          {error ? (
            <div className="document-preview-error">
              <p>{error}</p>
              <p style={{ fontSize: '14px', marginTop: '12px', color: '#6b7280' }}>
                Try saving your work first, then the document will be previewable with full formatting.
              </p>
              <button onClick={onClose} className="error-close-btn">Close</button>
            </div>
          ) : (
            <>
              {loading && (
                <div className="document-preview-loading">
                  <div className="spinner-large"></div>
                  <p>Loading preview...</p>
                </div>
              )}
              <DocViewer
                documents={docs}
                pluginRenderers={DocViewerRenderers}
                config={{
                  header: {
                    disableHeader: true,
                    disableFileName: true,
                    retainURLParams: false,
                  },
                  csvDelimiter: ',',
                  pdfZoom: {
                    defaultZoom: 1.0,
                    zoomJump: 0.2,
                  },
                  pdfVerticalScrollByDefault: true,
                }}
                style={{ height: '100%', display: loading ? 'none' : 'block' }}
                theme={{
                  primary: '#667eea',
                  secondary: '#764ba2',
                  tertiary: '#f9fafb',
                  textPrimary: '#111827',
                  textSecondary: '#6b7280',
                  textTertiary: '#9ca3af',
                  disableThemeScrollbar: false,
                }}
                onError={handleError}
                onDocumentLoad={handleDocumentLoad}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

