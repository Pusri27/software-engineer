import * as React from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import "./TitleEditor.scss"

export const TitleEditor = ({ onChange, initialValue = "" }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        hardBreak: false,
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder: "Enter Title",
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: initialValue,
    editorProps: {
      attributes: {
        class: "title-editor-content",
        "data-title-editor": "true",
      },
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText()
      onChange?.(text)
    },
  })

  // Update content when initialValue changes
  React.useEffect(() => {
    if (editor && initialValue && editor.getText() !== initialValue) {
      editor.commands.setContent(initialValue)
    }
  }, [initialValue, editor])

  React.useEffect(() => {
    if (!editor) return

    // Prevent multi-line in title (convert Enter to nothing)
    const handleKeyDown = (event) => {
      if (event.key === "Enter") {
        event.preventDefault()
      }
    }

    const editorElement = editor.view.dom
    editorElement.addEventListener("keydown", handleKeyDown)

    return () => {
      editorElement.removeEventListener("keydown", handleKeyDown)
    }
  }, [editor])

  return (
    <div className="title-editor">
      <EditorContent editor={editor} />
    </div>
  )
}

