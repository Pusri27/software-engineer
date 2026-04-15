import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { createPortal } from 'react-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useVideoCall } from '@/hooks/use-video-call';
import { AUTH_ENDPOINTS, ADMIN_ENDPOINTS } from '@/config/api';
import './VideoCall.css';
export default function VideoCallModal({ isOpen, onClose }) {
    const [friends, setFriends] = useState([]);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [peerIdInput, setPeerIdInput] = useState('');
    const [myName, setMyName] = useState('');
    const [copied, setCopied] = useState(false);
    const [view, setView] = useState('friends'); // 'friends' | 'call'

    const {
        myId, callActive, incomingCall, callerName,
        myVideoRef, remoteVideoRef,
        startCall, answerCall, rejectCall, endCall
    } = useVideoCall();

    // Fetch friends (same logic as FriendsList)
    useEffect(() => {
        if (!isOpen) return;
        const token = sessionStorage.getItem('token');

        fetch(AUTH_ENDPOINTS.PROFILE, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => {
                const user = data.user || data;
                setMyName(user.name || '');
                const division = user.division;
                const id = user.id || user._id;

                return fetch(ADMIN_ENDPOINTS.EMPLOYEES, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                    .then(r => r.json())
                    .then(empData => {
                        const all = empData.data || empData.employees || empData || [];
                        const filtered = all
                            .filter(emp => emp.division === division && emp._id !== id)
                            .map(emp => ({
                                id: emp._id,
                                name: emp.name,
                                division: emp.division,
                                avatar: emp.profile_photo || '/placeholder.jpeg'
                            }));
                        setFriends(filtered);
                    });
            })
            .catch(console.error);
    }, [isOpen]);

    const handleCallFriend = (friend) => {
        setSelectedFriend(friend);
        setView('call');
    };

    const handleStartCall = () => {
        if (!peerIdInput.trim()) return;
        startCall(peerIdInput.trim(), myName);
    };

    const handleEnd = () => {
        endCall();
        setView('friends');
        setSelectedFriend(null);
        setPeerIdInput('');
    };

    const handleAnswerCall = () => {
        setView('call');
        setTimeout(() => {
            answerCall();
        }, 50);
    };

    const handleClose = () => {
        endCall();
        setView('friends');
        setSelectedFriend(null);
        setPeerIdInput('');
        onClose();
    };

    const copyId = () => {
        navigator.clipboard.writeText(myId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return createPortal(    // 👈 wrap your JSX with createPortal
        <div className="vcm-overlay">
            <div className="vcm-modal">
                {/* Header */}
                <div className="vcm-header">
                    <h2 className="vcm-title">
                        {view === 'friends' ? 'Start a Call' : `Call with ${selectedFriend?.name || ''}`}
                    </h2>
                    <button className="vcm-close" onClick={handleClose}>✕</button>
                </div>

                {/* Incoming call banner */}
                {incomingCall && (
                    <div className="vcm-incoming">
                        <p>📲 <strong>{callerName}</strong> is calling you...</p>
                        <div className="vcm-incoming-actions">
                            <Button size="sm" onClick={handleAnswerCall}>Answer</Button>
                            <Button size="sm" variant="destructive" onClick={rejectCall}>Decline</Button>
                        </div>
                    </div>
                )}

                {/* Your Peer ID */}
                <div className="vcm-my-id">
                    <span>Your ID: <code>{myId || 'Connecting...'}</code></span>
                    <button className="vcm-copy" onClick={copyId}>
                        {copied ? '✅ Copied' : 'Copy'}
                    </button>
                </div>

                {/* Friends list view */}
                {view === 'friends' && (
                    <div className="vcm-friends">
                        <p className="vcm-hint">Select a friend to call. Share your ID above so they can call you back.</p>
                        {friends.length === 0 ? (
                            <p className="vcm-empty">No friends in your division found.</p>
                        ) : (
                            friends.map(friend => (
                                <div key={friend.id} className="vcm-friend-item">
                                    <Avatar>
                                        <AvatarImage src={friend.avatar} />
                                        <AvatarFallback>{friend.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="vcm-friend-info">
                                        <p className="vcm-friend-name">{friend.name}</p>
                                        <p className="vcm-friend-division">{friend.division}</p>
                                    </div>
                                    <Button size="sm" onClick={() => handleCallFriend(friend)}>
                                        Call
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Call view */}
                {view === 'call' && (
                    <div className="vcm-call">
                        <div className="vcm-videos">
                            <video ref={remoteVideoRef} autoPlay playsInline className="vcm-remote-video" />
                            <video ref={myVideoRef} autoPlay playsInline muted className="vcm-my-video" />
                        </div>

                        {!callActive && (
                            <div className="vcm-peer-input">
                                <p className="vcm-hint">
                                    Ask <strong>{selectedFriend?.name}</strong> to share their ID, then paste it below.
                                </p>
                                <input
                                    className="vcm-input"
                                    placeholder="Paste friend's Peer ID"
                                    value={peerIdInput}
                                    onChange={e => setPeerIdInput(e.target.value)}
                                />
                                <Button onClick={handleStartCall} disabled={!peerIdInput.trim()}>
                                    Start Call
                                </Button>
                            </div>
                        )}

                        {callActive && (
                            <p className="vcm-status">🟢 Call connected</p>
                        )}

                        <Button variant="destructive" onClick={handleEnd}>
                            End Call
                        </Button>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}