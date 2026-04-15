import * as React from 'react'
import { ImagePlusIcon } from '@/components/tiptap-icons/image-plus-icon'
import { ChevronDownIcon } from '@/components/tiptap-icons/chevron-down-icon'
import './upload-dropdown.css'

export function UploadDropdown({ editor }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef(null)

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleFileUpload = (type) => {
    const input = document.createElement('input')
    input.type = 'file'
    
    switch(type) {
      case 'image':
        input.accept = 'image/*'
        break
      case 'video':
        input.accept = 'video/*'
        break
      case 'audio':
        input.accept = 'audio/*'
        break
      case 'document':
        input.accept = '.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx'
        break
    }

    input.onchange = async (e) => {
      const file = e.target.files?.[0]
      if (!file) return

      try {
        // For images, use existing image upload
        if (type === 'image') {
          const reader = new FileReader()
          reader.onload = (event) => {
            editor?.chain().focus().setImage({ src: event.target.result }).run()
          }
          reader.readAsDataURL(file)
        } else {
          // For other types, you can implement custom logic
          // For now, just show an alert with file info
          alert(`${type} upload: ${file.name}\nSize: ${(file.size / 1024).toFixed(2)} KB\n\nImplement your upload logic here!`)
        }
        setIsOpen(false)
      } catch (error) {
        console.error(`${type} upload failed:`, error)
        alert(`Failed to upload ${type}`)
      }
    }

    input.click()
  }

  if (!editor) return null

  return (
    <div className="upload-dropdown-container" ref={dropdownRef}>
      <button
        type="button"
        className="upload-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Upload media"
      >
        <ImagePlusIcon />
        <span>Upload</span>
        <ChevronDownIcon className={isOpen ? 'rotated' : ''} />
      </button>

      {isOpen && (
        <div className="upload-dropdown-menu">
          <button
            type="button"
            className="upload-dropdown-item"
            onClick={() => handleFileUpload('image')}
          >
            <span className="upload-icon">🖼️</span>
            <span>Image</span>
          </button>
          <button
            type="button"
            className="upload-dropdown-item"
            onClick={() => handleFileUpload('video')}
          >
            <span className="upload-icon">🎥</span>
            <span>Video</span>
          </button>
          <button
            type="button"
            className="upload-dropdown-item"
            onClick={() => handleFileUpload('audio')}
          >
            <span className="upload-icon">🎵</span>
            <span>Audio</span>
          </button>
          <button
            type="button"
            className="upload-dropdown-item"
            onClick={() => handleFileUpload('document')}
          >
            <span className="upload-icon">📄</span>
            <span>Document</span>
          </button>
        </div>
      )}
    </div>
  )
}
