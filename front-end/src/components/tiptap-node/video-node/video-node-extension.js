import { mergeAttributes, Node } from "@tiptap/react"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { VideoNode as VideoNodeComponent } from "@/components/tiptap-node/video-node/video-node"

/**
 * A Tiptap node extension for displaying video content.
 */
export const VideoNode = Node.create({
  name: "video",

  group: "block",

  draggable: true,

  selectable: true,

  atom: true,

  addOptions() {
    return {
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
      controls: {
        default: true,
        parseHTML: element => element.hasAttribute('controls'),
        renderHTML: attributes => {
          if (!attributes.controls) {
            return {}
          }
          return { controls: true }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'video[src]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "video",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoNodeComponent)
  },

  addCommands() {
    return {
      setVideo:
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

        // If the selection is a node selection and it's this node type, prevent deletion
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

        // If the selection is a node selection and it's this node type, prevent deletion
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

export default VideoNode

