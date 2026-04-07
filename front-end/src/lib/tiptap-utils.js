import { Selection, TextSelection } from "@tiptap/pm/state"
import { MAX_FILE_SIZE } from "@/lib/media-constants"

export { MAX_FILE_SIZE }

export const MAC_SYMBOLS = {
  mod: "⌘",
  command: "⌘",
  meta: "⌘",
  ctrl: "⌃",
  control: "⌃",
  alt: "⌥",
  option: "⌥",
  shift: "⇧",
  backspace: "Del",
  delete: "⌦",
  enter: "⏎",
  escape: "⎋",
  capslock: "⇪"
}

export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Determines if the current platform is macOS
 * @returns boolean indicating if the current platform is Mac
 */
export function isMac() {
  return (typeof navigator !== "undefined" && navigator.platform.toLowerCase().includes("mac"));
}

/**
 * Formats a shortcut key based on the platform (Mac or non-Mac)
 * @param key - The key to format (e.g., "ctrl", "alt", "shift")
 * @param isMac - Boolean indicating if the platform is Mac
 * @param capitalize - Whether to capitalize the key (default: true)
 * @returns Formatted shortcut key symbol
 */
export const formatShortcutKey = (key, isMac, capitalize = true) => {
  if (isMac) {
    return MAC_SYMBOLS[key.toLowerCase()] || (capitalize ? key.toUpperCase() : key)
  }
  return capitalize ? key.charAt(0).toUpperCase() + key.slice(1) : key
}

/**
 * Parses a shortcut key string into an array of formatted key symbols
 * @param shortcutKeys - The string of shortcut keys (e.g., "ctrl-alt-shift")
 * @param delimiter - The delimiter used to split the keys (default: "-")
 * @param capitalize - Whether to capitalize the keys (default: true)
 * @returns Array of formatted shortcut key symbols
 */
export const parseShortcutKeys = ({ shortcutKeys, delimiter = "+", capitalize = true }) => {
  if (!shortcutKeys) return []

  return shortcutKeys
    .split(delimiter)
    .map((key) => formatShortcutKey(key.trim(), isMac(), capitalize))
}

/**
 * Checks if a mark exists in the editor schema
 * @param markName - The name of the mark to check
 * @param editor - The editor instance
 * @returns boolean indicating if the mark exists in the schema
 */
export const isMarkInSchema = (markName, editor) => {
  return editor?.schema?.spec.marks.get(markName) !== undefined
}

/**
 * Checks if a node exists in the editor schema
 * @param nodeName - The name of the node to check
 * @param editor - The editor instance
 * @returns boolean indicating if the node exists in the schema
 */
export const isNodeInSchema = (nodeName, editor) => {
  return editor?.schema?.spec.nodes.get(nodeName) !== undefined
}

/**
 * Moves the focus to the next node in the editor
 * @param editor - The editor instance
 * @returns boolean indicating if the focus was moved
 */
export function focusNextNode(editor) {
  const { state, view } = editor
  const { doc, selection } = state

  const nextSel = Selection.findFrom(selection.$to, 1, true)
  if (nextSel) {
    view.dispatch(state.tr.setSelection(nextSel).scrollIntoView())
    return true
  }

  const paragraphType = state.schema.nodes.paragraph
  if (!paragraphType) {
    console.warn("No paragraph node type found in schema.")
    return false
  }

  const end = doc.content.size
  const para = paragraphType.create()
  let tr = state.tr.insert(end, para)

  // Place the selection inside the new paragraph
  const $inside = tr.doc.resolve(end + 1)
  tr = tr.setSelection(TextSelection.near($inside)).scrollIntoView()
  view.dispatch(tr)
  return true
}

/**
 * Checks if a value is a valid number (not null, undefined, or NaN)
 * @param value - The value to check
 * @returns boolean indicating if the value is a valid number
 */
export function isValidPosition(pos) {
  return typeof pos === "number" && pos >= 0
}

/**
 * Checks if one or more extensions are registered in the Tiptap editor.
 * @param editor - The Tiptap editor instance
 * @param extensionNames - A single extension name or an array of names to check
 * @returns True if at least one of the extensions is available, false otherwise
 */
export function isExtensionAvailable(editor, extensionNames) {
  if (!editor) return false

  const names = Array.isArray(extensionNames)
    ? extensionNames
    : [extensionNames]

  const found = names.some((name) =>
    editor.extensionManager.extensions.some((ext) => ext.name === name))

  if (!found) {
    console.warn(
      `None of the extensions [${names.join(", ")}] were found in the editor schema. Ensure they are included in the editor configuration.`
    )
  }

  return found
}

/**
 * Finds a node at the specified position with error handling
 * @param editor The Tiptap editor instance
 * @param position The position in the document to find the node
 * @returns The node at the specified position, or null if not found
 */
export function findNodeAtPosition(editor, position) {
  try {
    const node = editor.state.doc.nodeAt(position)
    if (!node) {
      console.warn(`No node found at position ${position}`)
      return null
    }
    return node
  } catch (error) {
    console.error(`Error getting node at position ${position}:`, error)
    return null
  }
}

