import * as React from "react"
import { TitleEditor } from "./TitleEditor"
import { TagInput } from "./TagInput"
import "./EnhancedEditor.scss"

const TAG_COLORS = [
  "#dbeafe", // blue
  "#fce7f3", // pink
  "#e0e7ff", // indigo
  "#ddd6fe", // violet
  "#fef3c7", // yellow
  "#d1fae5", // green
  "#fee2e2", // red
  "#e5e7eb", // gray
]

const getRandomColor = () => {
  return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]
}

// Helper to normalize tags from backend (strings or objects)
const normalizeTags = (tags) => {
  if (!Array.isArray(tags)) return []
  
  return tags.map((tag, index) => {
    if (typeof tag === 'string') {
      return {
        id: Date.now() + index,
        text: tag.startsWith('#') ? tag : `#${tag}`,
        color: getRandomColor()
      }
    }
    return tag // Already in correct format
  })
}

export const EnhancedEditor = ({
  initialTitle = "",
  initialTags = [],
  onTitleChange,
  onTagsChange,
  onFocusChange,
  editor,
}) => {
  const [title, setTitle] = React.useState(initialTitle)
  const [tags, setTags] = React.useState(normalizeTags(initialTags))
  const containerRef = React.useRef(null)

  // Update title when initialTitle changes
  React.useEffect(() => {
    setTitle(initialTitle)
  }, [initialTitle])

  // Update tags when initialTags changes
  React.useEffect(() => {
    setTags(normalizeTags(initialTags))
  }, [initialTags])

  const handleTitleChange = (newTitle) => {
    setTitle(newTitle)
    onTitleChange?.(newTitle)
  }

  const handleTagsChange = (newTags) => {
    setTags(newTags)
    // Convert tags back to strings for backend
    const tagStrings = newTags.map(tag => tag.text)
    onTagsChange?.(tagStrings)
  }

  // Click handler to focus content editor when clicking on header area
  const handleClick = (e) => {
    // If clicking directly on the header container (empty space below separator)
    if (e.target === containerRef.current || 
        e.target.classList.contains('enhanced-editor-separator')) {
      editor?.commands.focus('end')
    }
  }

  React.useEffect(() => {
    const handleFocusIn = (e) => {
      if (containerRef.current?.contains(e.target)) {
        onFocusChange?.(true)
      }
    }

    const handleFocusOut = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.relatedTarget)) {
        onFocusChange?.(false)
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('focusin', handleFocusIn)
      container.addEventListener('focusout', handleFocusOut)
    }

    return () => {
      if (container) {
        container.removeEventListener('focusin', handleFocusIn)
        container.removeEventListener('focusout', handleFocusOut)
      }
    }
  }, [onFocusChange])

  return (
    <div className="enhanced-editor-header" ref={containerRef} onClick={handleClick}>
      <TitleEditor initialValue={title} onChange={handleTitleChange} />
      <TagInput tags={tags} onTagsChange={handleTagsChange} />
      <div className="enhanced-editor-separator" />
    </div>
  )
}

