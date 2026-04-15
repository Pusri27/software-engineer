import * as React from "react"

// --- Tiptap UI Primitive ---
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/tiptap-ui-primitive/tooltip"

// --- Lib ---
import { cn, parseShortcutKeys } from "@/lib/tiptap-utils"

import "@/components/tiptap-ui-primitive/button/button-colors.scss"
import "@/components/tiptap-ui-primitive/button/button-group.scss"
import "@/components/tiptap-ui-primitive/button/button.scss"

export const ShortcutDisplay = ({
  shortcuts,
}) => {
  if (shortcuts.length === 0) return null

  return (
    <div>
      {shortcuts.map((key, index) => (
        <React.Fragment key={index}>
          {index > 0 && <kbd>+</kbd>}
          <kbd>{key}</kbd>
        </React.Fragment>
      ))}
    </div>
  );
}

export const Button = React.forwardRef((
  {
    className,
    children,
    tooltip,
    showTooltip = true,
    shortcutKeys,
    "aria-label": ariaLabel,
    allowWhenInTitle = false, // New prop to allow certain buttons (back, version)
    ...props
  },
  ref
) => {
  const shortcuts = React.useMemo(() => parseShortcutKeys({ shortcutKeys }), [shortcutKeys])

  const handleInteraction = (e) => {
    // Check if we're in title or tag input area
    const activeElement = document.activeElement
    const isInTitleOrTag = activeElement && 
      (activeElement.tagName === 'INPUT' || 
       activeElement.tagName === 'TEXTAREA' ||
       activeElement.classList.contains('title-editor') ||
       activeElement.closest('.enhanced-editor-header'))

    if (isInTitleOrTag && !allowWhenInTitle) {
      // Prevent the button click and keep focus in title/tag
      e.preventDefault()
      e.stopPropagation()
      return
    }

    // For allowed buttons when in title area, prevent default to keep focus in title
    // but still allow the click to go through
    if (isInTitleOrTag && allowWhenInTitle) {
      e.preventDefault()
      // Don't stop propagation - let the onClick handler work
    }
  }

  const handleClick = (e) => {
    const activeElement = document.activeElement
    const isInTitleOrTag = activeElement && 
      (activeElement.tagName === 'INPUT' || 
       activeElement.tagName === 'TEXTAREA' ||
       activeElement.classList.contains('title-editor') ||
       activeElement.closest('.enhanced-editor-header'))
    
    // Only block clicks for buttons that are NOT allowed when in title
    if (isInTitleOrTag && !allowWhenInTitle) {
      e.preventDefault()
      e.stopPropagation()
    }
    // For allowed buttons, let the click go through normally
  }

  if (!tooltip || !showTooltip) {
    return (
      <button
        className={cn("tiptap-button", className)}
        ref={ref}
        aria-label={ariaLabel}
        onMouseDown={handleInteraction}
        onClick={handleClick}
        {...props}>
        {children}
      </button>
    );
  }

  return (
    <Tooltip delay={200}>
      <TooltipTrigger
        className={cn("tiptap-button", className)}
        ref={ref}
        aria-label={ariaLabel}
        onMouseDown={handleInteraction}
        onClick={handleClick}
        {...props}>
        {children}
      </TooltipTrigger>
      <TooltipContent>
        {tooltip}
        <ShortcutDisplay shortcuts={shortcuts} />
      </TooltipContent>
    </Tooltip>
  );
})

Button.displayName = "Button"

export const ButtonGroup = React.forwardRef(({ className, children, orientation = "vertical", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("tiptap-button-group", className)}
      data-orientation={orientation}
      role="group"
      {...props}>
      {children}
    </div>
  );
})
ButtonGroup.displayName = "ButtonGroup"

export default Button

