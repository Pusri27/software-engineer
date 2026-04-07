import { useState, useEffect } from 'react';
import { REACTION_ENDPOINTS } from '@/config/api';

const EMOJIS = ['👍', '❤️', '🔥', '💡'];

const ReactionBar = ({ worklogId }) => {
  const [reactions, setReactions] = useState({});  // { '👍': { count, reacted } }
  const [myEmoji, setMyEmoji] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReactions = async () => {
    const token = sessionStorage.getItem('token');
    if (!token || !worklogId) return;
    try {
      const res = await fetch(REACTION_ENDPOINTS.GET(worklogId), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setReactions(data.reactions || {});
      setMyEmoji(data.myEmoji || null);
    } catch (e) {
      console.warn('Reaction fetch failed:', e.message);
    }
  };

  useEffect(() => { fetchReactions(); }, [worklogId]);

  const handleReact = async (emoji) => {
    if (loading) return;
    const token = sessionStorage.getItem('token');
    if (!token) return;

    // Optimistic update
    const previousReactions = { ...reactions };
    const previousMyEmoji = myEmoji;

    setReactions(prev => {
      const next = {};
      EMOJIS.forEach(e => {
        next[e] = { ...prev[e] };
        // Remove old reaction from count
        if (e === previousMyEmoji && previousMyEmoji !== emoji) {
          next[e].count = Math.max(0, (next[e].count || 0) - 1);
          next[e].reacted = false;
        }
        // Add new reaction or toggle off
        if (e === emoji) {
          if (previousMyEmoji === emoji) {
            // Toggle off
            next[e].count = Math.max(0, (next[e].count || 0) - 1);
            next[e].reacted = false;
          } else {
            next[e].count = (next[e].count || 0) + 1;
            next[e].reacted = true;
          }
        }
      });
      return next;
    });
    setMyEmoji(previousMyEmoji === emoji ? null : emoji);

    setLoading(true);
    try {
      await fetch(REACTION_ENDPOINTS.TOGGLE(worklogId), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji })
      });
      // Sync from server after optimistic
      await fetchReactions();
    } catch (e) {
      // Rollback on error
      setReactions(previousReactions);
      setMyEmoji(previousMyEmoji);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      padding: '0.75rem 0', flexWrap: 'wrap'
    }}>
      <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginRight: '0.25rem' }}>
        Kudos:
      </span>
      {EMOJIS.map(emoji => {
        const data = reactions[emoji] || { count: 0, reacted: false };
        const isActive = myEmoji === emoji;
        return (
          <button
            key={emoji}
            onClick={() => handleReact(emoji)}
            disabled={loading}
            title={isActive ? `Remove your ${emoji}` : `React with ${emoji}`}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              padding: '0.3rem 0.6rem',
              borderRadius: '2rem',
              border: `1.5px solid ${isActive ? 'hsl(250,60%,60%)' : 'hsl(var(--border))'}`,
              background: isActive ? 'hsl(250,60%,95%)' : 'hsl(var(--background))',
              cursor: loading ? 'wait' : 'pointer',
              fontSize: '1rem',
              transition: 'all 0.15s',
              transform: isActive ? 'scale(1.08)' : 'scale(1)',
              fontWeight: isActive ? 700 : 400,
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.borderColor = 'hsl(250,60%,60%)'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = 'hsl(var(--border))'; }}
          >
            <span>{emoji}</span>
            {data.count > 0 && (
              <span style={{ fontSize: '0.75rem', color: isActive ? 'hsl(250,60%,45%)' : 'hsl(var(--muted-foreground))' }}>
                {data.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ReactionBar;
