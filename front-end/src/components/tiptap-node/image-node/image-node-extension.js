import { mergeAttributes, Node } from "@tiptap/react"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { ImageNode as ImageNodeComponent } from "@/components/tiptap-node/image-node/image-node"

/**
 * A Tiptap node extension for displaying image content with delete button.
 */
export const CustomImageNode = Node.create({
  name: "image",

  group: "block",

  draggable: true,

  selectable: true,

  atom: true,

  addOptions() {
    return {
      inline: false,
      allowBase64: false,
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: element => element.getAttribute('src'),
        renderHTML: attributes => {
          if (!attributes.src) {
            return {}
          }
          return { src: attributes.src }
        },
      },
      alt: {
        default: null,
        parseHTML: element => element.getAttribute('alt'),
        renderHTML: attributes => {
          if (!attributes.alt) {
            return {}
          }
          return { alt: attributes.alt }
        },
      },
      title: {
        default: null,
        parseHTML: element => element.getAttribute('title'),
        renderHTML: attributes => {
          if (!attributes.title) {
            return {}
          }
          return { title: attributes.title }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "img",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeComponent)
  },

  addCommands() {
    return {
      setImage:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const { state } = editor
        const { selection } = state
        const { $from, node } = selection

        // If the selection is a node selection and it's an image, prevent deletion
        if (node && node.type.name === this.name) {
          return true
        }

        // Check if cursor is right after this node type
        if ($from.nodeBefore?.type.name === this.name) {
          return true
        }

        return false
      },
      Delete: ({ editor }) => {
        const { state } = editor
        const { selection } = state
        const { $from, node } = selection

        // If the selection is a node selection and it's an image, prevent deletion
        if (node && node.type.name === this.name) {
          return true
        }

        // Check if cursor is right before this node type
        if ($from.nodeAfter?.type.name === this.name) {
          return true
        }

        return false
      },
    }
  },
})

export default CustomImageNode

