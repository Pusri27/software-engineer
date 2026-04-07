/**
 * Media Manager - Tracks pending uploads and deletions
 * Media is only uploaded/deleted when user saves the work log
 */

class MediaManager {
  constructor() {
    // Track pending uploads: { blobUrl: File }
    this.pendingUploads = new Map()
    
    // Track pending deletions: Set of DigitalOcean URLs
    // Load from localStorage to persist across page reloads
    const savedDeletions = localStorage.getItem('pendingMediaDeletions')
    this.pendingDeletions = savedDeletions ? new Set(JSON.parse(savedDeletions)) : new Set()
    
    // Track blob URL to DigitalOcean URL mapping
    this.blobToUrlMap = new Map()
  }
  
  /**
   * Save pending deletions to localStorage
   */
  saveDeletionsToStorage() {
    localStorage.setItem('pendingMediaDeletions', JSON.stringify(Array.from(this.pendingDeletions)))
  }

  /**
   * Add a file for pending upload
   * @param {File} file - The file to upload
   * @returns {string} - Blob URL for preview
   */
  addPendingUpload(file) {
    const blobUrl = URL.createObjectURL(file)
    this.pendingUploads.set(blobUrl, file)
    return blobUrl
  }

  /**
   * Mark a media URL for deletion
   * @param {string} url - base64 data URI, blob URL, or external URL
   */
  addPendingDeletion(url) {
    // If it's a blob URL (not uploaded yet), just revoke it
    if (url.startsWith('blob:')) {
      this.pendingUploads.delete(url)
      URL.revokeObjectURL(url)
      return
    }

    // If it's a base64 data URI — no external file to delete, just track it
    if (url.startsWith('data:')) {
      this.pendingDeletions.add(url)
      return
    }
    
    // If it's a DigitalOcean URL, mark for deletion
    const isDigitalOceanUrl = url.includes('nebwork-storage') || 
                              url.includes('digitaloceanspaces.com') ||
                              url.includes('.cdn.digitaloceanspaces.com')
    
    if (isDigitalOceanUrl) {
      this.pendingDeletions.add(url)
      this.saveDeletionsToStorage() // Persist to localStorage
    }
    // For any other URL type, silently ignore (no external storage to clean up)
  }

  /**
   * Get all pending uploads
   * @returns {Array<{blobUrl: string, file: File}>}
   */
  getPendingUploads() {
    return Array.from(this.pendingUploads.entries()).map(([blobUrl, file]) => ({
      blobUrl,
      file
    }))
  }

  /**
   * Get all pending deletions
   * @returns {Array<string>}
   */
  getPendingDeletions() {
    return Array.from(this.pendingDeletions)
  }

  /**
   * Upload all pending files to DigitalOcean
   * @param {Function} uploadFn - Upload function from tiptap-utils
   * @returns {Promise<Map<string, string>>} - Map of blob URL to DigitalOcean URL
   */
  async uploadAllPending(uploadFn) {
    const uploads = this.getPendingUploads()
    
    const urlMap = new Map()
    
    for (const { blobUrl, file } of uploads) {
      try {
        const digitalOceanUrl = await uploadFn(file)
        urlMap.set(blobUrl, digitalOceanUrl)
        this.blobToUrlMap.set(blobUrl, digitalOceanUrl)
      } catch (error) {
        console.error(`[MediaManager] Failed to upload ${file.name}:`, error)
        throw error
      }
    }
    
    // Clear pending uploads after successful upload
    this.pendingUploads.clear()
    
    return urlMap
  }

