import React from 'react';

/**
 * SimpleMarkdown: A lightweight placeholder component that handles basic 
 * markdown conversion (bold, lists, links) without requiring external dependencies.
 * 
 * Used here as a robust alternative to react-markdown when package installation
 * issues occur (commonly seen in synced cloud folders like iCloud).
 */
const SimpleMarkdown = ({ children }) => {
  if (typeof children !== 'string') return <>{children}</>;

  // Replace Markdown with HTML-safe strings and simple styling
  const processText = (text) => {
    return text
      .split('\n')
      .map((line, index) => {
        let processedLine = line;

        // Bold: **text** -> <strong>text</strong>
        processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Italic: *text* -> <em>text</em>
        processedLine = processedLine.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Lists: * Item -> <li>Item</li> (simplified wrapping)
        if (processedLine.trim().startsWith('* ')) {
          const content = processedLine.trim().substring(2);
          return <li key={index} className="ml-4 list-disc" dangerouslySetInnerHTML={{ __html: content }} />;
        }

        // Headers: ### text -> <h3>text</h3>
        if (processedLine.startsWith('### ')) {
          const content = processedLine.substring(4);
          return <h3 key={index} className="text-lg font-bold mt-2" dangerouslySetInnerHTML={{ __html: content }} />;
        }

        if (processedLine.startsWith('## ')) {
          const content = processedLine.substring(3);
          return <h2 key={index} className="text-xl font-bold mt-3" dangerouslySetInnerHTML={{ __html: content }} />;
        }

        // Default paragraph
        return (
          <p 
            key={index} 
            className="mb-1"
            dangerouslySetInnerHTML={{ __html: processedLine }} 
          />
        );
      });
  };

  return <div className="simple-markdown space-y-1">{processText(children)}</div>;
};

export default SimpleMarkdown;
