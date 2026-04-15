import { Send, Plus, History, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import SimpleMarkdown from "../SimpleMarkdown/SimpleMarkdown";
import { Link } from "react-router-dom";
import "./ChatArea.css";


const ChatArea = ({ 
  messages, 
  inputValue, 
  onInputChange, 
  onSendMessage, 
  onKeyPress, 
  userProfile,
  isLoading = false  
}) => {
  return (
    <div className="chat-area">
      <ScrollArea className="chat-area-scroll">
        {messages.length === 0 ? (
          <div className="chat-area-empty">
            <div className="chat-area-empty-content">
              <h2 className="chat-area-empty-title">
                Where should we begin?
              </h2>
            </div>
          </div>
        ) : (
          <div className="chat-area-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "chat-message",
                  message.sender === "user" ? "chat-message-user" : "chat-message-bot",
                  message.isError && "chat-message-error"
                )}
              >
                {message.sender === "bot" && (
                  <Avatar className="chat-message-avatar">
                    <AvatarFallback className="chat-message-avatar-bot">AI</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "chat-message-bubble",
                    message.sender === "user"
                      ? "chat-message-bubble-user"
                      : "chat-message-bubble-bot",
                    message.isError && "bg-red-100 border-red-300"
                  )}
                >
                  <div className="chat-message-text prose prose-sm dark:prose-invert">
                    {message.sender === "bot" ? (
                      <SimpleMarkdown>{message.text}</SimpleMarkdown>
                    ) : (
                      <p>{message.text}</p>
                    )}
                  </div>
                  
                  {/* Show metadata for bot responses */}
                  {message.sender === "bot" && !message.isError && (
                    <div className="mt-3 space-y-2 border-t pt-2 border-gray-100 dark:border-gray-800">
                      {message.contextUsed > 0 && (
                        <div className="flex flex-col gap-1">
                          <div className="text-xs text-gray-500 flex items-center gap-1.5 font-medium">
                            <BookOpen className="w-3 h-3" />
                            <span>{message.contextUsed} worklogs referenced:</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 pl-1">
                            {message.sources?.map((source, idx) => (
                              <Link
                                key={`${source.id}-${idx}`}
                                to={`/worklogs/${source.id}/versions`}
                                className="text-[10px] px-2 py-0.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-md transition-colors border border-gray-200 dark:border-gray-700 max-w-[150px] truncate"
                                title={source.title}
                              >
                                {source.title}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {message.processingTime && (
                        <div className="text-[10px] text-gray-400 italic">
                          Generated in {message.processingTime}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {message.sender === "user" && (
                  <Avatar className="chat-message-avatar">
                    <AvatarImage src={userProfile?.profilePicture || "/placeholder.jpeg"} />
                    <AvatarFallback>{userProfile?.name?.substring(0, 2).toUpperCase() || "GA"}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
            {/* Loading Indicator - AI is thinking */}
            {isLoading && (
              <div className="chat-message chat-message-bot">
                <Avatar className="chat-message-avatar">
                  <AvatarFallback className="chat-message-avatar-bot">AI</AvatarFallback>
                </Avatar>
                <div className="chat-message-bubble chat-message-bubble-bot">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing worklogs and generating response...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <div className="chat-area-input-wrapper">
        <div className="chat-area-input-container">
          <div className="chat-area-input">
            
            <Input
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyPress={onKeyPress}
              placeholder="Ask Anything"
              className="chat-area-input-field"
            />
            <Button
              size="icon"
              className="chat-area-send-button"
              onClick={onSendMessage}
              disabled={!inputValue.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="chat-area-send-icon" />
              )}
            </Button>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;

