import * as React from "react"
import { CloseIcon } from "@/components/tiptap-icons"
import "./TagInput.scss"

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

export const TagInput = ({ tags = [], onTagsChange }) => {
  const [isInputVisible, setIsInputVisible] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const inputRef = React.useRef(null)

  const getRandomColor = () => {
    return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]
  }

  const handleAddTagClick = () => {
    setIsInputVisible(true)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  const handleInputChange = (e) => {
    setInputValue(e.target.value)
  }

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTags()
    } else if (e.key === "Escape") {
      setIsInputVisible(false)
      setInputValue("")
    }
  }

  const addTags = () => {
    if (!inputValue.trim()) return

    // Split by spaces and filter out empty strings
    const newTags = inputValue
      .split(" ")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
      .map((tag) => {
        // Ensure tag starts with #
        const tagText = tag.startsWith("#") ? tag : `#${tag}`
        return {
          id: Date.now() + Math.random(),
          text: tagText,
          color: getRandomColor(),
        }
      })

    if (newTags.length > 0) {
      onTagsChange?.([...tags, ...newTags])
      setInputValue("")
      setIsInputVisible(false)
    }
  }

  const handleRemoveTag = (tagId) => {
    onTagsChange?.(tags.filter((tag) => tag.id !== tagId))
  }

  const handleInputBlur = () => {
    // Add tags if there's content when losing focus
    if (inputValue.trim()) {
      addTags()
    } else {
      setIsInputVisible(false)
    }
  }

  return (
    <div className="tag-input-container">
      <div className="tag-list">
        {!isInputVisible && (
          <button
            className="add-tag-button"
            onClick={handleAddTagClick}
            type="button">
            Add tag
          </button>
        )}

        {isInputVisible && (
          <div className="tag-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              className="tag-input"
              placeholder="Type hashtags separated by space..."
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              onBlur={handleInputBlur}
            />
            <button
              className="add-tags-submit-button"
              onClick={addTags}
              type="button"
              onMouseDown={(e) => e.preventDefault()} // Prevent input blur
            >
              Add
            </button>
          </div>
        )}

        {tags.map((tag) => (
          <div
            key={tag.id}
            className="tag-item"
            style={{ backgroundColor: tag.color }}>
            <span className="tag-text">{tag.text}</span>
            <button
              className="tag-remove-button"
              onClick={() => handleRemoveTag(tag.id)}
              type="button"
              aria-label="Remove tag">
              <CloseIcon />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

