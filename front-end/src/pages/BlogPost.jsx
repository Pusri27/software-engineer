import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, FileText, Pencil, Trash2} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Menubar from "@/components/Menubar/Menubar";
import Navbar from "@/components/Navbar/Navbar";
import FriendsList from "@/components/FriendsList/FriendsList";
import { ADMIN_ENDPOINTS, AUTH_ENDPOINTS, WORKLOG_ENDPOINTS, UPLOAD_ENDPOINTS } from "../config/api";
import { Loading } from "@/components/ui/loading";
import { useToast } from "@/hooks/use-toast";
import { FileIcon, Download, ExternalLink } from "lucide-react";
// Import TipTap node styles for proper rendering
import "@/components/tiptap-node/document-node/document-node.scss";
import "@/components/tiptap-node/image-node/image-node.scss";
import "@/components/tiptap-node/video-node/video-node.scss";
import "@/components/tiptap-node/audio-node/audio-node.scss";
import ReactionBar from "@/components/ReactionBar/ReactionBar";
import CommentSection from "@/components/CommentSection/CommentSection";

// Custom styles for BlogPost
const blogPostStyles = `
  .prose img,
  .prose video,
  .tiptap-image img,
  .tiptap-video video {
    border-radius: 16px !important;
  }
  
  .prose audio,
  .tiptap-audio {
    width: 100% !important;
    max-width: 100% !important;
    display: block !important;
  }
`;

// Component to render documents embedded in content
const DocumentPreview = ({ src, filename, filesize }) => {
  const getFileExtension = (name) => {
    const parts = name.split('.');
    return parts.length > 1 ? parts.pop().toUpperCase() : 'FILE';
  };

  const getFileColor = (name) => {
    const ext = getFileExtension(name).toLowerCase();
    const colorMap = {
      pdf: '#dc2626', doc: '#2563eb', docx: '#2563eb',
      xls: '#16a34a', xlsx: '#16a34a',
      ppt: '#ea580c', pptx: '#ea580c',
      txt: '#6b7280',
    };
    return colorMap[ext] || '#8b5cf6';
  };

  const fileColor = getFileColor(filename);

  return (
    <div className="tiptap-document-node my-4">
      <div 
        className="tiptap-document-wrapper"
        style={{ borderLeftColor: fileColor, cursor: 'pointer' }}
        onClick={() => window.open(src, '_blank')}
      >
        <div className="tiptap-document-icon">
          <div className="tiptap-document-icon-bg" style={{ backgroundColor: fileColor }}>
            <FileIcon size={24} style={{ color: 'white' }} />
          </div>
          <span className="tiptap-document-ext" style={{ backgroundColor: fileColor, color: 'white' }}>
            {getFileExtension(filename)}
          </span>
        </div>
        <div className="tiptap-document-info">
          <div className="tiptap-document-filename">{filename}</div>
          {filesize && <div className="tiptap-document-filesize">{filesize}</div>}
        </div>
        <div className="tiptap-document-actions">
          <ExternalLink size={20} />
        </div>
      </div>
    </div>
  );
};

