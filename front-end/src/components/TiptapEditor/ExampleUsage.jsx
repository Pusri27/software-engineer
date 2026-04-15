import React from "react"
import { EnhancedEditor } from "@/components/TiptapEditor"
import "./ExampleUsage.css"

/**
 * Example component showing how to use the EnhancedEditor
 * 
 * The EnhancedEditor combines:
 * 1. Title area - Single-line text input with "Enter Title" placeholder
 * 2. Tag area - Hashtag input system with "Add tag" button, soft colored tags, remove buttons
 * 3. Separator - Grey horizontal line between tags and content
 * 4. Content area - Full rich text editor with "Track your work" placeholder
 */
export const ExampleUsage = () => {
  const [title, setTitle] = React.useState("")
  const [tags, setTags] = React.useState([])

  const handleTitleChange = (newTitle) => {
    console.log("Title changed:", newTitle)
    setTitle(newTitle)
  }

  const handleTagsChange = (newTags) => {
    console.log("Tags changed:", newTags)
    setTags(newTags)
  }

  const handleSave = () => {
    console.log("Saving post:", {
      title,
      tags: tags.map(tag => tag.text),
    })
    // Add your save logic here
  }

  return (
    <div className="example-usage">
      <div className="example-header">
        <h1>Create New Post</h1>
        <button onClick={handleSave} className="save-button">
          Save Post
        </button>
      </div>

      <EnhancedEditor
        initialTitle={title}
        initialTags={tags}
        onTitleChange={handleTitleChange}
        onTagsChange={handleTagsChange}
      />
    </div>
  )
}

