'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, X, User, Headphones } from 'lucide-react';
import { getBackendApiUrl, getBackendWsUrl } from '@/lib/apiConfig';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent' | 'system';
  timestamp: Date;
}

interface LiveChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LiveChat({ isOpen, onClose }: LiveChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [customerName] = useState('Guest User');
  const [customerEmail] = useState('guest@example.com');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !socket && !sessionId) {
      // First create a session
      fetch(`${getBackendApiUrl()}/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_name: customerName,
          customer_email: customerEmail
        })
      })
        .then(res => res.json())
        .then(data => {
          const newSessionId = data.session_id;
          setSessionId(newSessionId);
          
          // Connect to WebSocket with session ID
          const ws = new WebSocket(`${getBackendWsUrl()}/ws/customer/${newSessionId}`);

          ws.onopen = () => {
            console.log('Connected to Live Chat');
            setIsConnected(true);
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              text: 'Connected to support. Waiting for an agent to join...',
              sender: 'system',
              timestamp: new Date()
            }]);
          };

          ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Received message:', data);
            
            if (data.type === 'message') {
              if (data.sender === 'agent') {
                setMessages(prev => [...prev, {
                  id: Date.now().toString(),
                  text: data.content,
                  sender: 'agent',
                  timestamp: new Date()
                }]);
              } else if (data.sender === 'customer') {
                // Echo back customer message (already added locally)
              }
            } else if (data.type === 'agent_joined') {
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                text: data.message || 'An agent has joined the chat',
                sender: 'system',
                timestamp: new Date()
              }]);
            } else if (data.type === 'history') {
              // Load chat history
              if (data.messages && data.messages.length > 0) {
                const historyMessages = data.messages.map((msg: any) => ({
                  id: Date.now().toString() + Math.random(),
                  text: msg.content,
                  sender: msg.sender,
                  timestamp: new Date(msg.timestamp)
                }));
                setMessages(historyMessages);
              }
            } else if (data.type === 'session_closed') {
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                text: data.message || 'This chat session has been closed.',
                sender: 'system',
                timestamp: new Date()
              }]);
              setIsConnected(false);
              setTimeout(() => {
                ws.close();
              }, 2000);
            }
          };

          ws.onclose = () => {
            console.log('Disconnected from Live Chat');
            setIsConnected(false);
            setSocket(null);
          };

          ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              text: 'Connection error. Please try again.',
              sender: 'system',
              timestamp: new Date()
            }]);
          };

          setSocket(ws);
        })
        .catch(err => {
          console.error('Failed to create session:', err);
          setMessages([{
            id: Date.now().toString(),
            text: 'Failed to connect to support. Please try again later.',
            sender: 'system',
            timestamp: new Date()
          }]);
        });
    }

    return () => {
      if (!isOpen && socket) {
        socket.close();
        setSocket(null);
      }
    };
  }, [isOpen, sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket) return;

    const messageText = inputMessage.trim();
    
    // Send to WebSocket with correct action format
    socket.send(JSON.stringify({
      action: 'send_message',
      content: messageText
    }));

    // Add to local state
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    }]);

    setInputMessage('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 rounded-full p-2">
            <Headphones className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold">Live Support</h3>
            <p className="text-xs opacity-90">
              {isConnected ? 'Connected' : 'Connecting...'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="hover:bg-white/20 rounded-full p-1 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === 'user' ? 'justify-end' : 
              message.sender === 'system' ? 'justify-center' : 'justify-start'
            }`}
          >
            {message.sender === 'system' ? (
              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                {message.text}
              </span>
            ) : (
              <div className={`flex items-start space-x-2 max-w-[80%]`}>
                {message.sender === 'agent' && (
                  <div className="bg-purple-100 rounded-full p-2 flex-shrink-0">
                    <Headphones className="h-4 w-4 text-purple-600" />
                  </div>
                )}
                
                <div>
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      message.sender === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-900 border border-gray-200 shadow-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  </div>
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
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={!isConnected}
          />
          <button
            type="submit"
            disabled={!isConnected || !inputMessage.trim()}
            className="bg-purple-600 text-white rounded-full p-2 hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
