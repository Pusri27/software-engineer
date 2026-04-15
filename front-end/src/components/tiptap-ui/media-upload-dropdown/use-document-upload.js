"use client";
import * as React from "react"
import { useHotkeys } from "react-hotkeys-hook"
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"
import { useIsMobile } from "@/hooks/use-mobile"
import { isExtensionAvailable, isNodeTypeSelected } from "@/lib/tiptap-utils"
import { FileIcon } from "@/components/tiptap-icons/file-icon"

export const DOCUMENT_UPLOAD_SHORTCUT_KEY = "mod+shift+d"

export function canInsertDocument(editor) {
  if (!editor || !editor.isEditable) return false
  if (
    !isExtensionAvailable(editor, "documentUpload") ||
    isNodeTypeSelected(editor, ["document"])
  )
    return false

  return editor.can().insertContent({ type: "documentUpload" });
}

export function isDocumentActive(editor) {
  if (!editor || !editor.isEditable) return false
  return editor.isActive("documentUpload");
}

export function insertDocument(editor) {
  if (!editor || !editor.isEditable) return false
  if (!canInsertDocument(editor)) return false

  try {
    return editor
      .chain()
      .focus()
      .insertContent({
        type: "documentUpload",
      })
      .run();
  } catch {
    return false
  }
}

export function shouldShowButton(props) {
  const { editor, hideWhenUnavailable } = props

  if (!editor || !editor.isEditable) return false
  if (!isExtensionAvailable(editor, "documentUpload")) return false

  if (hideWhenUnavailable && !editor.isActive("code")) {
    return canInsertDocument(editor);
  }

  return true
}

export function useDocumentUpload(config) {
  const {
    editor: providedEditor,
    hideWhenUnavailable = false,
    onInserted,
  } = config || {}

  const { editor } = useTiptapEditor(providedEditor)
  const isMobile = useIsMobile()
  const [isVisible, setIsVisible] = React.useState(true)
  const canInsert = canInsertDocument(editor)
  const isActive = isDocumentActive(editor)

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

  const handleDocument = React.useCallback(() => {
    if (!editor) return false

    const success = insertDocument(editor)
    if (success) {
      onInserted?.()
    }
    return success
  }, [editor, onInserted])

  useHotkeys(DOCUMENT_UPLOAD_SHORTCUT_KEY, (event) => {
    event.preventDefault()
    handleDocument()
  }, {
    enabled: isVisible && canInsert,
    enableOnContentEditable: !isMobile,
    enableOnFormTags: true,
  })

  return {
    isVisible,
    isActive,
    handleDocument,
    canInsert,
    label: "Add document",
    shortcutKeys: DOCUMENT_UPLOAD_SHORTCUT_KEY,
    Icon: FileIcon,
  }
}