/**
 * Finds the position and instance of a node in the document
 * @param props Object containing editor, node (optional), and nodePos (optional)
 * @param props.editor The Tiptap editor instance
 * @param props.node The node to find (optional if nodePos is provided)
 * @param props.nodePos The position of the node to find (optional if node is provided)
 * @returns An object with the position and node, or null if not found
 */
export function findNodePosition(props) {
  const { editor, node, nodePos } = props

  if (!editor?.state?.doc) return null

  const hasValidNode = node !== undefined && node !== null
  const hasValidPos = isValidPosition(nodePos)

  if (!hasValidNode && !hasValidPos) {
    return null
  }

  // Search for the node in the document if we have a node
  if (hasValidNode) {
    let foundPos = -1
    let foundNode = null

    editor.state.doc.descendants((currentNode, pos) => {
      if (currentNode === node) {
        foundPos = pos
        foundNode = currentNode
        return false
      }
      return true
    })

    if (foundPos !== -1 && foundNode !== null) {
      return { pos: foundPos, node: foundNode }
    }
  }

  // If we have a valid position, use findNodeAtPosition
  if (hasValidPos) {
    const nodeAtPos = findNodeAtPosition(editor, nodePos)
    if (nodeAtPos) {
      return { pos: nodePos, node: nodeAtPos }
    }
  }

  return null
}

/**
 * Checks if the current selection in the editor is a node selection of specified types
 * @param editor The Tiptap editor instance
 * @param types An array of node type names to check against
 * @returns boolean indicating if the selected node matches any of the specified types
 */
export function isNodeTypeSelected(editor, types = []) {
  if (!editor?.state?.selection) return false

  const { selection } = editor.state

  if (selection.empty || !selection.node) return false
  return types.includes(selection.node.type.name)
}

/**
 * Converts a file to a base64 data URI (stored directly in MongoDB)
 * No external storage needed — works without DigitalOcean Spaces configuration
 * @param file The file to convert
 * @param onProgress Optional callback for tracking progress (called once at 100%)
 * @returns Promise resolving to the base64 data URI of the file
 */
export const handleImageUpload = async (file, onProgress, abortSignal) => {
  // Validate file
  if (!file) {
    throw new Error("No file provided")
  }

  if (file.size > MAX_FILE_SIZE * 2) {
    throw new Error(`File size exceeds maximum allowed (${Math.round(MAX_FILE_SIZE * 2 / (1024 * 1024))}MB)`)
  }

  return new Promise((resolve, reject) => {
    // Handle abort signal
    if (abortSignal?.aborted) {
      reject(new Error("Upload cancelled"))
      return
    }

    const reader = new FileReader()

    reader.onload = (e) => {
      const base64DataUri = e.target?.result
      if (base64DataUri) {
        onProgress?.({ progress: 100 })
        resolve(base64DataUri)
      } else {
        reject(new Error("Failed to read file as base64"))
      }
    }

    reader.onerror = () => {
      reject(new Error("FileReader error while reading file"))
    }

    if (abortSignal) {
      abortSignal.addEventListener('abort', () => {
        reader.abort()
        reject(new Error("Upload cancelled"))
      })
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Delete media file from DigitalOcean Spaces
 * @param {string} url - The URL of the file to delete
 * @returns {Promise<boolean>} - Success status
 */
export const deleteMediaFile = async (url) => {
  if (!url) {
    console.error("[deleteMediaFile] No URL provided for deletion")
    return false
  }

  try {
    // Get authentication token
    const token = sessionStorage.getItem('token')
    if (!token) {
      console.error("[deleteMediaFile] No authentication token found")
      throw new Error("Authentication required")
    }

    const BASE_URL = 'http://127.0.0.1:5001'

    const response = await fetch(`${BASE_URL}/api/upload`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ url })
    })

    const result = await response.json()

    if (response.ok && result.success) {
      return true
    } else {
      console.error("[deleteMediaFile] ❌ Failed to delete file:", result.message, result)
      return false
    }
  } catch (error) {
    console.error("[deleteMediaFile] ❌ Error deleting file:", error)
    return false
  }
}

const ATTR_WHITESPACE = /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g

export function isAllowedUri(uri, protocols) {
  const allowedProtocols = [
    "http", "https", "ftp", "ftps", "mailto", "tel",
    "callto", "sms", "cid", "xmpp",
  ]

  if (protocols) {
    protocols.forEach((protocol) => {
      const nextProtocol = typeof protocol === "string" ? protocol : protocol.scheme
      if (nextProtocol) {
        allowedProtocols.push(nextProtocol)
      }
    })
  }

  return !uri || uri.replace(ATTR_WHITESPACE, "").match(
    new RegExp(`^(?:(?:${allowedProtocols.join("|")}):|[^a-z]|[a-z0-9+.\\-]+(?:[^a-z+.\\-:]|$))`, "i")
  )
}

export function sanitizeUrl(inputUrl, baseUrl, protocols) {
  try {
    const url = new URL(inputUrl, baseUrl)
    if (isAllowedUri(url.href, protocols)) {
      return url.href
    }
  } catch {
    // If URL creation fails, it's considered invalid
  }
  return "#"
}
