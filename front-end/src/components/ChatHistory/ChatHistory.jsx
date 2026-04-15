import { MessageSquare, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import "./ChatHistory.css";


const ChatHistory = ({ 
  history, 
  onSelectChat, 
  onDeleteChat, 
  onNewChat,
  isLoading = false,      // Loading state for history
  hasMore = false,        // Are there more pages?
  onLoadMore = () => {}   // Load more callback
}) => {
  const formatTime = (date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <aside className="chat-history">
      <div className="chat-history-header">
        <h2 className="chat-history-title">Chat History</h2>
        <Button 
          size="sm" 
          className="chat-history-new-button"
          onClick={onNewChat}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>
      <ScrollArea className="chat-history-scroll">
        <div className="chat-history-list">
          {/* Empty State */}
          {history.length === 0 && !isLoading ? (
            <div className="chat-history-empty">
              <p className="chat-history-empty-text">No chat history yet</p>
              <p className="text-xs text-gray-500 mt-2">
                Start a new conversation to see it here
              </p>
            </div>
          ) : (
            <>
              {/* Chat List */}
              {history.map((chat) => (
                <div
                  key={chat.id}
                  className="chat-history-item"
                  onClick={() => onSelectChat(chat.id)}
                >
                  <div className="chat-history-item-content">
                    <div className="chat-history-item-header">
                      <h3 className="chat-history-item-title">{truncateText(chat.title, 25)}</h3>
                      <div className="flex items-center gap-1">
                        <span className="chat-history-item-time">
                          {formatTime(chat.timestamp)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="chat-history-delete-button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDeleteChat(chat.id);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <p className="chat-history-item-preview">{truncateText(chat.lastMessage, 50)}</p>
                    {chat.messageCount && (
                      <p className="text-xs text-gray-500 mt-1">
                        {chat.messageCount} messages
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* Load More Button */}
              {hasMore && (
                <div className="p-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={(e) => {
                      e.preventDefault();
                      onLoadMore();
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}

              {/* Loading Indicator (first load) */}
              {isLoading && history.length === 0 && (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">Loading history...</span>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
};

export default ChatHistory;
