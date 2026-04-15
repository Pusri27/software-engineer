import DOMPurify from 'dompurify';

export const securityUtils = {
  sanitizeContent(content) {
    if (!content) return '';
    
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [
        'p', 'b', 'i', 'em', 'strong', 'u', 'br', 
        'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'blockquote', 'code', 'pre', 'a', 'span', 'div',
        'img', 'video', 'audio', 'source', 'iframe'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'width', 'height',
        'controls', 'autoplay', 'loop', 'muted', 'poster',
        'class', 'id', 'style',
        // TipTap custom attributes for document nodes
        'data-type', 'data-src', 'data-filename', 'data-filesize',
        // TipTap custom attributes for other nodes
        'data-title', 'data-controls'
      ],
      ALLOW_DATA_ATTR: true, // Allow all data-* attributes
    });
  },

  // Utility untuk sanitize input biasa (title, tags, dll)
  sanitizeInput(input) {
    if (!input) return '';
    return DOMPurify.sanitize(input, { 
      ALLOWED_TAGS: [], // No HTML tags allowed
      ALLOWED_ATTR: [] 
    });
  }
};