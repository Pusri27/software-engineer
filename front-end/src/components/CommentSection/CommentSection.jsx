import { useState, useEffect } from 'react';
import { COMMENT_ENDPOINTS } from '@/config/api';

const formatRelative = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const Avatar = ({ user, size = 32 }) => {
  const initial = (user?.name || 'U')[0].toUpperCase();
  return user?.profile_photo || user?.profilePicture ? (
    <img
      src={user.profile_photo || user.profilePicture}
      alt={user.name}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
    />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'hsl(250,60%,88%)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, fontWeight: 700, color: 'hsl(250,60%,35%)'
    }}>{initial}</div>
  );
};

// Single comment + replies
const CommentItem = ({ comment, worklogId, currentUserId, onDelete, onReply }) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReply = async () => {
    if (!replyText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(COMMENT_ENDPOINTS.REPLY(worklogId, comment._id), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        onReply(comment._id, data.comment);
        setReplyText('');
        setShowReplyInput(false);
      }
    } finally { setSubmitting(false); }
  };

  const isOwn = comment.user?._id === currentUserId;

  return (
    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
      <Avatar user={comment.user} />
      <div style={{ flex: 1 }}>
        <div style={{
          background: 'hsl(var(--muted))', borderRadius: '0 0.75rem 0.75rem 0.75rem',
          padding: '0.6rem 0.875rem', position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'hsl(var(--foreground))' }}>
              {comment.user?.name || 'Unknown'}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))' }}>
              {comment.user?.division}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))', marginLeft: 'auto' }}>
              {formatRelative(comment.createdAt)}
            </span>
            {isOwn && (
              <button
                onClick={() => onDelete(comment._id, !!comment.parentId)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.7rem',
                  color: 'hsl(0,60%,55%)', padding: '0 0.25rem' }}
                title="Delete comment"
              >✕</button>
            )}
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'hsl(var(--foreground))', lineHeight: 1.5 }}>
            {comment.content}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem', paddingLeft: '0.5rem' }}>
          <button
            onClick={() => setShowReplyInput(p => !p)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem',
              color: 'hsl(var(--muted-foreground))' }}
          >
            {showReplyInput ? 'Cancel' : 'Reply'}
          </button>
        </div>

        {/* Reply input */}
        {showReplyInput && (
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <input
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleReply()}
              style={{
                flex: 1, padding: '0.4rem 0.75rem', borderRadius: '1rem',
                border: '1.5px solid hsl(var(--border))', background: 'hsl(var(--background))',
                fontSize: '0.8rem', outline: 'none', color: 'hsl(var(--foreground))'
              }}
              autoFocus
            />
            <button
              onClick={handleReply}
              disabled={submitting || !replyText.trim()}
              style={{
                background: 'hsl(250,60%,55%)', color: 'white', border: 'none',
                borderRadius: '1rem', padding: '0.4rem 0.875rem', fontSize: '0.8rem',
                cursor: submitting ? 'wait' : 'pointer', opacity: !replyText.trim() ? 0.5 : 1
              }}
            >{submitting ? '...' : 'Send'}</button>
          </div>
        )}

        {/* Replies */}
        {comment.replies?.length > 0 && (
          <div style={{ marginTop: '0.5rem', paddingLeft: '1rem', borderLeft: '2px solid hsl(var(--border))' }}>
            {comment.replies.map(reply => (
              <div key={reply._id} style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.6rem' }}>
                <Avatar user={reply.user} size={26} />
                <div style={{ flex: 1 }}>
                  <div style={{
                    background: 'hsl(var(--muted))', borderRadius: '0 0.6rem 0.6rem 0.6rem',
                    padding: '0.4rem 0.75rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.15rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.75rem' }}>{reply.user?.name}</span>
                      <span style={{ fontSize: '0.65rem', color: 'hsl(var(--muted-foreground))', marginLeft: 'auto' }}>
                        {formatRelative(reply.createdAt)}
                      </span>
                      {reply.user?._id === currentUserId && (
                        <button
                          onClick={() => onDelete(reply._id, true)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: '0.65rem', color: 'hsl(0,60%,55%)', padding: '0 0.2rem' }}
                        >✕</button>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.4 }}>{reply.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main CommentSection ───────────────────────────────────────────────────────
const CommentSection = ({ worklogId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) return;
    // Get current user ID from token payload
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCurrentUserId(payload.id || payload._id || payload.userId);
    } catch (e) {}

    // Fetch comments
    fetch(COMMENT_ENDPOINTS.GET(worklogId), {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => setComments(data.comments || []))
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [worklogId]);

  const handleAddComment = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(COMMENT_ENDPOINTS.ADD(worklogId), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        setComments(prev => [...prev, data.comment]);
        setNewComment('');
      }
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (commentId, isReply) => {
    const token = sessionStorage.getItem('token');
    try {
      const res = await fetch(COMMENT_ENDPOINTS.DELETE(commentId), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        if (isReply) {
          // Remove reply from its parent
          setComments(prev => prev.map(c => ({
            ...c,
            replies: (c.replies || []).filter(r => r._id !== commentId)
          })));
        } else {
          setComments(prev => prev.filter(c => c._id !== commentId));
        }
      }
    } catch (e) { console.error('Delete comment error', e); }
  };

  const handleReply = (parentId, reply) => {
    setComments(prev => prev.map(c =>
      c._id === parentId ? { ...c, replies: [...(c.replies || []), reply] } : c
    ));
  };

  return (
    <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid hsl(var(--border))' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', color: 'hsl(var(--foreground))' }}>
        💬 Discussion ({comments.length})
      </h3>

      {/* Add comment input */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <textarea
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          rows={2}
          onKeyDown={e => e.key === 'Enter' && e.metaKey && handleAddComment()}
          style={{
            flex: 1, padding: '0.6rem 0.875rem', borderRadius: '0.75rem',
            border: '1.5px solid hsl(var(--border))', background: 'hsl(var(--background))',
            fontSize: '0.875rem', resize: 'none', outline: 'none',
            color: 'hsl(var(--foreground))', lineHeight: 1.5,
            transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = 'hsl(250,60%,60%)'}
          onBlur={e => e.target.style.borderColor = 'hsl(var(--border))'}
        />
        <button
          onClick={handleAddComment}
          disabled={submitting || !newComment.trim()}
          style={{
            background: 'hsl(250,60%,55%)', color: 'white', border: 'none',
            borderRadius: '0.75rem', padding: '0 1.25rem', fontSize: '0.875rem',
            cursor: submitting ? 'wait' : 'pointer',
            opacity: !newComment.trim() ? 0.5 : 1, alignSelf: 'flex-end', height: '2.5rem'
          }}
        >{submitting ? '...' : 'Post'}</button>
      </div>

      {/* Comments list */}
      {loading ? (
        <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>Loading comments...</p>
      ) : comments.length === 0 ? (
        <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' }}>
          No comments yet. Be the first to start a discussion!
        </p>
      ) : (
        comments.map(comment => (
          <CommentItem
            key={comment._id}
            comment={comment}
            worklogId={worklogId}
            currentUserId={currentUserId}
            onDelete={handleDelete}
            onReply={handleReply}
          />
        ))
      )}
    </div>
  );
};

export default CommentSection;
