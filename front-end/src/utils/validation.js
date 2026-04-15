export const validationUtils = {
  worklog: {
    validateContent({ title, content, tag }) {
      const errors = {};

      // Title validation
      if (!title?.trim()) {
        errors.title = 'Title cannot be empty';
      } else if (title.length > 50) {
        errors.title = 'Title maximum 50 characters';
      } else if (/[<>{}]/.test(title)) {
        errors.title = 'Title cannot contain special characters';
      } else if (/^\s+|\s+$/.test(title)) {
        errors.title = 'Title cannot start or end with whitespace';
      }
      
      // Content validation
      // Check if content is HTML string
      let plainContent = '';
      if (typeof content === 'string') {
        if (content.includes('<') && content.includes('>')) {
          // If it's HTML, strip tags and get text content
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = content;
          plainContent = (tempDiv.textContent || tempDiv.innerText || '').trim();
        } else {
          plainContent = content.trim();
        }
      } else if (content) {
        // Handle non-string content (e.g., object from editor)
        plainContent = String(content).trim();
      }
      

      // Check if content is truly empty after stripping HTML and trimming
      if (!plainContent || plainContent.length === 0) {
        errors.content = 'Content cannot be empty';
      }
      
      // Tags validation
      if (tag && Array.isArray(tag)) {
        // Check max tags
        if (tag.length > 5) {
          errors.tag = 'Maximum 5 tags';
        }
        
        // Check individual tags
        tag.forEach((t, index) => {
          if (t && t.length > 30) {
            errors.tag = `Tag "${t}" is too long (max 30 characters)`;
          }
          if (t && /[<>{}]/.test(t)) {
            errors.tag = `Tag "${t}" contains invalid characters`;
          }
        });
      }
      
      
      const isValid = Object.keys(errors).length === 0;
      
      return { 
        isValid,
        errors 
      };
    },
  }
};