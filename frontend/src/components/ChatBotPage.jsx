import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Sparkles } from 'lucide-react';
import { chatWithAI } from '../services/api';

const ChatBotPage = ({ jobId, darkMode }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const suggestedQuestions = [
    'Show next 6-month forecast',
    'Which product declining fastest?',
    'Explain seasonal trend',
    'Generate insights for top region'
  ];

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatWithAI(jobId, text, messages);
      const aiMessage = { role: 'assistant', content: response.response };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-[calc(100vh-8rem)] rounded-2xl border shadow-sm overflow-hidden animate-in fade-in duration-500 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      {/* Header */}
      <div className={`p-6 border-b ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} flex items-center justify-between shrink-0`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Sparkles size={24} />
          </div>
          <div>
            <h2 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>AI Assistant</h2>
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mt-1">Chat with your data</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className={`flex-1 overflow-y-auto p-6 space-y-6 ${darkMode ? 'bg-slate-900/50' : 'bg-slate-50/50'}`}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center space-y-8">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
              <MessageCircle size={40} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>How can I help you analyze your data?</h3>
              <p className="text-slate-500">Ask me anything about your sales forecast, historical trends, or potential anomalies.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-8">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className={`p-4 rounded-xl text-left border transition-all hover:scale-[1.02] active:scale-95 ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 hover:border-blue-500 text-slate-300'
                      : 'bg-white border-slate-200 hover:border-blue-500 text-slate-700 shadow-sm'
                  }`}
                >
                  <p className="font-medium">{q}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : darkMode
                      ? 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700'
                      : 'bg-white text-slate-800 rounded-tl-sm border border-slate-200 shadow-sm'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className={`max-w-[80%] p-4 rounded-2xl rounded-tl-sm ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200 shadow-sm'}`}>
                  <div className="flex gap-1.5 items-center h-5">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className={`p-6 border-t shrink-0 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className="max-w-4xl mx-auto relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(input)}
            placeholder={jobId ? "Ask about your forecast..." : "Please run a forecast first to chat with your data..."}
            disabled={!jobId || loading}
            className={`w-full pl-6 pr-16 py-4 rounded-full border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              darkMode
                ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 disabled:bg-slate-900 disabled:text-slate-600'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 disabled:bg-slate-100 disabled:text-slate-400'
            }`}
          />
          <button
            onClick={() => handleSendMessage(input)}
            disabled={!input.trim() || loading || !jobId}
            className={`absolute right-2 p-2.5 rounded-full transition-all ${
              input.trim() && !loading && jobId
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:scale-105 active:scale-95'
                : 'bg-transparent text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBotPage;
