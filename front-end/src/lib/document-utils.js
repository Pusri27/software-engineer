import { 
  TEXT_FILE_EXTENSIONS, 
  IMAGE_EXTENSIONS,
  GOOGLE_DOCS_SUPPORTED,
  VIEWER_CONFIG
} from "@/lib/media-constants"

/**
 * Format file size in bytes to human-readable format
 */
export const formatFileSize = (bytes) => {
  if (!bytes) return ""
  const sizes = ["B", "KB", "MB", "GB"]
  if (bytes === 0) return "0 B"
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename) => {
  if (!filename) return "FILE"
  const ext = filename.split('.').pop()?.toLowerCase()
  return ext ? ext.toUpperCase() : "FILE"
}

/**
 * Check if URL is a blob URL (local development)
 */
export const isBlobUrl = (url) => {
  return url?.startsWith('blob:')
}

/**
 * Check if document can be previewed with Google Docs Viewer
 */
export const isGoogleDocsSupported = (filename) => {
  if (!filename) {
    return false
  }
  const ext = filename.split('.').pop()?.toLowerCase()
  const isSupported = ext && GOOGLE_DOCS_SUPPORTED.includes(ext)
  return isSupported
}

/**
 * Get the appropriate viewer URL for a document
 * @param fileUrl - The public URL of the document
 * @param filename - The filename to determine format
 * @returns The complete viewer URL
 */
export const getDocumentViewerUrl = (fileUrl, filename) => {
  if (!fileUrl || isBlobUrl(fileUrl)) return null
  
  if (!isGoogleDocsSupported(filename)) return fileUrl
  
  const ext = filename.split('.').pop()?.toLowerCase()
  
  // Use Microsoft Office Online Viewer for Office documents (better compatibility)
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) {
    const encodedUrl = encodeURIComponent(fileUrl)
    return `${VIEWER_CONFIG.OFFICE_ONLINE_VIEWER_URL}?src=${encodedUrl}`
  }
  
  // Use Google Docs Viewer for other supported formats (PDF, TXT)
  const encodedUrl = encodeURIComponent(fileUrl)
  return `${VIEWER_CONFIG.GOOGLE_DOCS_VIEWER_URL}?url=${encodedUrl}&embedded=true`
}

/**
 * Open document in appropriate viewer
 * @param fileUrl - The document URL (blob or public)
 * @param filename - The filename
 * @returns Promise that resolves when viewer is opened
 */
export const openDocumentViewer = async (fileUrl, filename) => {
  
  if (!fileUrl) {
    throw new Error('No file URL provided')
  }

  // Development mode: blob URLs need special handling
  if (isBlobUrl(fileUrl)) {
    try {
      return await openBlobDocument(fileUrl, filename)
    } catch (error) {
      console.error('[openDocumentViewer] Failed to open blob document:', error)
      throw new Error('This document preview is no longer available. Please save your work to upload the document, then you can preview it.')
    }
  }

  // Production mode: Use Office/Google Docs Viewer for supported formats
  const isSupported = isGoogleDocsSupported(filename)
  
  if (isSupported) {
    const viewerUrl = getDocumentViewerUrl(fileUrl, filename)
    
    // Open in new window
    const viewerWindow = window.open(viewerUrl, '_blank', VIEWER_CONFIG.POPUP_OPTIONS)
    
    // If popup was blocked or viewer fails, offer download as fallback
    if (!viewerWindow) {
      console.warn('[openDocumentViewer] Popup blocked, opening direct link')
      window.open(fileUrl, '_blank', 'noopener,noreferrer')
    }
    return
  }

  // Fallback: Open directly
  window.open(fileUrl, '_blank', 'noopener,noreferrer')
}

/**
 * Handle blob URL documents (development mode)
 * Creates a custom viewer page for blob URLs
 */
