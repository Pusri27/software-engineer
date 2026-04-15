"use client"
import * as React from "react"
import { NodeViewWrapper } from "@tiptap/react"
import { FileIcon, ExternalLink, X } from "lucide-react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { 
  formatFileSize, 
  getFileExtension,
  isBlobUrl,
  isGoogleDocsSupported,
  openDocumentViewer
} from "@/lib/document-utils"
import "@/components/tiptap-node/document-node/document-node.scss"

// Get color based on file extension
const getFileColor = (filename) => {
  const ext = getFileExtension(filename).toLowerCase()
  const colorMap = {
    pdf: '#dc2626',      // red
    doc: '#2563eb',      // blue
    docx: '#2563eb',     // blue
    xls: '#16a34a',      // green
    xlsx: '#16a34a',     // green
    ppt: '#ea580c',      // orange
    pptx: '#ea580c',     // orange
    txt: '#6b7280',      // gray
  }
  return colorMap[ext] || '#8b5cf6' // default purple
}

export const DocumentNode = (props) => {
  const { src, filename, filesize } = props.node.attrs
  const { deleteNode } = props
  const [isLoading, setIsLoading] = React.useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const fileColor = getFileColor(filename)

  const isBlob = isBlobUrl(src)
  const canPreview = !isBlob && isGoogleDocsSupported(filename)

  const handleClick = async (e) => {
    e.stopPropagation()
    
    if (!src) return
    
    setIsLoading(true)
    
    try {
      // For blob URLs (not uploaded yet), use openDocumentViewer which has proper blob handling
      await openDocumentViewer(src, filename)
    } catch (error) {
      console.error('Error opening document:', error)
      
      // Show user-friendly error message
      const errorMessage = error.message || 'Failed to open document. Please try again.'
      
      if (errorMessage.includes('no longer available') || errorMessage.includes('save your work')) {
        alert('⚠️ Document preview expired\n\n' + errorMessage)
      } else {
        alert('❌ Failed to open document\n\n' + errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClick = (e) => {
    e.stopPropagation()
    console.log("[DocumentNode] Delete button clicked for:", src)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    const { mediaManager } = await import("@/lib/media-manager")
    mediaManager.addPendingDeletion(src)
    console.log("[DocumentNode] Added to pending deletions:", mediaManager.getPendingDeletions())
    deleteNode()
    setShowDeleteDialog(false)
  }

  return (
    <NodeViewWrapper className="tiptap-document-node">
      <div 
        className={`tiptap-document-wrapper ${isLoading ? 'loading' : ''}`}
        onClick={handleClick}
        style={{ borderLeftColor: fileColor }}
      >
        <div className="tiptap-document-icon">
          <div className="tiptap-document-icon-bg" style={{ backgroundColor: fileColor }}>
            <FileIcon size={24} style={{ color: 'white' }} />
          </div>
          <span className="tiptap-document-ext" style={{ backgroundColor: fileColor, color: 'white' }}>{getFileExtension(filename)}</span>
        </div>
        <div className="tiptap-document-info">
          <div className="tiptap-document-filename">{filename || 'Untitled Document'}</div>
          <div className="tiptap-document-meta">
            {filesize && <span className="tiptap-document-filesize">{formatFileSize(filesize)}</span>}
          </div>
        </div>
        <div className="tiptap-document-actions">
          <button
            className="tiptap-document-delete"
            onClick={handleDeleteClick}
            title="Delete document"
            aria-label="Delete document"
          >
            <X size={16} />
          </button>
          <div className="tiptap-document-action">
            {isLoading ? (
              <div className="spinner"></div>
            ) : (
              <ExternalLink size={20} />
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-center">
              Delete Document
            </AlertDialogTitle>
          </AlertDialogHeader>

          <div className="py-4">
            <p className="text-center text-muted-foreground">
              Are you sure you want to delete this document?
              {filename && (
                <span className="block mt-2 font-semibold text-foreground">
                  "{filename}"
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={confirmDelete}
              variant="destructive"
              className="w-full"
            >
              Yes, Delete
            </Button>
            <Button
              onClick={() => setShowDeleteDialog(false)}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </NodeViewWrapper>
  )
}

