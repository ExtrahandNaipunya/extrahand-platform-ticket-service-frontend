'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, Loader2, AlertCircle, Phone } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  sources?: string[];
  action?: string;
}

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string;
  initialMessage?: string;
}

export default function Chatbot({ isOpen, onClose, sessionId = 'default', initialMessage }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hi! I\'m your ExtraHand support assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasProcessedInitialMessage = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle initial message from search bar
  useEffect(() => {
    if (isOpen && initialMessage && !hasProcessedInitialMessage.current) {
      hasProcessedInitialMessage.current = true;
      setInputMessage(initialMessage);
      // Auto-send the initial message
      setTimeout(() => {
        sendMessageInternal(initialMessage);
      }, 500);
    }
  }, [isOpen, initialMessage]);

  const sendMessageInternal = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;
    const trimmedMessage = messageText.trim();

    const userMessage: Message = {
      id: Date.now().toString(),
      text: trimmedMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmedMessage,
          sessionId,
        }),
        signal: abortController.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: 'bot',
        timestamp: new Date(),
        sources: data.sources,
        action: data.action,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setError('Response stopped.');
        return;
      }
      console.error('Chat error:', err);
      setError(err.message || 'Failed to send message. Please try again.');
      
      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please make sure the chatbot service is running or try again later.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const stopResponse = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  };

  const handleClose = () => {
    stopResponse();
    onClose();
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessageInternal(inputMessage);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900 p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-white rounded-full p-2">
            <Bot className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold">ExtraHand Assistant</h3>
            <p className="text-xs opacity-90">Always here to help</p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="hover:bg-white/20 rounded-full p-1 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-2 max-w-[80%]`}>
              {message.sender === 'bot' && (
                <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full p-2 flex-shrink-0">
                  <Bot className="h-4 w-4 text-gray-900" />
                </div>
              )}
              
              <div>
                <div
                  className={`rounded-2xl px-4 py-2 ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                </div>
                
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-1 text-xs text-gray-500">
                    <span className="font-semibold">Sources:</span>{' '}
                    {message.sources.join(', ')}
                  </div>
                )}

                {message.action === 'call_support' && (
                  <button
                    onClick={() => window.location.href = 'tel:+18005550123'}
                    className="mt-3 w-full bg-green-500 hover:bg-green-600 text-white rounded-xl px-4 py-2 flex items-center justify-center space-x-2 transition-colors shadow-sm"
                  >
                    <Phone className="h-4 w-4" />
                    <span>Call Customer Support</span>
                  </button>
                )}
                
                <div className="text-xs text-gray-400 mt-1">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              {message.sender === 'user' && (
                <div className="bg-gray-200 rounded-full p-2 flex-shrink-0">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full p-2">
                <Bot className="h-4 w-4 text-gray-900" />
              </div>
              <div className="bg-gray-100 rounded-2xl px-4 py-2">
                <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center space-x-2 text-red-600 bg-red-50 rounded-lg p-3">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900 rounded-full p-2 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
          {isLoading && (
            <button
              type="button"
              onClick={stopResponse}
              className="text-xs px-3 py-2 rounded-full border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
            >
              Stop
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
