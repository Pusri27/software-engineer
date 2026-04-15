import { useState, useEffect, useRef, useCallback } from "react";
import { WORKLOG_TEMPLATES, SCRATCH_OPTION } from "../config/templates";
import { Button } from "@/components/ui/button";
import { Search, Users, Save, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/tiptap-ui-primitive/tooltip";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useSearchParams } from "react-router-dom";
import Menubar from "@/components/Menubar/Menubar";
import Navbar from "@/components/Navbar/Navbar";
import CollabList from "@/components/CollabList/CollabList";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import { AUTH_ENDPOINTS, WORKLOG_ENDPOINTS, ADMIN_ENDPOINTS } from "../config/api";
import { apiHandler } from "../utils/apiHandler";
import BASE_URL from "../config/api";
import { useToast } from "@/hooks/use-toast";
import { Loading } from "@/components/ui/loading";

const BlogEditor = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingWorklog, setIsLoadingWorklog] = useState(false);
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);
  const [isRemovingCollaborator, setIsRemovingCollaborator] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [commitMessage, setCommitMessage] = useState("");
  const [blogContent, setBlogContent] = useState("");
  const [blogTitle, setBlogTitle] = useState("");
  const [blogTags, setBlogTags] = useState([]);
  const [friends, setFriends] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserDivision, setCurrentUserDivision] = useState(null);
  const [owner, setOwner] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [editorKey, setEditorKey] = useState(0); // Key to force re-mount editor
  const [showTemplateModal, setShowTemplateModal] = useState(!searchParams.get("id")); // show on create mode
  const [draftSavedAt, setDraftSavedAt] = useState(null); // timestamp of last draft save
  const [hasDraftRestored, setHasDraftRestored] = useState(false); // show restore banner
  const autoSaveTimerRef = useRef(null);
  const DRAFT_KEY = "nebwork_draft_new";

  // Ref to track if we're programmatically updating content (to avoid triggering unsaved changes)
  const isProgrammaticUpdate = useRef(false);
  // Ref to avoid fetching the same post multiple times (prevents double-loading)
  const fetchedPostIdRef = useRef(null);

  // Ref to store the content to use for editor re-mount (with DigitalOcean URLs)
  const contentForReMount = useRef(null);

  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [collaboratorToRemove, setCollaboratorToRemove] = useState(null);
  const [showInviteConfirmDialog, setShowInviteConfirmDialog] = useState(false);
  const [selectedFriendsToInvite, setSelectedFriendsToInvite] = useState([]);
  const postId = searchParams.get("id");
  const isEditMode = !!postId; // Determine if we're editing or creating

  // Prevent navigation when there are unsaved changes (browser back/refresh)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup blob URLs when component unmounts
    // (Actual file deletion happens during navigation in handleNavigateAway)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

      import("@/lib/media-manager").then(({ mediaManager }) => {
        mediaManager.cleanup();
      });
    };
  }, [hasUnsavedChanges]);

  // ── AUTO-SAVE DRAFT (create mode only) ──────────────────────────────
  const triggerAutoSave = useCallback(() => {
    if (isEditMode) return; // only for new worklogs
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          title: blogTitle,
          tags: blogTags,
          content: blogContent,
          savedAt: new Date().toISOString(),
        }));
        setDraftSavedAt(new Date());
      } catch (e) {
        console.warn('Draft save failed:', e);
      }
    }, 2000); // 2-second debounce
  }, [isEditMode, blogTitle, blogTags, blogContent]);

  // Trigger auto-save whenever content/title/tags change in create mode
  useEffect(() => {
    if (!isEditMode && hasUnsavedChanges) triggerAutoSave();
  }, [blogTitle, blogTags, blogContent]); // eslint-disable-line react-hooks/exhaustive-deps

  // Restore draft on mount (create mode only)
  useEffect(() => {
    if (isEditMode) return;
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (!saved) return;
      const draft = JSON.parse(saved);
      if (!draft?.title && !draft?.content) return;
      // Only restore if it's a fresh create (no content yet loaded)
      isProgrammaticUpdate.current = true;
      setBlogTitle(draft.title || "");
      setBlogTags(draft.tags || []);
      setBlogContent(draft.content || "");
      setEditorKey(prev => prev + 1);
      setHasDraftRestored(true);
      setTimeout(() => { isProgrammaticUpdate.current = false; }, 100);
    } catch (e) {
      console.warn('Draft restore failed:', e);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Get current user ID and division
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(AUTH_ENDPOINTS.PROFILE, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        const userData = data.user || data;
        setCurrentUserId(userData.id || userData._id);
        setCurrentUserDivision(userData.division || null);

        // Set owner as current user ONLY in create mode
        // In edit mode, owner will be set from worklog data
        if (!postId) {
          setOwner({
            id: userData.id || userData._id,
            name: userData.name || "Unknown",
            division: userData.division || "Unknown",
            avatar: userData.profile_photo || userData.profilePicture || "/placeholder.jpeg"
          });
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch worklog detail (only in edit mode)
  useEffect(() => {
    if (!postId) {
      // CREATE MODE: Set initial empty state
      isProgrammaticUpdate.current = true;
      setBlogTitle("");
      setBlogTags([]);
      setBlogContent("");

      // Reset media manager for new post
      import("@/lib/media-manager").then(({ mediaManager }) => {
        mediaManager.reset();
      });

      // Reset flag after state updates
      setTimeout(() => {
        isProgrammaticUpdate.current = false;
      }, 100);

      return;
    }

    const fetchPost = async () => {
      setIsLoadingWorklog(true);
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(WORKLOG_ENDPOINTS.ONE(postId), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();

        // Check access before setting data
        if (currentUserId) {
          const isOwner = data.user?._id === currentUserId || data.user?.id === currentUserId;
          const isCollaborator = data.collaborators?.some(collab =>
            collab._id === currentUserId || collab.id === currentUserId
          );

          if (!isOwner && !isCollaborator) {
            console.warn('Access denied: Not owner or collaborator');
            navigate(-1);
            return;
          }
        }

        // Set flag before loading initial data
        isProgrammaticUpdate.current = true;

        // Set data
        setBlogTitle(data.title || "");
        setBlogTags(data.tag || []);
        setBlogContent(data.content || "");

        // Reset media manager when loading existing content
        const { mediaManager } = await import("@/lib/media-manager");
        mediaManager.reset();

        // Set owner for CollabList
        if (data.user) {
          const ownerAvatar = data.user.profile_photo ||
            data.user.profilePicture ||
            data.user.avatar ||
            "/placeholder.jpeg";

          setOwner({
            id: data.user._id || data.user.id,
            name: data.user.name || "Unknown",
            division: data.user.division || "Unknown",
            avatar: ownerAvatar
          });
        }

        // Set collaborators for CollabList
        if (data.collaborators && data.collaborators.length > 0) {
          setCollaborators(data.collaborators.map(collab => {
            const collabAvatar = collab.profile_photo ||
              collab.profilePicture ||
              collab.avatar ||
              "/placeholder.jpeg";

            return {
              id: collab._id || collab.id,
              name: collab.name || "Unknown",
              division: collab.division || "Unknown",
              avatar: collabAvatar
            };
          }));
        }

        // Reset the programmatic update flag after the state has been updated
        setTimeout(() => {
          isProgrammaticUpdate.current = false;
        }, 100);

        // Reset editor to clear undo history after loading content
        setEditorKey(prev => prev + 1);
        setHasUnsavedChanges(false);
      } catch (err) {
        console.error('Error fetching post:', err);
        navigate(-1);
      } finally {
        setIsLoadingWorklog(false);
      }
    };
    // Prevent fetching the same post multiple times (avoids double-loading)
    if (fetchedPostIdRef.current === postId) {
      return;
    }
    fetchedPostIdRef.current = postId;

    fetchPost();
  }, [postId, navigate]);

  // Fetch friends dari backend (FILTER by division)
  useEffect(() => {
    if (!currentUserDivision) return; // Wait for division to load

    const fetchFriends = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(ADMIN_ENDPOINTS.EMPLOYEES, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        const allUsers = data.data || data.employees || data || [];

        // ✅ FILTER: Only show users from the same division
        const friendsList = allUsers.filter(user =>
          user.division === currentUserDivision
        );

        setFriends(friendsList);
      } catch (err) {
        console.error('Error fetching friends:', err);
      }
    };
    fetchFriends();
  }, [currentUserDivision]);

  // Get collaborator IDs for easier checking
  const collaboratorIds = collaborators.map(c => c.id);

  // Map friends and sort: collaborators first, then others
  const allFriends = friends
    .filter((friend) => {
      const friendId = friend._id || friend.id;
      // Filter out current user (owner)
      if (friendId === currentUserId) return false;
      // Filter by search query
      return (friend.name || friend.full_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    })
    .map((friend) => {
      const friendAvatar = friend.profile_photo ||
        friend.profilePicture ||
        friend.avatar ||
        "/placeholder.jpeg";
      return {
        id: friend._id || friend.id,
        name: friend.name || friend.full_name || "Unknown",
        division: friend.division || "Unknown",
        avatar: friendAvatar
      };
    });

  // Sort: collaborators first, then others
  const filteredFriends = allFriends.sort((a, b) => {
    const aIsCollab = collaboratorIds.includes(a.id);
    const bIsCollab = collaboratorIds.includes(b.id);
    if (aIsCollab && !bIsCollab) return -1;
    if (!aIsCollab && bIsCollab) return 1;
    return 0;
  });

  const toggleFriendSelection = (friendId) => {
    // Don't allow unchecking if already a collaborator
    if (collaboratorIds.includes(friendId)) {
      return;
    }

    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleInvite = () => {
    if (selectedFriends.length === 0) return;

    // Prepare data for confirmation
    const friendsToInvite = allFriends.filter(friend =>
      selectedFriends.includes(friend.id)
    );
    setSelectedFriendsToInvite(friendsToInvite);

    // Close invite dialog and show confirmation
    setInviteOpen(false);
    setShowInviteConfirmDialog(true);
  };

  const confirmInvite = async () => {

    // Close invite dialog and show loading
    setShowInviteConfirmDialog(false);
    setIsAddingCollaborator(true);

    // Get all selected friends (including already added collaborators)
    const allSelectedIds = [...new Set([...collaboratorIds, ...selectedFriends])];
    const newCollaborators = allFriends.filter(friend =>
      allSelectedIds.includes(friend.id)
    );
    setCollaborators(newCollaborators);

    // Auto-save collaborators if in edit mode
    if (isEditMode && postId) {
      try {
        const token = sessionStorage.getItem('token');
        const mediaFiles = extractMediaFromContent(blogContent);
        await fetch(WORKLOG_ENDPOINTS.ONE(postId), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: blogTitle,
            content: blogContent,
            tag: blogTags,
            collaborators: allSelectedIds,
            media: mediaFiles,
          })
        });

        // Show success toast notification
        toast({
          title: "✅ Collaborators added successfully!",
          description: "The selected collaborators have been added to this work log.",
          duration: 3000,
        });
      } catch (err) {
        console.error('Error auto-saving collaborators:', err);
        toast({
          variant: "destructive",
          title: "Failed to add collaborators",
          description: "Please try again or save the work log to apply changes.",
          duration: 3000,
        });
      }
    } else {

      toast({
        title: "✅ Collaborators selected!",
        description: "Collaborators will be added when you save this work log.",
        duration: 3000,
      });
      // Mark as unsaved changes
      setHasUnsavedChanges(true);
    }

    // Hide loading and reset
    setIsAddingCollaborator(false);
    setSelectedFriendsToInvite([]);
    setSelectedFriends([]);
    setSearchQuery("");
  };

  const handleRemoveCollaborator = (collaboratorId) => {
    // Remove from collaborators list
    const collaborator = collaborators.find(c => c.id === collaboratorId);
    setCollaboratorToRemove(collaborator);
    setShowRemoveDialog(true);
  };

  const confirmRemoveCollaborator = async () => {
    if (!collaboratorToRemove) return;

    const collaboratorId = collaboratorToRemove.id;

    // Close remove dialog and show loading
    setShowRemoveDialog(false);
    setIsRemovingCollaborator(true);

    // Remove from collaborators list
    const updatedCollaborators = collaborators.filter(c => c.id !== collaboratorId);
    setCollaborators(updatedCollaborators);
    // Also remove from selectedFriends if present
    setSelectedFriends(prev => prev.filter(id => id !== collaboratorId));

    // Auto-save collaborator removal if in edit mode
    if (isEditMode && postId) {
      try {
        const token = sessionStorage.getItem('token');
        const updatedCollaboratorIds = updatedCollaborators.map(c => c.id);
        const mediaFiles = extractMediaFromContent(blogContent);
        await fetch(WORKLOG_ENDPOINTS.ONE(postId), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: blogTitle,
            content: blogContent,
            tag: blogTags,
            collaborators: updatedCollaboratorIds,
            media: mediaFiles,
          })
        });

        // Show success toast notification
        toast({
          title: "✅ Collaborator removed successfully!",
          description: `${collaboratorToRemove.name} has been removed from this work log.`,
          duration: 3000,
        });
      } catch (err) {
        console.error('Error auto-saving collaborator removal:', err);
        toast({
          variant: "destructive",
          title: "Failed to remove collaborator",
          description: "Please try again or save the work log to apply changes.",
          duration: 3000,
        });
      }
    } else {
      // CREATE MODE: Show info that removal will be applied when worklog is saved
      toast({
        title: "✅ Collaborator removed!",
        description: "Changes will be applied when you save this work log.",
        duration: 3000,
      });
      // Mark as unsaved changes
      setHasUnsavedChanges(true);
    }

    // Hide loading and reset
    setIsRemovingCollaborator(false);
    setCollaboratorToRemove(null);
  };

  const handleNavigationAttempt = (path) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(path);
      setShowUnsavedDialog(true);
    } else {
      // Delete pending deletions before navigating away
      handleNavigateAway(path);
    }
  };

  const handleNavigateAway = async (path) => {
    // Delete pending files before leaving
    const { mediaManager } = await import("@/lib/media-manager");
    const { deleteMediaFile } = await import("@/lib/tiptap-utils");
    const pendingDeletions = mediaManager.getPendingDeletions();

    if (pendingDeletions.length > 0) {
      await mediaManager.deleteAllPending(deleteMediaFile);
    }

    // Now navigate
    if (typeof path === 'function') {
      path();
    } else if (typeof path === 'number') {
      navigate(path);
    } else {
      navigate(path);
    }
  };

  const handleContinueWithoutSaving = async () => {
    // When discarding unsaved changes, we should NOT delete files
    // because the saved version still has them!
    // We only clear the pending deletions queue.
    const { mediaManager } = await import("@/lib/media-manager");

    // FULL RESET - clear everything without deleting files
    mediaManager.reset();

    setShowUnsavedDialog(false);
    setHasUnsavedChanges(false);
    if (pendingNavigation !== null) {
      if (typeof pendingNavigation === 'function') {
        pendingNavigation();
      } else if (typeof pendingNavigation === 'number') {
        navigate(pendingNavigation);
      } else {
        navigate(pendingNavigation);
      }
      setPendingNavigation(null);
    }
  };

  const handleSaveAndContinue = () => {
    setSaveOpen(true);
    setShowUnsavedDialog(false);
  };

  // Extract media URLs/base64 data URIs from HTML content
  const extractMediaFromContent = (htmlContent) => {
    const media = [];
    if (!htmlContent) return media;

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    const isExternalUrl = (src) => src && (src.includes('nebwork-storage') || src.includes('digitaloceanspaces.com'));
    const isBase64 = (src) => src && src.startsWith('data:');
    const isValidSrc = (src) => isExternalUrl(src) || isBase64(src);

    // Extract images (base64 or external URL)
    doc.querySelectorAll('img[src]').forEach(img => {
      const src = img.getAttribute('src');
      if (isValidSrc(src)) media.push(src);
    });

    // Extract videos
    doc.querySelectorAll('video source[src], video[src]').forEach(video => {
      const src = video.getAttribute('src');
      if (isValidSrc(src)) media.push(src);
    });

    // Extract audio
    doc.querySelectorAll('audio source[src], audio[src]').forEach(audio => {
      const src = audio.getAttribute('src');
      if (isValidSrc(src)) media.push(src);
    });

    // Extract documents from TipTap document nodes
    doc.querySelectorAll('div[data-type="document"][data-src], [data-type="document"][data-src]').forEach(docNode => {
      const src = docNode.getAttribute('data-src');
      if (isValidSrc(src)) media.push(src);
    });

    return media;
  };

  const handleSaveBlog = async () => {

    // Show loading state
    setIsSaving(true);

    try {
      const token = sessionStorage.getItem('token');
      let createdOrUpdatedWorklog;

      // Import media manager and upload functions
      const { mediaManager } = await import("@/lib/media-manager");
      const { handleImageUpload, deleteMediaFile } = await import("@/lib/tiptap-utils");

      // Step 1: Upload all pending media files

      const urlMap = await mediaManager.uploadAllPending(handleImageUpload);

      // Step 2: Replace blob URLs with DigitalOcean URLs in content
      let finalContent = mediaManager.replaceBlobUrlsInContent(blogContent, urlMap);

      // Step 3: SKIP deletion on save - only delete when user leaves editor
      // This allows undo/redo to work even after saving
      const pendingDeletions = mediaManager.getPendingDeletions();


      // Note: Deletions are tracked but not executed on save
      // They will be executed when user navigates away from the editor

      // Step 4: Extract media from final content
      const mediaFiles = extractMediaFromContent(finalContent);

      // ✅ VALIDATION: Validate before saving
      const dataToSave = {
        title: blogTitle || "Untitled Work Log",
        content: finalContent,
        tag: blogTags || [],
        collaborators: collaborators.map(c => c.id),
        media: mediaFiles,
      };

      if (isEditMode) {
        // update
        const response = await apiHandler.worklog.updateWorklog(postId, dataToSave);
        createdOrUpdatedWorklog = response;
      } else {
        // create - apiHandler.worklog.saveWorklog already has validation
        const response = await apiHandler.worklog.saveWorklog(dataToSave);
        createdOrUpdatedWorklog = response;
      }

      // ADD VERSION (LOG HISTORY)
      const worklogId = createdOrUpdatedWorklog?._id;
      if (worklogId) {
        await fetch(WORKLOG_ENDPOINTS.VERSIONS(worklogId), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          credentials: "include",
          body: JSON.stringify({
            message: commitMessage,
            snapshot: {
              title: blogTitle || "Untitled Work Log",
              content: finalContent, // FIXED: Use finalContent with DigitalOcean URLs, not blogContent with blob URLs
              tag: blogTags || [],
              collaborators: collaborators.map(c => c.id),
              media: mediaFiles,
            }
          })
        });
      }


      // CRITICAL: Update the editor content with final content (blob URLs replaced with DigitalOcean URLs)
      // Set flag to prevent triggering unsaved changes
      isProgrammaticUpdate.current = true;

      // Reset media manager BEFORE updating state (clear blob URLs)
      mediaManager.reset();

      // Store the final content in a ref so it's immediately available for re-mount
      contentForReMount.current = finalContent;

      // Update the content state with final content (has DigitalOcean URLs)
      setBlogContent(finalContent);

      // Force re-mount the editor with new content
      // The editor will use contentForReMount.current which has DigitalOcean URLs
      setEditorKey(prev => prev + 1);

      // Reset the flag after re-mount completes
      setTimeout(() => {
        isProgrammaticUpdate.current = false;
      }, 100);

      // Reset ONLY uploads after save (keep deletions for undo support)
      mediaManager.resetUploads();

      setSaveOpen(false);
      setCommitMessage("");
      setHasUnsavedChanges(false);

      // Clear draft on successful save (create mode)
      if (!isEditMode) {
        localStorage.removeItem(DRAFT_KEY);
        setDraftSavedAt(null);
        setHasDraftRestored(false);
      }

      // Hide loading state
      setIsSaving(false);

      // Show success toast notification
      toast({
        title: "✅ Work log saved successfully!",
        description: "Your changes have been saved.",
        duration: 3000,
      });

      // Only navigate if there's a pending navigation (user tried to leave while editing)
      if (pendingNavigation !== null) {
        // Delete pending deletions before navigating
        const pendingDeletions = mediaManager.getPendingDeletions();
        if (pendingDeletions.length > 0) {
          await mediaManager.deleteAllPending(deleteMediaFile);
        }

        // Now navigate
        if (typeof pendingNavigation === 'function') {
          pendingNavigation();
        } else if (typeof pendingNavigation === 'number') {
          navigate(pendingNavigation);
        } else {
          navigate(pendingNavigation);
        }
        setPendingNavigation(null);
      }
      // Otherwise stay on the page - don't navigate to /worklog
    } catch (err) {
      console.error('Error saving blog:', err);

      // Hide loading state on error
      setIsSaving(false);

      // Handle validation errors
      if (err.validationErrors) {
        // Combine all validation errors into one message
        const fieldNames = {
          title: 'Title',
          content: 'Content',
          tag: 'Tags'
        };

        const errorList = Object.entries(err.validationErrors)
          .map(([field, message]) => {
            const fieldName = fieldNames[field] || field;
            return `${fieldName}: ${message}`;
          });

        toast({
          variant: "destructive",
          title: "Validation Failed",
          description: (
            <div className="space-y-1">
              {errorList.map((error, index) => (
                <div key={index}>• {error}</div>
              ))}
            </div>
          ),
          duration: 5000,
        });
      } else if (err.message === 'No authentication token found') {
        toast({
          variant: "destructive",
          title: "Session Expired",
          description: "Please login again.",
          duration: 3000,
        });
        navigate('/login');
      } else if (err.message === 'Validation failed') {
        toast({
          variant: "destructive",
          title: "Validation Failed",
          description: "Please check your input and try again.",
          duration: 3000,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Save Failed",
          description: "Failed to save worklog. Please try again.",
          duration: 3000,
        });
      }

      // Hide loading state on error
      setIsSaving(false);
    }
  };

  // Show loading while fetching worklog in edit mode
  if (isLoadingWorklog && isEditMode) {
    return <Loading fullScreen message="Loading worklog..." />;
  }

  // Apply a template: pre-fill title, tags, content
  const applyTemplate = (template) => {
    setShowTemplateModal(false);
    if (template.id === 'scratch') return;
    isProgrammaticUpdate.current = true;
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    setBlogTitle(template.defaultTitle + today);
    setBlogTags(template.defaultTags || []);
    setBlogContent(template.content);
    contentForReMount.current = template.content;
    setEditorKey(prev => prev + 1);
    setTimeout(() => { isProgrammaticUpdate.current = false; }, 100);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Template Picker Modal */}
      {showTemplateModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'hsl(var(--background) / 0.85)',
          backdropFilter: 'blur(6px)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            background: 'hsl(var(--card))', borderRadius: '1.25rem',
            boxShadow: '0 8px 48px hsl(250 60% 20% / 0.25)',
            padding: '2rem', maxWidth: '640px', width: '100%',
            border: '1px solid hsl(var(--border))'
          }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.35rem', color: 'hsl(var(--foreground))' }}>
              Choose a Template
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', marginBottom: '1.5rem' }}>
              Pick a template to get started quickly, or write from scratch.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {WORKLOG_TEMPLATES.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => applyTemplate(tpl)}
                  style={{
                    background: 'hsl(250 60% 97%)', border: '2px solid hsl(250 60% 88%)',
                    borderRadius: '0.875rem', padding: '1rem 0.875rem',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'border-color 0.15s, transform 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'hsl(250 60% 60%)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'hsl(250 60% 88%)'; e.currentTarget.style.transform = ''; }}
                >
                  <span style={{ fontSize: '1.75rem', display: 'block', marginBottom: '0.5rem' }}>{tpl.icon}</span>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'hsl(var(--foreground))', marginBottom: '0.25rem' }}>{tpl.name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>{tpl.description}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => applyTemplate(SCRATCH_OPTION)}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '0.75rem',
                border: '1.5px dashed hsl(var(--border))', background: 'transparent',
                cursor: 'pointer', fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))',
                transition: 'background 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'hsl(var(--accent))'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              ✏️ Start from scratch
            </button>
          </div>
        </div>
      )}
      <Menubar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onNavigate={handleNavigationAttempt}
      />

      <main className="flex-1 flex flex-col">
        <Navbar onNavigate={handleNavigationAttempt} />

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col relative">
            {/* Draft restored banner */}
            {hasDraftRestored && !isEditMode && (
              <div style={{
                background: 'hsl(250 60% 96%)',
                borderBottom: '1px solid hsl(250 60% 85%)',
                padding: '0.5rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.85rem',
                color: 'hsl(250 60% 40%)',
                gap: '0.5rem',
              }}>
                <span>📋 Draft restored from your last session.</span>
                <button
                  onClick={() => {
                    localStorage.removeItem(DRAFT_KEY);
                    setHasDraftRestored(false);
                    isProgrammaticUpdate.current = true;
                    setBlogTitle(''); setBlogTags([]); setBlogContent('');
                    setEditorKey(prev => prev + 1);
                    setTimeout(() => { isProgrammaticUpdate.current = false; }, 100);
                  }}
                  style={{ fontSize: '0.78rem', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', color: 'inherit' }}
                >
                  Discard draft
                </button>
              </div>
            )}

            {/* Draft auto-save indicator */}
            {draftSavedAt && !isEditMode && (
              <div style={{
                position: 'absolute',
                bottom: '1rem',
                right: '1.5rem',
                fontSize: '0.75rem',
                color: 'hsl(var(--muted-foreground))',
                background: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
                padding: '0.25rem 0.6rem',
                zIndex: 10,
                pointerEvents: 'none',
              }}>
                ✓ Draft saved at {draftSavedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}

            {/* SimpleEditor with toolbar - toolbar will be sticky */}
            <div className="flex-1 overflow-y-auto">
              <SimpleEditor
                key={editorKey}
                initialContent={contentForReMount.current || blogContent}
                onContentChange={(content) => {
                  setBlogContent(content);
                  // Only mark as unsaved if it's a real user change (not programmatic update)
                  if (!isProgrammaticUpdate.current) {
                    setHasUnsavedChanges(true);
                  }
                }}
                initialTitle={blogTitle}
                initialTags={blogTags}
                onTitleChange={(title) => {
                  setBlogTitle(title);
                  if (!isProgrammaticUpdate.current) {
                    setHasUnsavedChanges(true);
                  }
                }}
                onTagsChange={(tags) => {
                  setBlogTags(tags);
                  if (!isProgrammaticUpdate.current) {
                    setHasUnsavedChanges(true);
                  }
                }}
                sidebarCollapsed={sidebarCollapsed}
                onBack={() => handleNavigationAttempt(-1)}
                onVersion={() => handleNavigationAttempt(`/worklogs/${postId}/versions`)}
              />
            </div>

            {/* Sticky Action Buttons - stick to bottom right of editor area */}
            <div className="sticky bottom-6 self-end mr-6 mb-6 flex flex-col gap-3 z-50" style={{ marginTop: '-120px' }}>
              {/* INVITE DIALOG - Only visible to owner */}
              {currentUserId === owner?.id && (
                <AlertDialog open={inviteOpen} onOpenChange={setInviteOpen}>
                  <Tooltip delay={200}>
                    <TooltipTrigger asChild>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-full h-14 w-14"
                        >
                          <Users style={{ width: '20px', height: '20px' }} />
                        </Button>
                      </AlertDialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Invite</TooltipContent>
                  </Tooltip>
                  <AlertDialogContent className="max-w-2xl">
                    <AlertDialogHeader>
                      <div className="flex items-center justify-between">
                        <AlertDialogTitle className="text-xl font-bold flex-1 text-center">
                          Invite Your Collaborators
                        </AlertDialogTitle>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setInviteOpen(false)}
                          className="h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <AlertDialogDescription className="text-center">
                        Choose colleagues to collaborate on this work log.
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          placeholder="Search"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      <div className="flex flex-col gap-3 py-4 h-96 overflow-y-auto">
                        {filteredFriends.length === 0 ? (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-muted-foreground">User not found!</p>
                          </div>
                        ) : (
                          filteredFriends.map((friend) => {
                            const isCollaborator = collaboratorIds.includes(friend.id);
                            const isSelected = selectedFriends.includes(friend.id) || isCollaborator;

                            return (
                              <div
                                key={friend.id}
                                onClick={() => toggleFriendSelection(friend.id)}
                                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${isCollaborator
                                  ? "border-primary bg-accent/30 cursor-not-allowed opacity-75"
                                  : `cursor-pointer hover:bg-accent/50 ${isSelected
                                    ? "border-primary bg-accent/30"
                                    : "border-border"
                                  }`
                                  }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  disabled={isCollaborator}
                                  onChange={() => { }}
                                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                                />
                                <img
                                  src={friend.avatar}
                                  alt={friend.name}
                                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm truncate">{friend.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">{friend.division}</p>
                                </div>
                                {isCollaborator && (
                                  <span className="text-xs text-primary font-medium">Added</span>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>

                      <div className="flex justify-center pt-4">
                        <Button
                          onClick={handleInvite}
                          disabled={selectedFriends.length === 0}
                          className="px-12"
                        >
                          INVITE
                        </Button>
                      </div>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>)}

              {/* SAVE WORKLOG DIALOG */}
              <AlertDialog open={saveOpen} onOpenChange={setSaveOpen}>
                <Tooltip delay={200}>
                  <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="default"
                        size="icon"
                        className="rounded-full h-14 w-14"
                      >
                        <Save style={{ width: '20px', height: '20px' }} />
                      </Button>
                    </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Save Work Log</TooltipContent>
                </Tooltip>
                <AlertDialogContent className="max-w-2xl">
                  <AlertDialogHeader>
                    <div className="flex items-center justify-between">
                      <AlertDialogTitle className="text-xl font-bold flex-1 text-center">
                        SAVE YOUR WORK LOG
                      </AlertDialogTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSaveOpen(false)}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <AlertDialogDescription className="text-center">
                      Provide a brief description of what you've changed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <div className="space-y-4">
                    <div>
                      <label className="text-center block mb-2 font-medium">
                        What task/changes did you do?
                      </label>
                      <Textarea
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        className="min-h-[200px] resize-none"
                        placeholder="Describe your changes..."
                      />
                    </div>

                    <div className="flex justify-center pt-4">
                      <Button
                        onClick={handleSaveBlog}
                        disabled={!commitMessage.trim()}
                        className="px-12"
                      >
                        SUBMIT
                      </Button>
                    </div>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <CollabList
            owner={owner}
            collaborators={collaborators}
            onRemoveCollaborator={currentUserId === owner?.id ? handleRemoveCollaborator : undefined}
            isOwner={currentUserId === owner?.id}
            onNavigate={handleNavigationAttempt}
          />
        </div>
      </main>

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-center">
              Unsaved Changes
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              You have unsaved changes that will be lost if you continue.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <p className="text-center text-muted-foreground">
              Changes have not been saved. Do you want to save the changes?
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleSaveAndContinue}
              className="w-full"
            >
              Save Changes
            </Button>
            <Button
              onClick={handleContinueWithoutSaving}
              variant="outline"
              className="w-full"
            >
              Continue without saving
            </Button>
            <Button
              onClick={() => {
                setShowUnsavedDialog(false);
                setPendingNavigation(null);
              }}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Saving Progress Dialog */}
      <AlertDialog open={isSaving}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-center">
              Saving Work Log
            </AlertDialogTitle>
            <AlertDialogDescription className="sr-only">
              Your work log is being saved to the server.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-8 flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            <p className="text-center text-muted-foreground">
              Saving work log, please wait...
            </p>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Adding Collaborator Progress Dialog */}
      <AlertDialog open={isAddingCollaborator}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-center">
              Adding Collaborators
            </AlertDialogTitle>
            <AlertDialogDescription className="sr-only">
              We are adding the selected collaborators to this work log.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-8 flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            <p className="text-center text-muted-foreground">
              Adding collaborators, please wait...
            </p>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Removing Collaborator Progress Dialog */}
      <AlertDialog open={isRemovingCollaborator}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-center">
              Removing Collaborator
            </AlertDialogTitle>
            <AlertDialogDescription className="sr-only">
              The selected collaborator is being removed from this work log.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-8 flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            <p className="text-center text-muted-foreground">
              Removing collaborator, please wait...
            </p>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Collaborator Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-center">
              Remove Collaborator
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Confirm if you want to remove this person from the project.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <p className="text-center text-muted-foreground">
              Are you sure you want to remove{" "}
              <span className="font-semibold text-foreground">
                {collaboratorToRemove?.name}
              </span>{" "}
              from this work log?
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={confirmRemoveCollaborator}
              variant="destructive"
              className="w-full"
            >
              Yes, Remove
            </Button>
            <Button
              onClick={() => {
                setShowRemoveDialog(false);
                setCollaboratorToRemove(null);
              }}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      {/* Remove Collaborator Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        {/* ... kode remove dialog ... */}
      </AlertDialog>

      {/* TAMBAHKAN DIALOG INI: */}
      {/* Invite Collaborator Confirmation Dialog */}
      <AlertDialog open={showInviteConfirmDialog} onOpenChange={setShowInviteConfirmDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-center">
              Invite Collaborators
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Confirm the invitation for the selected friends.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4 space-y-3">
            <p className="text-center text-muted-foreground">
              Are you sure you want to invite the following collaborator{selectedFriendsToInvite.length > 1 ? 's' : ''}?
            </p>

            {/* List of collaborators to invite */}
            <div className="max-h-48 overflow-y-auto space-y-2 px-2">
              {selectedFriendsToInvite.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-accent/30 border border-border"
                >
                  <img
                    src={friend.avatar}
                    alt={friend.name}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{friend.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{friend.division}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={confirmInvite}
              className="w-full"
            >
              Yes, Invite
            </Button>
            <Button
              onClick={() => {
                setShowInviteConfirmDialog(false);
                setSelectedFriendsToInvite([]);
                setInviteOpen(true); // Reopen invite dialog
              }}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>


    </div>
  );
};

export default BlogEditor;

