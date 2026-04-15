import { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';

export function useVideoCall() {
    const [myId, setMyId] = useState('');
    const [callActive, setCallActive] = useState(false);
    const [incomingCall, setIncomingCall] = useState(null);
    const [callerName, setCallerName] = useState('');
    const myVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerRef = useRef(null);
    const myStreamRef = useRef(null);
    const activeCallRef = useRef(null);

    useEffect(() => {
        const peer = new Peer();
        peerRef.current = peer;

        peer.on('open', (id) => setMyId(id));

        peer.on('call', (call) => {
            setIncomingCall(call);
            setCallerName(call.metadata?.callerName || 'Someone');
        });

        return () => peer.destroy();
    }, []);

    const getMedia = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        myStreamRef.current = stream;
        if (myVideoRef.current) myVideoRef.current.srcObject = stream;
        return stream;
    };

    const startCall = async (remotePeerId, myName) => {
        const stream = await getMedia();
        const call = peerRef.current.call(remotePeerId, stream, {
            metadata: { callerName: myName }
        });
        activeCallRef.current = call;
        call.on('stream', (remoteStream) => {
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
            setCallActive(true);
        });
    };

    const answerCall = async () => {
        const stream = await getMedia();
        incomingCall.answer(stream);
        activeCallRef.current = incomingCall;
        incomingCall.on('stream', (remoteStream) => {
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
            setCallActive(true);
            setIncomingCall(null);
        });
    };

    const rejectCall = () => {
        incomingCall?.close();
        setIncomingCall(null);
    };

    const endCall = () => {
        activeCallRef.current?.close();
        myStreamRef.current?.getTracks().forEach(track => track.stop());
        if (myVideoRef.current) myVideoRef.current.srcObject = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        setCallActive(false);
        setIncomingCall(null);
    };

    return {
        myId, callActive, incomingCall, callerName,
        myVideoRef, remoteVideoRef,
        startCall, answerCall, rejectCall, endCall
    };
}