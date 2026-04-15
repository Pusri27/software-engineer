"use client";
import * as React from "react"
import { NodeViewWrapper } from "@tiptap/react"
import { Button } from "@/components/tiptap-ui-primitive/button"
import "@/components/tiptap-node/document-upload-node/document-upload-node.scss"
import { focusNextNode, isValidPosition } from "@/lib/tiptap-utils"
import {
  useFileUpload,
  CloudUploadIcon,
  FileDocIcon,
  FileCornerIcon,
  UploadPreview,
  UploadDragArea,
  CloseIcon,
} from "@/components/tiptap-node/shared/upload-utils"

const DropZoneContent = ({ maxSize, limit, onDelete }) => (
  <>
    <button
      type="button"
      className="tiptap-document-upload-delete-zone"
      onClick={(e) => {
        e.stopPropagation()
        onDelete()
      }}
      title="Remove upload area"
    >
      <CloseIcon />
    </button>
    <div className="tiptap-document-upload-dropzone">
      <FileDocIcon className="tiptap-document-upload-dropzone-rect-primary" />
      <FileCornerIcon className="tiptap-document-upload-dropzone-rect-secondary" />
      <div className="tiptap-document-upload-icon-container">
        <CloudUploadIcon className="tiptap-document-upload-icon" />
      </div>
    </div>

    <div className="tiptap-document-upload-content">
      <span className="tiptap-document-upload-text">
        <em>Click to upload</em> or drag and drop
      </span>
      <span className="tiptap-document-upload-subtext">
        Maximum {limit} document{limit === 1 ? "" : "s"}, {maxSize / 1024 / 1024}MB each.
      </span>
    </div>
  </>
)

export const DocumentUploadNode = (props) => {
  const { accept, limit, maxSize } = props.node.attrs
  const inputRef = React.useRef(null)
  const extension = props.extension

  const uploadOptions = {
    maxSize,
    limit,
    accept,
    upload: extension.options.upload,
    onSuccess: extension.options.onSuccess,
    onError: extension.options.onError,
  }

  const { fileItems, uploadFiles, removeFileItem, clearAllFiles } =
    useFileUpload(uploadOptions)

  const handleUpload = async (files) => {
    console.log("Document preview started, files:", files)
    
    // Import media manager
    const { mediaManager } = await import("@/lib/media-manager")
    
    const pos = props.getPos()

    if (isValidPosition(pos)) {
      // Create blob URLs for immediate preview (no upload yet)
      const documentNodes = files.map((file, index) => {
        const blobUrl = mediaManager.addPendingUpload(file)
        const filename = file.name || "unknown"
        
        console.log("Creating document preview node:", { blobUrl, filename })
        return {
          type: "document",
          attrs: {
            src: blobUrl, // Use blob URL for preview
            filename: filename,
            filesize: file.size || 0,
          },
        }
      })

      console.log("Inserting document preview nodes:", documentNodes)
      props.editor
        .chain()
        .focus()
        .deleteRange({ from: pos, to: pos + props.node.nodeSize })
        .insertContentAt(pos, documentNodes)
        .run()

      focusNextNode(props.editor)
    } else {
      console.error("Invalid position for document insertion")
    }
  }

  const handleChange = (e) => {
    const files = e.target.files
    if (!files || files.length === 0) {
      extension.options.onError?.(new Error("No file selected"))
      return
    }
    handleUpload(Array.from(files))
  }

  const handleClick = () => {
    if (inputRef.current && fileItems.length === 0) {
      inputRef.current.value = ""
      inputRef.current.click()
    }
  }

  const hasFiles = fileItems.length > 0

  const handleDeleteNode = () => {
    props.deleteNode()
  }

  return (
    <NodeViewWrapper className="tiptap-document-upload" tabIndex={0} onClick={handleClick}>
      {!hasFiles && (
        <UploadDragArea onFile={handleUpload} className="tiptap-document-upload-drag-area">
          <DropZoneContent maxSize={maxSize} limit={limit} onDelete={handleDeleteNode} />
        </UploadDragArea>
      )}
      {hasFiles && (
        <div className="tiptap-document-upload-previews">
          {fileItems.length > 1 && (
            <div className="tiptap-document-upload-header">
              <span>Uploading {fileItems.length} files</span>
              <Button
                type="button"
                data-style="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  clearAllFiles()
                }}>
                Clear All
              </Button>
            </div>
          )}
          {fileItems.map((fileItem) => (
            <UploadPreview
              key={fileItem.id}
              fileItem={fileItem}
              onRemove={() => removeFileItem(fileItem.id)}
              className="tiptap-document-upload-preview"
              iconClass="tiptap-document-upload-file-icon"
              textClass="tiptap-document-upload-text"
              subtextClass="tiptap-document-upload-subtext"
              progressClass="tiptap-document-upload-progress"
              progressTextClass="tiptap-document-upload-progress-text" />
          ))}
        </div>
      )}
      <input
        ref={inputRef}
        name="file"
        accept={accept}
        type="file"
        multiple={limit > 1}
        onChange={handleChange}
        onClick={(e) => e.stopPropagation()} />
    </NodeViewWrapper>
  );
}