const openBlobDocument = async (blobUrl, filename) => {
  try {
    const response = await fetch(blobUrl)
    
    // Check if the blob URL is still valid
    if (!response.ok) {
      throw new Error(`Blob URL expired or invalid (${response.status})`)
    }
    
    const blob = await response.blob()
    const fileExt = filename?.split('.').pop()?.toLowerCase() || ''
    const mimeType = blob.type

    let htmlContent = ''

    // Handle text files
    if (mimeType?.startsWith('text/') || TEXT_FILE_EXTENSIONS.includes(fileExt)) {
      const text = await blob.text()
      htmlContent = createTextViewerHTML(filename, text)
    } 
    // Handle images
    else if (mimeType?.startsWith('image/') || IMAGE_EXTENSIONS.includes(fileExt)) {
      const url = URL.createObjectURL(blob)
      htmlContent = createImageViewerHTML(filename, url)
    }
    // Handle PDFs
    else if (mimeType === 'application/pdf' || fileExt === 'pdf') {
      const url = URL.createObjectURL(blob)
      htmlContent = createPdfViewerHTML(filename, url)
    }
    // Handle Office documents (Word, Excel, PowerPoint) - use Office Web Viewer
    else if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExt)) {
      // For blob URLs, we need to upload temporarily or show a viewer
      // We'll use Office Online Viewer which requires a public URL
      htmlContent = await createOfficePreviewHTML(filename, blob, fileExt)
    }
    // Other documents - show download prompt
    else {
      htmlContent = createDownloadViewerHTML(filename, blobUrl)
    }

    const htmlBlob = new Blob([htmlContent], { type: 'text/html' })
    const htmlUrl = URL.createObjectURL(htmlBlob)
    window.open(htmlUrl, '_blank', VIEWER_CONFIG.POPUP_OPTIONS)
  } catch (error) {
    console.error('Error opening document:', error)
    // Fallback: download the file
    downloadFile(blobUrl, filename)
  }
}

/**
 * Download a file
 */
