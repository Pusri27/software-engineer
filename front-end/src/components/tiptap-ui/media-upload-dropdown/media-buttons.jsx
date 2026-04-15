import * as React from "react"
import { Button } from "@/components/tiptap-ui-primitive/button"
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"
import { useImageUpload } from "@/components/tiptap-ui/image-upload-button"
import { useVideoUpload } from "./use-video-upload"
import { useAudioUpload } from "./use-audio-upload"
import { useDocumentUpload } from "./use-document-upload"

const UPLOAD_HOOKS = {
  image: useImageUpload,
  video: useVideoUpload,
  audio: useAudioUpload,
  document: useDocumentUpload,
}

const UPLOAD_HANDLERS = {
  image: (upload) => upload.handleImage(),
  video: (upload) => upload.handleVideo(),
  audio: (upload) => upload.handleAudio(),
  document: (upload) => upload.handleDocument(),
}

export const MediaUploadButton = React.forwardRef(function MediaUploadButton({
  editor: providedEditor,
  type,
  text,
  showTooltip = true,
  onInserted,
}, ref) {
  const { editor } = useTiptapEditor(providedEditor)
  const useUpload = UPLOAD_HOOKS[type]
  const upload = useUpload?.({ editor, onInserted })

  if (!upload) return null

  const handleClick = (event) => {
    event.preventDefault()
    UPLOAD_HANDLERS[type]?.(upload)
  }

  const { Icon, label, canInsert, isActive } = upload

  return (
    <Button
      type="button"
      data-style="ghost-menu"
      data-active-state={isActive ? "on" : "off"}
      role="menuitem"
      tabIndex={-1}
      disabled={!canInsert}
      data-disabled={!canInsert}
      aria-label={label}
      tooltip={showTooltip ? label : undefined}
      onClick={handleClick}
      style={{ width: "100%", justifyContent: "flex-start" }}>
      <Icon className="tiptap-button-icon" />
      {text && <span className="tiptap-button-text">{text}</span>}
    </Button>
  );
});

