import { KEYBOARD_SHORTCUTS, UPLOAD_LIMITS } from "@/lib/media-constants"

/**
 * Generic hook for media uploads (images, videos, audio, documents)
 * @param {string} type - Media type: 'image', 'video', 'audio', 'document'
 * @param {object} options - Upload configuration options
 */
export const useMediaUpload = (type, options = {}) => {
  const typeUpper = type.toUpperCase()
  const limits = UPLOAD_LIMITS[typeUpper]
  
  if (!limits) {
    throw new Error(`Invalid media type: ${type}`)
  }

  return {
    accept: options.accept || limits.accept,
    limit: options.limit || limits.maxFiles,
    maxSize: options.maxSize || limits.maxSize,
    shortcutKey: KEYBOARD_SHORTCUTS[typeUpper],
    type: type,
  }
}