const BlogPost = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const snapshot = location.state?.snapshot;
  const historyId = location.state?.historyId;

  const [searchParams] = useSearchParams();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const postId = searchParams.get("id");
  const [post, setPost] = useState(null);
  const [displayPost, setDisplayPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateTime, setDateTime] = useState(null);
  const [friends, setFriends] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [relatedWorklogs, setRelatedWorklogs] = useState([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const { toast } = useToast();

  // ── Export helpers ──────────────────────────────────────────────────
  const exportPDF = () => {
    setShowExportMenu(false);
    // Inject print-only class to content then call print
    const style = document.createElement('style');
    style.id = 'print-style';
    style.textContent = `
      @media print {
        body > * { display: none !important; }
        #blog-post-printable { display: block !important; }
        #blog-post-printable { position: fixed; top: 0; left: 0; width: 100%; padding: 2rem; }
        .no-print { display: none !important; }
      }
    `;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => document.getElementById('print-style')?.remove(), 1000);
  };

  const htmlToMarkdown = (html) => {
    const el = document.createElement('div');
    el.innerHTML = html;
    // Remove style/script tags
    el.querySelectorAll('style, script').forEach(e => e.remove());
    let md = el.innerHTML
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
      .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '_$1_')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '_$1_')
      .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
      .replace(/<pre[^>]*>(.*?)<\/pre>/gis, '```\n$1\n```')
      .replace(/<a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"/gi, '![$2]($1)')
      .replace(/<img[^>]*src="([^"]+)"[^>]*/gi, '![]($1)')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<\/?(ul|ol)[^>]*>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '  \n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<p[^>]*>/gi, '')
      .replace(/<[^>]+>/g, '') // strip remaining tags
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
      .replace(/\n{3,}/g, '\n\n').trim();
    return md;
  };

  const exportMarkdown = () => {
    setShowExportMenu(false);
    if (!displayPost) return;
    const title = displayPost.title || 'worklog';
    const author = post?.user?.name || 'Unknown';
    const date = new Date(displayPost.datetime || displayPost.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const tags = (displayPost.tag || []).map(t => `#${t.replace(/^#+/, '')}`).join(' ');
    const body = htmlToMarkdown(displayPost.content || '');
    const markdown = `# ${title}\n\n**Author:** ${author}  \n**Date:** ${date}  \n**Tags:** ${tags || '—'}\n\n---\n\n${body}`;
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get current user ID
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
      } catch (err) {
        console.error('Error fetching current user:', err);
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch detail worklog dari backend
  useEffect(() => {
    if (!postId) return;
    
    const fetchPost = async () => {
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
        setPost(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching post:', err);
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  // Fetch friends dari backend
  useEffect(() => {
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
        const friendsList = data.data || data.employees || data || [];
        setFriends(friendsList);
      } catch (err) {
        console.error('Error fetching friends:', err);
      }
    };
    fetchFriends();
  }, []);

  // Fetch related worklogs (semantic similarity via vector search)
  useEffect(() => {
    if (!postId) return;
    const fetchRelated = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const res = await fetch(WORKLOG_ENDPOINTS.RELATED(postId), {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setRelatedWorklogs(data.related || []);
      } catch (e) {
        // silent fail — related is non-critical
      }
    };
    fetchRelated();
  }, [postId]);

  // Check apakah user adalah owner atau collaborator
  const isOwner = post && currentUserId && (post.user?._id === currentUserId || post.user?.id === currentUserId);
  const isCollaborator = post && currentUserId && 
    post.collaborators?.some(collab => 
      collab._id === currentUserId || collab.id === currentUserId
    );
  const canEdit = isOwner || isCollaborator;

  const handleEditClick = () => {
    navigate(`/blog-editor?id=${postId}`);
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  // Helper function to get last edited text
  const getLastEditedText = (datetime) => {
    if (!datetime) return "Last edited: Unknown";
    
    const now = new Date();
    const edited = new Date(datetime);
    const diffMs = now - edited;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) {
      return "Recently edited";
    } else if (diffMinutes < 60) {
      return `Last edited: ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `Last edited: ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 8) {
      return `Last edited: ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return `Last edited: ${edited.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })}`;
    }
  };

  // Process content to extract and render documents
  const processContent = (htmlContent) => {
    if (!htmlContent) return { __html: '' };
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // Find all document nodes
    const documentNodes = doc.querySelectorAll('[data-type="document"]');
    
    documentNodes.forEach((node, index) => {
      const src = node.getAttribute('data-src');
      const filename = node.getAttribute('data-filename');
      const filesize = node.getAttribute('data-filesize');
      
      if (src && filename) {
        // Create a placeholder div that will be replaced by React
        const placeholder = document.createElement('div');
        placeholder.setAttribute('data-document-placeholder', index);
        placeholder.setAttribute('data-src', src);
        placeholder.setAttribute('data-filename', filename);
        if (filesize) placeholder.setAttribute('data-filesize', filesize);
        
        node.parentNode.replaceChild(placeholder, node);
      }
    });
    
    return { __html: doc.body.innerHTML };
  };

  // Render document placeholders as React components
  useEffect(() => {
    if (!displayPost?.content) return;
    
    const placeholders = document.querySelectorAll('[data-document-placeholder]');
    placeholders.forEach((placeholder) => {
      const src = placeholder.getAttribute('data-src');
      const filename = placeholder.getAttribute('data-filename');
      const filesize = placeholder.getAttribute('data-filesize');
      
      if (src && filename && placeholder.childNodes.length === 0) {
        const container = document.createElement('div');
        placeholder.appendChild(container);
        
        import('react-dom/client').then(({ createRoot }) => {
          const root = createRoot(container);
          root.render(<DocumentPreview src={src} filename={filename} filesize={filesize} />);
        });
      }
    });
  }, [displayPost]);

  // Helper function to extract media URLs from content (for deletion)
  const extractMediaUrls = (content, mediaArray = []) => {
    const urls = [];
    
    // Extract from media array (it's an array of URL strings)
    if (Array.isArray(mediaArray)) {
      mediaArray.forEach(mediaUrl => {
        if (typeof mediaUrl === 'string' && mediaUrl.includes('digitaloceanspaces.com')) {
          urls.push(mediaUrl);
        }
      });
    }
    
    // Extract from HTML content (images, videos, audio, and documents)
    if (content && typeof content === 'string') {
      const imgRegex = /<img[^>]+src="([^">]+)"/g;
      const videoRegex = /<video[^>]+src="([^">]+)"/g;
      const sourceRegex = /<source[^>]+src="([^">]+)"/g;
      const audioRegex = /<audio[^>]+src="([^">]+)"/g;
      const documentRegex = /<div[^>]+data-type="document"[^>]*data-src="([^">]+)"/g;
      
      let match;
      
      // Extract image URLs
      while ((match = imgRegex.exec(content)) !== null) {
        if (match[1] && match[1].includes('digitaloceanspaces.com')) {
          urls.push(match[1]);
        }
      }
      
      // Extract video URLs
      while ((match = videoRegex.exec(content)) !== null) {
        if (match[1] && match[1].includes('digitaloceanspaces.com')) {
          urls.push(match[1]);
        }
      }
      
      // Extract source URLs (for video/audio)
      while ((match = sourceRegex.exec(content)) !== null) {
        if (match[1] && match[1].includes('digitaloceanspaces.com')) {
          urls.push(match[1]);
        }
      }
      
      // Extract audio URLs
      while ((match = audioRegex.exec(content)) !== null) {
        if (match[1] && match[1].includes('digitaloceanspaces.com')) {
          urls.push(match[1]);
        }
      }
      
      // Extract document URLs
      while ((match = documentRegex.exec(content)) !== null) {
        if (match[1] && match[1].includes('digitaloceanspaces.com')) {
          urls.push(match[1]);
        }
      }
    }
    
    // Remove duplicates
    return [...new Set(urls)];
  };

  const confirmDelete = async () => {
    setIsDeleting(true);

    try {
      const token = sessionStorage.getItem('token');
      
      // Step 1: Extract and delete media files first (images, videos, audio, documents)
      if (post && (post.content || post.media)) {
        const mediaUrls = extractMediaUrls(post.content, post.media);
        
        if (mediaUrls.length > 0) {
          
          const deleteMediaResponse = await fetch(UPLOAD_ENDPOINTS.DELETE_MULTIPLE, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ urls: mediaUrls })
          });
          
          const deleteResult = await deleteMediaResponse.json();
          
          if (!deleteMediaResponse.ok) {
            console.warn('Failed to delete some media files:', deleteResult);
            // Continue with worklog deletion even if media deletion fails
          }
        }
      }
      
      // Step 2: Delete the worklog
      const response = await fetch(WORKLOG_ENDPOINTS.ONE(postId), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setShowDeleteDialog(false);
        toast({
          title: "✅ Work log deleted successfully!",
          description: "The work log has been removed.",
          duration: 3000,
        });
        // Navigate after showing success message
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else {
        const data = await response.json();
        toast({
          title: "Failed to delete work log",
          description: data.message || "Please try again.",
          variant: "destructive",
        });
        setIsDeleting(false);
      }
    } catch (err) {
      console.error('Error deleting work log:', err);
      toast({
        title: "Failed to delete work log",
        description: "Please try again.",
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  };

  // FETCH LOG HISTORY + MERGE SNAPSHOT
  useEffect(() => {
    // case 1: buka versi history
    if (snapshot && historyId) {

      const token = sessionStorage.getItem("token");

      fetch(WORKLOG_ENDPOINTS.LOGHISTORY_ONE(historyId), {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => {
          return r.json();
        })
        .then(json => {

          // MERGE
          setDisplayPost({
            ...snapshot,        // isi content
            datetime: json.datetime, // datetime history
            media: post?.media || [] // preserve media from main post
          });
        })
        .catch(err => console.error("[DEBUG] ERROR fetch loghistory:", err));

      return; // <— STOP disini, jangan jalan bagian post
    }

    // case 2: normal post (tanpa versi)
    if (post) {
      setDisplayPost(post);
    }
  }, [snapshot, historyId, post]);

  if (loading || !displayPost) {
    return <Loading fullScreen message="Loading work log..." />;
  }

  if (!post) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <p>Post not found</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <style>{blogPostStyles}</style>
      <Menubar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main className="flex-1 flex flex-col">
        <Navbar />

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 p-8 overflow-y-auto bg-background">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigate(-1)}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                
                {!snapshot && canEdit && (
                  <div className="flex gap-2">
                    <Button onClick={handleEditClick} className="gap-2 h-9">
                      <Pencil className="h-4 w-4" />
                      Edit Work Log
                    </Button>
                    {isOwner && (
                      <Button 
                        onClick={handleDeleteClick}
                        variant="destructive"
                        className="gap-2 h-9"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Work Log
                      </Button>
                    )}
                  </div>
                )}

                {/* Export dropdown — always visible */}
                <div style={{ position: 'relative' }} className="no-print">
                  <Button
                    variant="outline"
                    className="gap-2 h-9"
                    onClick={() => setShowExportMenu(prev => !prev)}
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                  {showExportMenu && (
                    <div style={{
                      position: 'absolute', right: 0, top: '110%',
                      background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
                      borderRadius: '0.75rem', boxShadow: '0 8px 24px hsl(0,0%,0%,0.12)',
                      minWidth: '160px', zIndex: 50, overflow: 'hidden'
                    }}>
                      <button
                        onClick={exportPDF}
                        style={{ display: 'block', width: '100%', padding: '0.65rem 1rem',
                          textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: '0.875rem', color: 'hsl(var(--foreground))' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'hsl(var(--accent))'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >🖨️ Export as PDF</button>
                      <button
                        onClick={exportMarkdown}
                        style={{ display: 'block', width: '100%', padding: '0.65rem 1rem',
                          textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: '0.875rem', color: 'hsl(var(--foreground))' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'hsl(var(--accent))'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >📄 Export as Markdown</button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Header Bar */}
              <div className="bg-primary/10 rounded-t-2xl px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-primary">
                    {post.collaborators && post.collaborators.length > 0 ? "Collaboration Work" : "Own Work"}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground italic">
                  {getLastEditedText(displayPost.updatedAt || displayPost.datetime || displayPost.createdAt)}
                </div>
              </div>
              
              {/* Main Card - removed top border radius */}
              <div className="bg-card/50 backdrop-blur-sm rounded-b-2xl p-8 border-t-0">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={post.user?.profilePicture || post.user?.profile_photo || "/placeholder.jpeg"} />
                      <AvatarFallback>
                        {(post.user?.name || "Unknown").substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-lg text-foreground">{post.user?.name || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">{post.user?.division || "N/A"}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>
                      {new Date(displayPost.datetime || displayPost.createdAt).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                    <p>
                      {new Date(displayPost.datetime || displayPost.createdAt).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })} WIB
                    </p>
                  </div>
                </div>

                <h1 className="text-3xl font-bold mb-4 text-foreground">{displayPost.title}</h1>

                {displayPost.tag && displayPost.tag.length > 0 && (
                  <p className="text-sm text-muted-foreground mb-6">
                    {displayPost.tag.map((t) => t.startsWith('#') ? t : `#${t}`).join(" ")}
                  </p>
                )}

                {/* 👍 Reaction / Kudos Bar */}
                {!snapshot && postId && (
                  <ReactionBar worklogId={postId} />
                )}

                <div 
                  className="prose prose-lg max-w-none text-foreground"
                  dangerouslySetInnerHTML={processContent(displayPost.content)}
                />

                {/* 💬 Comment Section */}
                {!snapshot && postId && (
                  <CommentSection worklogId={postId} />
                )}
              </div>
            </div>

            {/* Related Worklogs */}
            {relatedWorklogs.length > 0 && (
              <div className="max-w-4xl mx-auto mt-8">
                <h2 style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  marginBottom: '0.75rem',
                  color: 'hsl(var(--muted-foreground))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>Related Worklogs</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  {relatedWorklogs.map((rel) => (
                    <div
                      key={rel._id}
                      onClick={() => navigate(`/blog-post?id=${rel._id}`)}
                      style={{
                        background: 'hsl(250 60% 96%)',
                        border: '1px solid hsl(250 60% 88%)',
                        borderRadius: '0.75rem',
                        padding: '0.875rem 1rem',
                        cursor: 'pointer',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px hsl(250 60% 70% / 0.25)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                    >
                      <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.35rem', color: 'hsl(var(--foreground))' }}>
                        {rel.title}
                      </p>
                      {rel.tag?.length > 0 && (
                        <p style={{ fontSize: '0.75rem', color: 'hsl(250 60% 50%)', marginBottom: '0.35rem' }}>
                          {rel.tag.slice(0, 3).map(t => t.startsWith('#') ? t : `#${t}`).join(' ')}
                        </p>
                      )}
                      <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                        {rel.userName} &middot; {new Date(rel.datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <FriendsList/>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-bold text-center text-destructive">
                Delete Work Log
              </AlertDialogTitle>
            </AlertDialogHeader>

            <div className="py-3">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
              <p className="text-center font-semibold text-foreground mb-2">
                This action cannot be undone!
              </p>
              <p className="text-center text-sm text-muted-foreground">
                All content, media files, and version history will be permanently deleted.
              </p>
            </div>
            
            <p className="text-center text-muted-foreground">
              Are you sure you want to delete this work log?
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={confirmDelete}
              variant="destructive"
              className="w-full"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Deleting...
                </div>
              ) : (
                'Yes'
              )}
            </Button>
            <Button
              onClick={() => {
                setShowDeleteDialog(false);
              }}
              variant="outline"
              className="w-full"
              disabled={isDeleting}
            >
              Cancel
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BlogPost;


