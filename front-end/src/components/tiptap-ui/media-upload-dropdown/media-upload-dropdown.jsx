import * as React from "react"
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"
import { ChevronDownIcon, UploadIcon } from "@/components/tiptap-icons"
import { MediaUploadButton } from "./media-buttons"
import { Button, ButtonGroup } from "@/components/tiptap-ui-primitive/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/tiptap-ui-primitive/dropdown-menu"
import { Card, CardBody } from "@/components/tiptap-ui-primitive/card"

const MEDIA_OPTIONS = [
  { type: "image", label: "Image" },
  { type: "video", label: "Video" },
  { type: "audio", label: "Audio" },
  { type: "document", label: "Document" },
]

export function MediaUploadDropdown({
  editor: providedEditor,
  text,
  hideWhenUnavailable = false,
  onInserted,
  onOpenChange,
  portal = false,
  ...props
}) {
  const { editor } = useTiptapEditor(providedEditor)
  const [isOpen, setIsOpen] = React.useState(false)

  const handleOnOpenChange = React.useCallback((open) => {
    setIsOpen(open)
    onOpenChange?.(open)
  }, [onOpenChange])

  if (!editor || !editor.isEditable) {
    return null
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOnOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          data-style="ghost"
          role="button"
          tabIndex={-1}
          aria-label="Upload media"
          tooltip="Upload media"
          {...props}>
          <UploadIcon className="tiptap-button-icon" />
          {text && <span className="tiptap-button-text">{text}</span>}
          <ChevronDownIcon className="tiptap-button-dropdown-small" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" portal={portal}>
        <Card>
          <CardBody>
            <ButtonGroup>
              {MEDIA_OPTIONS.map((option) => (
                <DropdownMenuItem key={option.type} asChild>
                  <MediaUploadButton
                    editor={editor}
                    type={option.type}
                    text={option.label}
                    showTooltip={false}
                    onInserted={onInserted} />
                </DropdownMenuItem>
              ))}
            </ButtonGroup>
          </CardBody>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default MediaUploadDropdown

