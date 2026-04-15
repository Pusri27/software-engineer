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
import "@/components/tiptap-node/video-node/video-node.scss"

export const VideoNode = (props) => {
  const { src, title, controls } = props.node.attrs
  const { deleteNode } = props
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)

  const handleDeleteClick = (e) => {
    e.stopPropagation()
    console.log("[VideoNode] Delete button clicked for:", src)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    const { mediaManager } = await import("@/lib/media-manager")
    mediaManager.addPendingDeletion(src)
    console.log("[VideoNode] Added to pending deletions:", mediaManager.getPendingDeletions())
    deleteNode()
    setShowDeleteDialog(false)
  }

  return (
    <NodeViewWrapper className="tiptap-video-node">
      <div className="tiptap-video-wrapper">
        <button
          className="tiptap-video-delete"
          onClick={handleDeleteClick}
          title="Delete video"
          aria-label="Delete video"
        >
          <X size={16} />
        </button>
        <video
          src={src}
          title={title}
          controls={controls}
          className="tiptap-video"
        >
          Your browser does not support the video tag.
        </video>
        {title && <div className="tiptap-video-caption">{title}</div>}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-center">
              Delete Video
            </AlertDialogTitle>
          </AlertDialogHeader>

          <div className="py-4">
            <p className="text-center text-muted-foreground">
              Are you sure you want to delete this video?
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

