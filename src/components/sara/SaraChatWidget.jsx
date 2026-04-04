import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';
import './SaraChatWidget.css';

const INITIAL_MESSAGE = {
  role: 'assistant',
  content:
    "Hi! I'm Sara, your ISO certification advisor. I can help you understand quality standards, guide you through the certification process, and answer any questions about your journey. How can I help you today?",
};

export default function SaraChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      // Send only the conversation (skip the initial greeting for cleaner context)
      const conversationForAPI = updatedMessages
        .slice(1) // skip initial Sara greeting
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationForAPI,
          userId: user?.id || null,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to get response');
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply },
      ]);
    } catch (err) {
      console.error('Sara chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            "I'm having trouble connecting right now. Please try again in a moment, or reach out to our support team for immediate help.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    'What is ISO 9001?',
    'How long does certification take?',
    'What are the pricing plans?',
    'How do I get started?',
  ];

  const handleQuickQuestion = (q) => {
    setInput(q);
    // Trigger send on next tick so input state is updated
    setTimeout(() => {
      const userMessage = { role: 'user', content: q };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput('');
      setLoading(true);

      const conversationForAPI = updatedMessages
        .slice(1)
        .map((m) => ({ role: m.role, content: m.content }));

      fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationForAPI,
          userId: user?.id || null,
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error('Failed');
          return res.json();
        })
        .then((data) => {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: data.reply },
          ]);
        })
        .catch(() => {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content:
                "I'm having trouble connecting right now. Please try again in a moment.",
            },
          ]);
        })
        .finally(() => setLoading(false));
    }, 0);
  };

  // Format message text — handle markdown-like bold and line breaks
  const formatMessage = (text) => {
    return text.split('\n').map((line, i) => {
      // Handle bold **text**
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      const formatted = parts.map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      return (
        <span key={i}>
          {formatted}
          {i < text.split('\n').length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        className={`sara-fab ${isOpen ? 'sara-fab--hidden' : ''}`}
        onClick={() => setIsOpen(true)}
        aria-label="Chat with Sara"
      >
        <div className="sara-fab__icon">
          <Sparkles size={24} />
        </div>
        <span className="sara-fab__label">Ask Sara</span>
        <div className="sara-fab__pulse" />
      </button>

      {/* Chat Window */}
      <div className={`sara-chat ${isOpen ? 'sara-chat--open' : ''}`}>
        {/* Header */}
        <div className="sara-chat__header">
          <div className="sara-chat__header-info">
            <div className="sara-chat__avatar">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="sara-chat__name">Sara</h3>
              <span className="sara-chat__status">
                <span className="sara-chat__status-dot" />
                ISO Certification Advisor
              </span>
            </div>
          </div>
          <button
            className="sara-chat__close"
            onClick={() => setIsOpen(false)}
            aria-label="Close chat"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="sara-chat__messages">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`sara-chat__message sara-chat__message--${msg.role}`}
            >
              <div className="sara-chat__message-icon">
                {msg.role === 'assistant' ? (
                  <Bot size={16} />
                ) : (
                  <User size={16} />
                )}
              </div>
              <div className="sara-chat__message-bubble">
                {formatMessage(msg.content)}
              </div>
            </div>
          ))}

          {loading && (
            <div className="sara-chat__message sara-chat__message--assistant">
              <div className="sara-chat__message-icon">
                <Bot size={16} />
              </div>
              <div className="sara-chat__message-bubble sara-chat__typing">
                <span className="sara-chat__typing-dot" />
                <span className="sara-chat__typing-dot" />
                <span className="sara-chat__typing-dot" />
              </div>
            </div>
          )}

          {/* Quick Questions (only show if just the initial message) */}
          {messages.length === 1 && !loading && (
            <div className="sara-chat__quick-questions">
              <p className="sara-chat__quick-label">Quick questions:</p>
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  className="sara-chat__quick-btn"
                  onClick={() => handleQuickQuestion(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="sara-chat__input-area">
          <textarea
            ref={inputRef}
            className="sara-chat__input"
            placeholder="Ask Sara anything about ISO certification..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading}
          />
          <button
            className="sara-chat__send"
            onClick={handleSend}
            disabled={!input.trim() || loading}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </>
  );
}
