import { useState, useEffect } from "react";
import Menubar from "../Menubar/Menubar";
import Navbar from "../Navbar/Navbar";
import ChatArea from "../ChatArea/ChatArea";
import ChatHistory from "../ChatHistory/ChatHistory";
import "./ChatBot.css";
import { AUTH_ENDPOINTS, CHATBOT_ENDPOINTS } from "../../config/api";

const ChatBot = () => {

  const [messages, setMessages] = useState([]);           // Current session messages
  const [inputValue, setInputValue] = useState("");       // User input text
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);     // List of all sessions
  const [currentSessionId, setCurrentSessionId] = useState(null); // Active session UUID
  const [isLoading, setIsLoading] = useState(false);      // AI response loading
  const [isLoadingHistory, setIsLoadingHistory] = useState(false); // History loading
  const [historyPage, setHistoryPage] = useState(1);      // Pagination current page
  const [hasMoreHistory, setHasMoreHistory] = useState(true); // Pagination flag
  const [userProfile, setUserProfile] = useState({
    name: "User",
    profilePicture: "/placeholder.jpeg"
  });

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    // Fetch user profile for avatar display
    fetch(AUTH_ENDPOINTS.PROFILE, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        const userData = data.user || data;
        setUserProfile({
          name: userData.name || "User",
          profilePicture: userData.profile_photo || userData.profilePicture || "/placeholder.jpeg"
        });
      })
      .catch(err => console.error('Error fetching user profile:', err));

    // Load first page of chat history
    loadChatHistory(1);
  }, []);

 
  const loadChatHistory = async (page = 1, append = false) => {
    try {
      setIsLoadingHistory(true);
      const token = sessionStorage.getItem('token');
      
      // Call paginated history endpoint
      const response = await fetch(`${CHATBOT_ENDPOINTS.GET_HISTORY}?page=${page}&limit=10`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load history: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform backend format to frontend format
      const transformedChats = data.chats.map(chat => ({
        id: chat.session_id,
        title: chat.title,
        lastMessage: chat.last_message,        // Already truncated by backend
        timestamp: new Date(chat.updated_at),
        messageCount: chat.message_count       // Add count for UI display
      }));

      // Append or replace history based on load more vs initial load
      if (append) {
        setChatHistory(prev => [...prev, ...transformedChats]);
      } else {
        setChatHistory(transformedChats);
      }

      // Update pagination state
      setHistoryPage(page);
      setHasMoreHistory(data.pagination?.has_next || false);

    } catch (error) {
      console.error('Error loading chat history:', error);
      // Show empty state on error
      if (!append) {
        setChatHistory([]);
      }
    } finally {
      setIsLoadingHistory(false);
    }
  };


  const loadMoreHistory = () => {
    if (!isLoadingHistory && hasMoreHistory) {
      loadChatHistory(historyPage + 1, true);
    }
  };

  
  const generateSessionId = () => {
    return `session-${Date.now()}`;
  };

  
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const token = sessionStorage.getItem('token');
    if (!token) {
      console.error('No auth token found');
      return;
    }

    // Generate session ID if this is a new conversation
    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = generateSessionId();
      setCurrentSessionId(sessionId);
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    const userQuestion = inputValue; // Save before clearing
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
        // Build conversation history from current messages (max 6 = 3 turns)
        // Format: [{role:'user', content:'...'}, {role:'assistant', content:'...'}, ...]
        const history = messages
          .filter(m => !m.isError)
          .slice(-6)
          .map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text,
          }));

        // Call AI backend endpoint
        const response = await fetch(CHATBOT_ENDPOINTS.SEND_MESSAGE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            message: userQuestion,
            session_id: sessionId,
            history,
          })
        });

      if (!response.ok) {
        throw new Error(`AI request failed: ${response.status}`);
      }

      const data = await response.json();

      // Add AI response to UI
      const botMessage = {
        id: `bot-${Date.now()}`,
        text: data.response,
        sender: "bot",
        timestamp: new Date(data.timestamp),
        contextUsed: data.context_logs_count,
        sources: data.sources, // Store the actual log details
        processingTime: data.processing_time
      };

      setMessages(prev => [...prev, botMessage]);

      // Reload history sidebar to show updated "last message" preview
      // Only reload page 1 to see the updated session at top
      loadChatHistory(1, false);

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Show error message in chat
      const errorMessage = {
        id: `error-${Date.now()}`,
        text: "Sorry, I couldn't process your message. Please try again.",
        sender: "bot",
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  
  const handleSelectChat = async (sessionId) => {
    try {
      setIsLoading(true);
      const token = sessionStorage.getItem('token');
      
      const response = await fetch(CHATBOT_ENDPOINTS.GET_MESSAGES(sessionId), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load session: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform backend format (1 doc = 1 exchange) to frontend format (2 messages)
      const transformedMessages = [];
      
      if (data.messages && Array.isArray(data.messages)) {
        data.messages.forEach((exchange, index) => {
          // User message
          transformedMessages.push({
            id: `user-${exchange._id}`,
            text: exchange.message,
            sender: "user",
            timestamp: new Date(exchange.createdAt)
          });
          
          // Bot response
          transformedMessages.push({
            id: `bot-${exchange._id}`,
            text: exchange.response,
            sender: "bot",
            timestamp: new Date(exchange.createdAt),
            contextUsed: exchange.context_used,
            sources: exchange.sources // Retrieve stored sources from DB
          });
        });
      }

      setMessages(transformedMessages);
      setCurrentSessionId(sessionId);

    } catch (error) {
      console.error('Error loading chat session:', error);
      alert('Failed to load chat session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  const handleDeleteChat = async (sessionId) => {
    // Confirm deletion
    const confirmed = window.confirm(
      'Are you sure you want to delete this chat? This action cannot be undone.'
    );
    
    if (!confirmed) return;

    try {
      const token = sessionStorage.getItem('token');
      
      const response = await fetch(CHATBOT_ENDPOINTS.DELETE_SESSION(sessionId), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }

      const data = await response.json();

      // Remove from history sidebar (optimistic update)
      setChatHistory(prev => prev.filter(chat => chat.id !== sessionId));

      // Clear chat area if viewing deleted session
      if (currentSessionId === sessionId) {
        setMessages([]);
        setCurrentSessionId(null);
      }

      // Reload history to get accurate pagination
      loadChatHistory(1, false);

    } catch (error) {
      console.error('Error deleting chat:', error);
      alert('Failed to delete chat. Please try again.');
    }
  };

  const handleNewChat = () => {
    // Clear current session
    setCurrentSessionId(null);
    setMessages([]);
    setInputValue("");
    
    // Session ID will be generated when user sends first message
  };

  return (
    <div className="chatbot-container">
      <Menubar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main className="chatbot-main">
        <Navbar />

        <div className="chatbot-content">
          <ChatArea
            messages={messages}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSendMessage={handleSendMessage}
            onKeyPress={handleKeyPress}
            userProfile={userProfile}
            isLoading={isLoading}  // Pass loading state for AI response
          />

          <div className="chatbot-sidebar">
            <ChatHistory
              history={chatHistory}
              onSelectChat={handleSelectChat}
              onDeleteChat={handleDeleteChat}
              onNewChat={handleNewChat}
              isLoading={isLoadingHistory}     // Pass loading state
              hasMore={hasMoreHistory}          // Pagination flag
              onLoadMore={loadMoreHistory}      // Load more callback
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChatBot;
