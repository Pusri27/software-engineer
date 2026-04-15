"use client";
import * as React from "react"
import { useHotkeys } from "react-hotkeys-hook"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"
import { useIsMobile } from "@/hooks/use-mobile"

// --- Lib ---
import {
  isExtensionAvailable,
  isNodeTypeSelected,
} from "@/lib/tiptap-utils"

// --- Icons ---
import { VideoIcon } from "@/components/tiptap-icons/video-icon"

export const VIDEO_UPLOAD_SHORTCUT_KEY = "mod+shift+v"

export function canInsertVideo(editor) {
  if (!editor || !editor.isEditable) return false
  if (
    !isExtensionAvailable(editor, "videoUpload") ||
    isNodeTypeSelected(editor, ["video"])
  )
    return false

  return editor.can().insertContent({ type: "videoUpload" });
}

export function isVideoActive(editor) {
  if (!editor || !editor.isEditable) return false
  return editor.isActive("videoUpload");
}

export function insertVideo(editor) {
  if (!editor || !editor.isEditable) return false
  if (!canInsertVideo(editor)) return false

  try {
    return editor
      .chain()
      .focus()
      .insertContent({
        type: "videoUpload",
      })
      .run();
  } catch {
    return false
  }
}

export function shouldShowButton(props) {
  const { editor, hideWhenUnavailable } = props

  if (!editor || !editor.isEditable) return false
  if (!isExtensionAvailable(editor, "videoUpload")) return false

  if (hideWhenUnavailable && !editor.isActive("code")) {
    return canInsertVideo(editor);
  }

  return true
}

export function useVideoUpload(config) {
  const {
    editor: providedEditor,
    hideWhenUnavailable = false,
    onInserted,
  } = config || {}

  const { editor } = useTiptapEditor(providedEditor)
  const isMobile = useIsMobile()
  const [isVisible, setIsVisible] = React.useState(true)
  const canInsert = canInsertVideo(editor)
  const isActive = isVideoActive(editor)

  React.useEffect(() => {
    if (!editor) return

    const handleSelectionUpdate = () => {
      setIsVisible(shouldShowButton({ editor, hideWhenUnavailable }))
    }

    handleSelectionUpdate()

    editor.on("selectionUpdate", handleSelectionUpdate)

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate)
    };
  }, [editor, hideWhenUnavailable])

  const handleVideo = React.useCallback(() => {
    if (!editor) return false

    const success = insertVideo(editor)
    if (success) {
      onInserted?.()
    }
    return success
  }, [editor, onInserted])

  useHotkeys(VIDEO_UPLOAD_SHORTCUT_KEY, (event) => {
    event.preventDefault()
    handleVideo()
  }, {
    enabled: isVisible && canInsert,
    enableOnContentEditable: !isMobile,
    enableOnFormTags: true,
  })

  return {
    isVisible,
    isActive,
    handleVideo,
    canInsert,
    label: "Add video",
    shortcutKeys: VIDEO_UPLOAD_SHORTCUT_KEY,
    Icon: VideoIcon,
  }
}

