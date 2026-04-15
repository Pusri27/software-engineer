# Enhanced Editor

A comprehensive rich text editor component with title, tags, and content sections built with Tiptap v2.

## Overview

The Enhanced Editor combines multiple editing areas into a structured post creation interface:

1. **Title Area** - Single-line text input for the post title
2. **Tag Area** - Hashtag management system with colorful tags
3. **Separator** - Visual divider between sections
4. **Content Area** - Full-featured rich text editor

## Features

### Title Editor
- Single-line text input (Enter key disabled)
- Large, bold typography (2rem, font-weight 700)
- "Enter Title" placeholder
- Dark mode support
- Text-only (no formatting)

### Tag Input
- **Add Tag Button** - Soft colored button to open input
- **Hashtag Input** - Type multiple hashtags separated by spaces
- **Auto-prefix** - Automatically adds # if not present
- **Colorful Tags** - Each tag gets a random soft color from 8 predefined colors:
  - Blue (#dbeafe)
  - Pink (#fce7f3)
  - Indigo (#e0e7ff)
  - Violet (#ddd6fe)
  - Yellow (#fef3c7)
  - Green (#d1fae5)
  - Red (#fee2e2)
  - Gray (#e5e7eb)
- **Remove Tags** - Individual 'x' button on each tag
- **Keyboard Shortcuts**:
  - `Enter` - Add tags
  - `Escape` - Cancel input
- **Auto-blur** - Adds tags when input loses focus

### Content Editor
- Full Tiptap rich text editing
- "Track your work" placeholder
- All media upload capabilities (images, videos, audio, documents)
- Text formatting (bold, italic, underline, strike, etc.)
- Lists (bullet, ordered, task lists)
- Headings (H1-H4)
- Code blocks and blockquotes
- Text alignment
- Link insertion
- Color highlighting
- Undo/redo functionality

## Installation

The components are already integrated. Import from the TiptapEditor module:

```javascript
import { EnhancedEditor } from "@/components/TiptapEditor"
```

## Usage

### Basic Usage

```jsx
import React from "react"
import { EnhancedEditor } from "@/components/TiptapEditor"

function CreatePost() {
  return <EnhancedEditor />
}
```

### With State Management

```jsx
import React from "react"
import { EnhancedEditor } from "@/components/TiptapEditor"

function CreatePost() {
  const [title, setTitle] = React.useState("")
  const [tags, setTags] = React.useState([])

  const handleSave = () => {
    const postData = {
      title,
      tags: tags.map(tag => tag.text),
    }
    console.log("Saving:", postData)
    // Send to backend
  }

  return (
    <div>
      <EnhancedEditor
        initialTitle={title}
        initialTags={tags}
        onTitleChange={setTitle}
        onTagsChange={setTags}
      />
      <button onClick={handleSave}>Save Post</button>
    </div>
  )
}
```

### With Initial Data

```jsx
const existingPost = {
  title: "My Post Title",
  tags: [
    { id: 1, text: "#react", color: "#dbeafe" },
    { id: 2, text: "#javascript", color: "#fce7f3" },
  ],
}

<EnhancedEditor
  initialTitle={existingPost.title}
  initialTags={existingPost.tags}
  onTitleChange={(title) => console.log("Title:", title)}
  onTagsChange={(tags) => console.log("Tags:", tags)}
/>
```

## Props

### EnhancedEditor Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialTitle` | `string` | `""` | Initial title text |
| `initialTags` | `array` | `[]` | Initial tags array with `{id, text, color}` objects |
| `onTitleChange` | `function` | - | Callback when title changes, receives new title string |
| `onTagsChange` | `function` | - | Callback when tags change, receives new tags array |

## Component Structure

```
EnhancedEditor/
├── TitleEditor.jsx          # Single-line title input
├── TitleEditor.scss         # Title styling
├── TagInput.jsx             # Hashtag management
├── TagInput.scss            # Tag styling
├── EnhancedEditor.jsx       # Main wrapper component
├── EnhancedEditor.scss      # Layout styling
├── index.js                 # Exports
└── ExampleUsage.jsx         # Usage example
```

## Styling

All components support light and dark modes automatically using CSS variables from the Tiptap theme system.

### CSS Variables Used

- `--tt-gray-light-*` - Light mode colors
- `--tt-gray-dark-*` - Dark mode colors
- `--tt-brand-color-*` - Brand colors for buttons
- `--tt-bg-color` - Background color

### Customization

You can override styles by targeting the component classes:

```css
/* Title customization */
.title-editor-content p {
  font-size: 2.5rem !important;
  color: custom-color !important;
}

/* Tag customization */
.tag-item {
  border-radius: 0.5rem !important;
  padding: 0.5rem 1rem !important;
}

/* Separator customization */
.enhanced-editor-separator {
  height: 2px !important;
  background: linear-gradient(to right, transparent, gray, transparent) !important;
}
```

## Tag Data Structure

Tags are stored as objects with the following structure:

```javascript
{
  id: Number,        // Unique identifier (timestamp + random)
  text: String,      // Tag text with # prefix (e.g., "#react")
  color: String      // Hex color code (e.g., "#dbeafe")
}
```

## Keyboard Shortcuts

### Title Editor
- All standard text editing shortcuts
- `Enter` - Blocked (single-line only)

### Tag Input
- `Enter` - Add tags and close input
- `Escape` - Cancel and close input
- `Space` - Separate multiple tags

### Content Editor
- `Ctrl/Cmd + B` - Bold
- `Ctrl/Cmd + I` - Italic
- `Ctrl/Cmd + U` - Underline
- `Ctrl/Cmd + Z` - Undo
- `Ctrl/Cmd + Shift + Z` - Redo
- And many more (see SimpleEditor documentation)

## Browser Compatibility

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers supported

## Dependencies

- React 19.1.1+
- Tiptap v2.x
- @tiptap/react
- @tiptap/starter-kit
- @tiptap/extension-placeholder

## Notes

- Title is limited to single line (no line breaks)
- Tags automatically get # prefix if not included
- Multiple tags can be added at once by separating with spaces
- Each tag gets a unique ID based on timestamp
- Content editor uses blob URLs for media in development
- All components are fully responsive
- Dark mode is automatically detected from parent theme

## Example Output

When saving, you'll get data like this:

```javascript
{
  title: "My Amazing Post",
  tags: [
    { id: 1234567890.123, text: "#javascript", color: "#dbeafe" },
    { id: 1234567890.456, text: "#react", color: "#fce7f3" },
    { id: 1234567890.789, text: "#webdev", color: "#e0e7ff" }
  ]
}
```

## See Also

- [Google Docs Viewer Guide](../../GOOGLE_DOCS_VIEWER_GUIDE.md)
- [Backend Integration Checklist](../../BACKEND_INTEGRATION_CHECKLIST.md)
- [SimpleEditor Documentation](../tiptap-templates/simple/README.md)
