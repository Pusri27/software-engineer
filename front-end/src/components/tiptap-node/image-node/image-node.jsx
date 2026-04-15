"use client"
import * as React from "react"
import { NodeViewWrapper } from "@tiptap/react"
import { X } from "lucide-react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import "@/components/tiptap-node/image-node/image-node.scss"

export const ImageNode = (props) => {
  const { src, alt, title } = props.node.attrs
  const { deleteNode } = props
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)

  const handleDeleteClick = (e) => {
    e.stopPropagation()
    console.log("[ImageNode] Delete button clicked for:", src)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    console.log("[ImageNode] Deletion confirmed")
    
    // Import media manager
    const { mediaManager } = await import("@/lib/media-manager")
    
    // Mark for deletion (will be deleted on save)
    console.log("[ImageNode] Calling addPendingDeletion for:", src)
    mediaManager.addPendingDeletion(src)
    
    // Verify it was added
    const pending = mediaManager.getPendingDeletions()
    console.log("[ImageNode] Pending deletions after adding:", pending)
    
    // Remove from editor immediately
    console.log("[ImageNode] Removing node from editor")
    deleteNode()
    setShowDeleteDialog(false)
  }

  return (
    <NodeViewWrapper className="tiptap-image-node">
      <div className="tiptap-image-wrapper">
        <button
          className="tiptap-image-delete"
          onClick={handleDeleteClick}
          title="Delete image"
          aria-label="Delete image"
        >
          <X size={16} />
        </button>
        <img
          src={src}
          alt={alt || ''}
          title={title || ''}
          className="tiptap-image"
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-center">
              Delete Image
            </AlertDialogTitle>
          </AlertDialogHeader>

          <div className="py-4">
            <p className="text-center text-muted-foreground">
              Are you sure you want to delete this image?
              {(title || alt) && (
                <span className="block mt-2 font-semibold text-foreground">
                  "{title || alt}"
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={confirmDelete}
              variant="destructive"
              className="w-full"
            >
              Yes, Delete
            </Button>
            <Button
              onClick={() => setShowDeleteDialog(false)}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </NodeViewWrapper>
  )
}

