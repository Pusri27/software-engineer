"use client";
import * as React from "react"
import { useHotkeys } from "react-hotkeys-hook"
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"
import { useIsMobile } from "@/hooks/use-mobile"
import { isExtensionAvailable, isNodeTypeSelected } from "@/lib/tiptap-utils"
import { AudioIcon } from "@/components/tiptap-icons/audio-icon"

export const AUDIO_UPLOAD_SHORTCUT_KEY = "mod+shift+a"

export function canInsertAudio(editor) {
  if (!editor || !editor.isEditable) return false
  if (
    !isExtensionAvailable(editor, "audioUpload") ||
    isNodeTypeSelected(editor, ["audio"])
  )
    return false

  return editor.can().insertContent({ type: "audioUpload" });
}

export function isAudioActive(editor) {
  if (!editor || !editor.isEditable) return false
  return editor.isActive("audioUpload");
}

export function insertAudio(editor) {
  if (!editor || !editor.isEditable) return false
  if (!canInsertAudio(editor)) return false

  try {
    return editor
      .chain()
      .focus()
      .insertContent({
        type: "audioUpload",
      })
      .run();
  } catch {
    return false
  }
}

export function shouldShowButton(props) {
  const { editor, hideWhenUnavailable } = props

  if (!editor || !editor.isEditable) return false
  if (!isExtensionAvailable(editor, "audioUpload")) return false

  if (hideWhenUnavailable && !editor.isActive("code")) {
    return canInsertAudio(editor);
  }

  return true
}

export function useAudioUpload(config) {
  const {
    editor: providedEditor,
    hideWhenUnavailable = false,
    onInserted,
  } = config || {}

  const { editor } = useTiptapEditor(providedEditor)
  const isMobile = useIsMobile()
  const [isVisible, setIsVisible] = React.useState(true)
  const canInsert = canInsertAudio(editor)
  const isActive = isAudioActive(editor)

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

  const handleAudio = React.useCallback(() => {
    if (!editor) return false

    const success = insertAudio(editor)
    if (success) {
      onInserted?.()
    }
    return success
  }, [editor, onInserted])

  useHotkeys(AUDIO_UPLOAD_SHORTCUT_KEY, (event) => {
    event.preventDefault()
    handleAudio()
  }, {
    enabled: isVisible && canInsert,
    enableOnContentEditable: !isMobile,
    enableOnFormTags: true,
  })

  return {
    isVisible,
    isActive,
    handleAudio,
    canInsert,
    label: "Add audio",
    shortcutKeys: AUDIO_UPLOAD_SHORTCUT_KEY,
    Icon: AudioIcon,
  }
}

