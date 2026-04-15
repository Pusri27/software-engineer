"use client";
import * as React from "react"
import { NodeViewWrapper } from "@tiptap/react"
import { Button } from "@/components/tiptap-ui-primitive/button"
import "@/components/tiptap-node/video-upload-node/video-upload-node.scss"
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
      className="tiptap-video-upload-delete-zone"
      onClick={(e) => {
        e.stopPropagation()
        onDelete()
      }}
      title="Remove upload area"
    >
      <CloseIcon />
    </button>
    <div className="tiptap-video-upload-dropzone">
      <FileDocIcon className="tiptap-video-upload-dropzone-rect-primary" />
      <FileCornerIcon className="tiptap-video-upload-dropzone-rect-secondary" />
      <div className="tiptap-video-upload-icon-container">
        <CloudUploadIcon className="tiptap-video-upload-icon" />
      </div>
    </div>

    <div className="tiptap-video-upload-content">
      <span className="tiptap-video-upload-text">
        <em>Click to upload</em> or drag and drop
      </span>
      <span className="tiptap-video-upload-subtext">
        Maximum {limit} video{limit === 1 ? "" : "s"}, {maxSize / 1024 / 1024}MB each.
      </span>
    </div>
  </>
)

export const VideoUploadNode = (props) => {
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
    console.log("Video preview started, files:", files)
    
    // Import media manager
    const { mediaManager } = await import("@/lib/media-manager")
    
    const pos = props.getPos()

    if (isValidPosition(pos)) {
      // Create blob URLs for immediate preview (no upload yet)
      const videoNodes = files.map((file, index) => {
        const blobUrl = mediaManager.addPendingUpload(file)
        const filename = file.name.replace(/\.[^/.]+$/, "") || "unknown"
        
        console.log("Creating video preview node:", { blobUrl, filename })
        return {
          type: "video",
          attrs: {
            src: blobUrl, // Use blob URL for preview
            title: filename,
            controls: true,
          },
        }
      })

      console.log("Inserting video preview nodes:", videoNodes)
      props.editor
        .chain()
        .focus()
        .deleteRange({ from: pos, to: pos + props.node.nodeSize })
        .insertContentAt(pos, videoNodes)
        .run()

      focusNextNode(props.editor)
    } else {
      console.error("Invalid position for video insertion")
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
    <NodeViewWrapper className="tiptap-video-upload" tabIndex={0} onClick={handleClick}>
      {!hasFiles && (
        <UploadDragArea onFile={handleUpload} className="tiptap-video-upload-drag-area">
          <DropZoneContent maxSize={maxSize} limit={limit} onDelete={handleDeleteNode} />
        </UploadDragArea>
      )}
      {hasFiles && (
        <div className="tiptap-video-upload-previews">
          {fileItems.length > 1 && (
            <div className="tiptap-video-upload-header">
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
              className="tiptap-video-upload-preview"
              iconClass="tiptap-video-upload-file-icon"
              textClass="tiptap-video-upload-text"
              subtextClass="tiptap-video-upload-subtext"
              progressClass="tiptap-video-upload-progress"
              progressTextClass="tiptap-video-upload-progress-text" />
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

