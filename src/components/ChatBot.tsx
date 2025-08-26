
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  MessageCircle, 
  X, 
  Send,
  Bot,
  User
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import ReactMarkdown from 'react-markdown';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      content: "Hi! I'm your civic assistant powered by AI. I can help you with information about civic issues, events, and community engagement. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [user, setUser] = useState(null);
  const [chatWidth, setChatWidth] = useState(450); // px, initial width (increased from 320)
  const [chatHeight, setChatHeight] = useState(550); // px, initial height (increased from 384)
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [resizeDirection, setResizeDirection] = useState(null);

  // Get current user on component mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const startResize = (e, direction) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: chatWidth,
      height: chatHeight,
    });
  };

  useEffect(() => {
    if (!isResizing || !resizeDirection) return;
    const handleMouseMove = (e) => {
      let newWidth = chatWidth;
      let newHeight = chatHeight;
      if (resizeDirection.includes('right')) {
        newWidth = Math.max(350, resizeStart.width + (e.clientX - resizeStart.x));
      }
      if (resizeDirection.includes('left')) {
        newWidth = Math.max(350, resizeStart.width - (e.clientX - resizeStart.x));
      }
      if (resizeDirection.includes('bottom')) {
        newHeight = Math.max(400, resizeStart.height + (e.clientY - resizeStart.y));
      }
      if (resizeDirection.includes('top')) {
        newHeight = Math.max(400, resizeStart.height - (e.clientY - resizeStart.y));
      }
      setChatWidth(newWidth);
      setChatHeight(newHeight);
    };
    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeDirection, resizeStart, chatWidth, chatHeight]);

  const predefinedSuggestions = [
    "What are today's active events?",
    "Show me issues in Kochi North.",
    "Where can I redeem points?",
    "How do I report a pothole?",
    "What are the most severe issues in my area?",
    "Tell me about recent civic reports"
  ];

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: "user",
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      // Call backend API with Gemini AI
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/chatbot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          userId: user?.id || null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      const botResponse = {
        id: messages.length + 2,
        type: "bot",
        content: data.response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Error calling chatbot API:', error);
      
      // Use fallback response when backend is not available
      const fallbackResponse = {
        id: messages.length + 2,
        type: "bot",
        content: getFallbackResponse(inputValue),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  // Fallback response function (kept for reference)
  const getFallbackResponse = (userInput: string) => {
    const input = userInput.toLowerCase();
    
    if (input.includes("event") || input.includes("activity")) {
      return "Today you have 2 volunteer events: Beach Cleanup at Marina Beach (9 AM) and Tree Planting at Central Park (2 PM). Would you like to register for any of these?";
    } else if (input.includes("kochi") || input.includes("location")) {
      return "In Kochi North, there are currently 12 active issues: 5 potholes, 3 streetlight problems, 2 garbage collection issues, and 2 water supply concerns. Would you like to see the map view?";
    } else if (input.includes("points") || input.includes("redeem")) {
      return "You have 1,247 CIVI points! You can redeem them for metro cards (200 points), restaurant vouchers (400 points), or utility bill discounts (250 points). Check the Redeem Points page for more options.";
    } else if (input.includes("pothole") || input.includes("report")) {
      return "To report a pothole: 1) Take a photo, 2) Click 'Report Issue' on the home page, 3) Our AI will automatically detect the category and severity. You'll earn 25 CIVI points for each verified report!";
    } else if (input.includes("hello") || input.includes("hi")) {
      return "Hello! I'm here to help you navigate Civixity. You can ask me about reporting issues, finding events, redeeming points, or anything else related to civic engagement.";
    } else {
      return "I understand you're asking about civic matters. I can help you with reporting issues, finding volunteer events, redeeming CIVI points, or checking the status of reports in your area. What specific information do you need?";
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 z-50"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card
          className="fixed bottom-6 right-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xl z-50 flex flex-col animate-in slide-in-from-bottom-4 duration-300"
          style={{ width: chatWidth, height: chatHeight, minWidth: 350, minHeight: 400 }}
        >
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-t-lg">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <div className="font-medium">Civic Assistant</div>
                <div className="text-xs opacity-90">Online</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-lg px-3 py-2 ${
                  message.type === 'user'
                    ? 'bg-teal-500 dark:bg-cyan-500 text-white'
                    : 'bg-yellow-100 dark:bg-yellow-900/50 text-slate-900 dark:text-slate-100 border border-yellow-200 dark:border-yellow-800'
                }`}>
                  <div className="flex items-start space-x-2">
                    {message.type === 'bot' && (
                      <Bot className="h-4 w-4 mt-0.5 text-slate-600 dark:text-slate-400" />
                    )}
                    <div className="flex-1">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                      <div className={`text-xs mt-1 ${
                        message.type === 'user' 
                          ? 'text-teal-100' 
                          : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-yellow-100 dark:bg-yellow-900/50 text-slate-900 dark:text-slate-100 border border-yellow-200 dark:border-yellow-800 rounded-lg px-3 py-2">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          

          {/* Chat Input */}
          <div className="border-t border-slate-200 dark:border-slate-700 p-4">
            <div className="flex space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything about your city..."
                className="flex-1 bg-white dark:bg-slate-700 text-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {/* Resize handles for all edges and corners */}
          {/* Corners */}
          <div onMouseDown={e => startResize(e, 'top-left')} style={{position:'absolute',top:0,left:0,width:16,height:16,cursor:'nwse-resize',zIndex:10}} />
          <div onMouseDown={e => startResize(e, 'top-right')} style={{position:'absolute',top:0,right:0,width:16,height:16,cursor:'nesw-resize',zIndex:10}} />
          <div onMouseDown={e => startResize(e, 'bottom-left')} style={{position:'absolute',bottom:0,left:0,width:16,height:16,cursor:'nesw-resize',zIndex:10}} />
          <div onMouseDown={e => startResize(e, 'bottom-right')} style={{position:'absolute',bottom:0,right:0,width:16,height:16,cursor:'nwse-resize',zIndex:10}} />
          {/* Edges */}
          <div onMouseDown={e => startResize(e, 'top')} style={{position:'absolute',top:0,left:16,right:16,height:8,cursor:'ns-resize',zIndex:10}} />
          <div onMouseDown={e => startResize(e, 'bottom')} style={{position:'absolute',bottom:0,left:16,right:16,height:8,cursor:'ns-resize',zIndex:10}} />
          <div onMouseDown={e => startResize(e, 'left')} style={{position:'absolute',top:16,bottom:16,left:0,width:8,cursor:'ew-resize',zIndex:10}} />
          <div onMouseDown={e => startResize(e, 'right')} style={{position:'absolute',top:16,bottom:16,right:0,width:8,cursor:'ew-resize',zIndex:10}} />
        </Card>
      )}
    </>
  );
};

export default ChatBot;