  /**
   * Delete all pending files from DigitalOcean
   * @param {Function} deleteFn - Delete function from tiptap-utils
   */
  async deleteAllPending(deleteFn) {
    const deletions = this.getPendingDeletions()
    
    if (deletions.length === 0) {
      return
    }
    
    let successCount = 0
    let failCount = 0
    
    for (const url of deletions) {
      try {
        const result = await deleteFn(url)
        if (result) {
          successCount++
        } else {
          console.error(`[MediaManager] ❌ Delete returned false for: ${url}`)
          failCount++
        }
      } catch (error) {
        console.error(`[MediaManager] ❌ Failed to delete ${url}:`, error)
        failCount++
        // Continue with other deletions even if one fails
      }
    }
    
    // Clear pending deletions
    this.pendingDeletions.clear()
    this.saveDeletionsToStorage() // Clear from localStorage too
  }

  /**
   * Replace all blob URLs in HTML content with DigitalOcean URLs
   * @param {string} htmlContent - HTML content with blob URLs
   * @param {Map<string, string>} urlMap - Map of blob URL to DigitalOcean URL
   * @returns {string} - HTML content with DigitalOcean URLs
   */
  replaceBlobUrlsInContent(htmlContent, urlMap) {
    if (!htmlContent) {
      return htmlContent
    }
    
    let updatedContent = htmlContent
    let replacementCount = 0
    
    for (const [blobUrl, digitalOceanUrl] of urlMap.entries()) {
      // Count occurrences before replacement
      const beforeCount = (updatedContent.match(new RegExp(blobUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
      
      if (beforeCount === 0) {
        console.warn(`[MediaManager] ⚠️ Blob URL not found in content: ${blobUrl}`)
        console.warn(`[MediaManager] This blob URL was uploaded but not used in the document`)
      }
      
      // Replace all occurrences of blob URL with DigitalOcean URL
      updatedContent = updatedContent.replaceAll(blobUrl, digitalOceanUrl)
      
      // Verify replacement
      const digitalOceanCount = (updatedContent.match(new RegExp(digitalOceanUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
      
      replacementCount += beforeCount
    }
    
    // Verify no blob URLs remain
    const remainingBlobs = (updatedContent.match(/blob:http[^\s"')]+/g) || [])
    if (remainingBlobs.length > 0) {
      console.warn(`[MediaManager] ⚠️ WARNING: ${remainingBlobs.length} blob URL(s) still in content:`)
      remainingBlobs.forEach(blob => console.warn(`[MediaManager]    - ${blob}`))
    }
    
    return updatedContent
  }

  /**
   * Clean up blob URLs only (NOT deletions - they persist until save)
   */
  cleanup() {
    
    for (const blobUrl of this.pendingUploads.keys()) {
      URL.revokeObjectURL(blobUrl)
    }
    
    // Only clear uploads and blob map, NOT deletions
    this.pendingUploads.clear()
    this.blobToUrlMap.clear()
    
    // DO NOT clear pendingDeletions - they should persist until save!
    // DO NOT clear localStorage - deletions must persist across page reloads!
  }

  /**
   * Check if there are any pending changes
   * @returns {boolean}
   */
  hasPendingChanges() {
    return this.pendingUploads.size > 0 || this.pendingDeletions.size > 0
  }

  /**
   * Reset the manager (clear all tracking - only call after successful save)
   */
  reset() {
    
    // Clean up blob URLs
    for (const blobUrl of this.pendingUploads.keys()) {
      URL.revokeObjectURL(blobUrl)
    }
    
    // Clear everything including deletions
    this.pendingUploads.clear()
    this.pendingDeletions.clear()
    this.blobToUrlMap.clear()
    
    // Clear from localStorage too
    this.saveDeletionsToStorage()
  }

  /**
   * Reset only uploads after save (keep pending deletions for undo support)
   */
  resetUploads() {
    
    // Clean up blob URLs
    for (const blobUrl of this.pendingUploads.keys()) {
      URL.revokeObjectURL(blobUrl)
    }
    
    // Clear only uploads and blob map, NOT deletions
    this.pendingUploads.clear()
    this.blobToUrlMap.clear()
  }
}

// Create a singleton instance
export const mediaManager = new MediaManager()

// Export for testing or multiple instances if needed
export default MediaManager

