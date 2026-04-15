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
import "@/components/tiptap-node/audio-node/audio-node.scss"

export const AudioNode = (props) => {
  const { src, title, controls } = props.node.attrs
  const { deleteNode } = props
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)

  const handleDeleteClick = (e) => {
    e.stopPropagation()
    console.log("[AudioNode] Delete button clicked for:", src)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    const { mediaManager } = await import("@/lib/media-manager")
    mediaManager.addPendingDeletion(src)
    console.log("[AudioNode] Added to pending deletions:", mediaManager.getPendingDeletions())
    deleteNode()
    setShowDeleteDialog(false)
  }

  return (
    <NodeViewWrapper className="tiptap-audio-node">
      <div className="tiptap-audio-wrapper">
        <button
          className="tiptap-audio-delete"
          onClick={handleDeleteClick}
          title="Delete audio"
          aria-label="Delete audio"
        >
          <X size={16} />
        </button>
        <audio
          src={src}
          title={title}
          controls={controls}
          className="tiptap-audio"
        >
          Your browser does not support the audio tag.
        </audio>
        {title && <div className="tiptap-audio-caption">{title}</div>}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-center">
              Delete Audio
            </AlertDialogTitle>
          </AlertDialogHeader>

          <div className="py-4">
            <p className="text-center text-muted-foreground">
              Are you sure you want to delete this audio?
              {title && (
                <span className="block mt-2 font-semibold text-foreground">
                  "{title}"
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