export const downloadFile = (url, filename) => {
  const link = document.createElement('a')
  link.href = url
  link.download = filename || 'document'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Create HTML viewer for Office documents (Word, Excel, PowerPoint)
 * Shows a simple file info card since browsers can't directly preview Office docs without external services
 */
const createOfficePreviewHTML = async (filename, blob, fileExt) => {
  const extension = fileExt.toUpperCase()
  const fileIcon = {
    'DOCX': '📝', 'DOC': '📝',
    'XLSX': '📊', 'XLS': '📊',
    'PPTX': '📽️', 'PPT': '📽️',
  }[extension] || '📄'

  const fileSize = blob.size
  const formattedSize = formatFileSize(fileSize)

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${filename || 'Document Preview'}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: system-ui, -apple-system, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 20px;
          padding: 50px 40px;
          max-width: 600px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          text-align: center;
        }
        .icon {
          font-size: 80px;
          margin-bottom: 20px;
          animation: bounce 2s infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .badge {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 20px;
        }
        h1 {
          color: #111827;
          font-size: 24px;
          margin-bottom: 12px;
          word-break: break-word;
        }
        .file-info {
          background: #f9fafb;
          padding: 20px;
          border-radius: 12px;
          margin: 24px 0;
          display: inline-block;
          min-width: 200px;
        }
        .file-info-row {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          margin: 8px 0;
          color: #6b7280;
          font-size: 14px;
        }
        .file-info-label {
          font-weight: 600;
          color: #374151;
        }
        .message {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 16px;
          border-radius: 8px;
          margin: 24px 0;
          text-align: left;
          font-size: 14px;
          line-height: 1.6;
          color: #92400e;
        }
        .message strong {
          color: #78350f;
        }
        .actions {
          margin-top: 30px;
        }
        .btn {
          display: inline-block;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          text-decoration: none;
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: pointer;
          border: none;
          font-size: 15px;
          margin: 0 8px;
        }
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
        }
        .note {
          margin-top: 20px;
          font-size: 13px;
          color: #6b7280;
          line-height: 1.6;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">${fileIcon}</div>
        <span class="badge">${extension} DOCUMENT</span>
        <h1>${filename || 'Untitled Document'}</h1>
        
        <div class="file-info">
          <div class="file-info-row">
            <span class="file-info-label">Type:</span>
            <span>${extension}</span>
          </div>
          <div class="file-info-row">
            <span class="file-info-label">Size:</span>
            <span>${formattedSize}</span>
          </div>
          <div class="file-info-row">
            <span class="file-info-label">Status:</span>
            <span>📍 Not Uploaded</span>
          </div>
        </div>

        <div class="message">
          <strong>⏳ Preview Not Available Yet</strong><br><br>
          Office documents (Word, Excel, PowerPoint) require a <strong>public URL</strong> to preview using Google Docs Viewer.<br><br>
          <strong>✅ After you save your work</strong>, this document will be uploaded to the cloud and you'll be able to preview it with full formatting!
        </div>

        <div class="note">
          💡 Once saved, clicking this document will open it in Google Docs Viewer with full preview capabilities - no downloads needed!
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Convert blob to base64
 */
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Create HTML viewer for text files
 */
export const createTextViewerHTML = (filename, textContent) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${filename || 'Document Preview'}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', monospace;
          background: #f5f5f5;
          color: #1f2937;
        }
        .header {
          background: white;
          padding: 16px 24px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          gap: 12px;
          position: sticky;
          top: 0;
          z-index: 10;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .filename {
          font-weight: 600;
          color: #111827;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .content {
          background: white;
          padding: 24px;
          margin: 20px;
          border-radius: 8px;
          max-width: 1200px;
          margin: 20px auto;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          white-space: pre-wrap;
          word-wrap: break-word;
          line-height: 1.6;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <span>📄</span>
        <span class="filename">${filename || 'Document'}</span>
      </div>
      <div class="content">${textContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    </body>
    </html>
  `
}

/**
 * Create HTML viewer for images
 */
export const createImageViewerHTML = (filename, imageUrl) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${filename || 'Image Preview'}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: system-ui, -apple-system, sans-serif;
          background: #1f2937;
          display: flex;
          flex-direction: column;
          height: 100vh;
        }
        .header {
          background: #111827;
          padding: 16px 24px;
          border-bottom: 1px solid #374151;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .filename {
          font-weight: 600;
          color: #f9fafb;
        }
        .content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        }
      </style>
    </head>
    <body>
      <div class="header">
        <span>🖼️</span>
        <span class="filename">${filename || 'Image'}</span>
      </div>
      <div class="content">
        <img src="${imageUrl}" alt="${filename || 'Image'}" />
      </div>
    </body>
    </html>
  `
}

/**
 * Create HTML viewer for PDFs
 */
export const createPdfViewerHTML = (filename, pdfUrl) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${filename || 'PDF Preview'}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: system-ui, -apple-system, sans-serif;
          background: #f5f5f5;
          display: flex;
          flex-direction: column;
          height: 100vh;
        }
        .header {
          background: white;
          padding: 16px 24px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .filename {
          font-weight: 600;
          color: #111827;
        }
        .content {
          flex: 1;
          display: flex;
        }
        embed {
          width: 100%;
          height: 100%;
          border: none;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <span>📄</span>
        <span class="filename">${filename || 'PDF Document'}</span>
      </div>
      <div class="content">
        <object data="${pdfUrl}#view=FitH" type="application/pdf" width="100%" height="100%">
          <iframe src="${pdfUrl}" width="100%" height="100%"></iframe>
        </object>
      </div>
    </body>
    </html>
  `
}

/**
 * Create HTML viewer for documents that need to be downloaded (Word, Excel, etc.)
 */
export const createDownloadViewerHTML = (filename, downloadUrl) => {
  const extension = filename?.split('.').pop()?.toUpperCase() || 'FILE'
  const fileIcon = {
    'DOCX': '📝', 'DOC': '📝',
    'XLSX': '📊', 'XLS': '📊',
    'PPTX': '📽️', 'PPT': '📽️',
  }[extension] || '📄'

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${filename || 'Document'}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: system-ui, -apple-system, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          color: white;
        }
        .container {
          text-align: center;
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          padding: 60px 40px;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          max-width: 500px;
        }
        .icon {
          font-size: 80px;
          margin-bottom: 20px;
          animation: bounce 2s infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        h1 {
          font-size: 24px;
          margin-bottom: 12px;
          font-weight: 600;
        }
        .filename {
          font-size: 16px;
          opacity: 0.9;
          margin-bottom: 30px;
          word-break: break-word;
        }
        .info {
          background: rgba(255,255,255,0.15);
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 30px;
          font-size: 14px;
          line-height: 1.6;
        }
        .highlight {
          background: rgba(255,255,255,0.2);
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 600;
        }
        .download-btn {
          display: inline-block;
          background: white;
          color: #667eea;
          padding: 14px 32px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          margin-bottom: 15px;
        }
        .download-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }
        .note {
          margin-top: 20px;
          font-size: 13px;
          opacity: 0.8;
          background: rgba(255,255,255,0.1);
          padding: 12px;
          border-radius: 8px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">${fileIcon}</div>
        <h1>Preview Not Available Yet</h1>
        <div class="filename">${filename || 'Untitled Document'}</div>
        <div class="info">
          <strong>⏳ Document is not uploaded yet</strong><br><br>
          Google Docs Viewer requires a public URL to preview ${extension} files.<br>
          <span class="highlight">Save your work</span> to upload this document, then it will be previewable!
        </div>
        <a href="${downloadUrl}" download="${filename}" class="download-btn">
          📥 Download to View Now
        </a>
        <div class="note">
          💡 After saving, clicking this document will open it in Google Docs Viewer
        </div>
      </div>
    </body>
    </html>
  `
}

