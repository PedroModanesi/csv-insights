import { useState, useRef, useEffect } from 'react';
import { useAIStore } from '../../store/aiStore';
import { useCSVStore } from '../../store/csvStore';
import { useAiAnalysis } from '../../hooks/useAiAnalysis';

export function AiChat() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    chatHistory, isLoadingChat, chatError, clearChat, streamingChatContent,
  } = useAIStore();
  const { rawData } = useCSVStore();
  const { sendChatMessage } = useAiAnalysis();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoadingChat, streamingChatContent]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoadingChat) return;
    setInput('');
    await sendChatMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (rawData.length === 0) return null;

  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    return (
      <div className="text-sm text-amber-600 dark:text-amber-400 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-700">
        Configure <code>VITE_GEMINI_API_KEY</code> para usar o chat.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col" style={{ height: '480px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-2">
          <span>💬</span> Chat com os Dados
          {isLoadingChat && (
            <span className="text-xs font-normal text-blue-500 dark:text-blue-400">● transmitindo...</span>
          )}
        </h2>
        {chatHistory.length > 0 && (
          <button
            onClick={clearChat}
            className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatHistory.length === 0 && !streamingChatContent && (
          <div className="text-center text-sm text-gray-400 dark:text-gray-500 mt-8">
            <div className="text-2xl mb-2">🤖</div>
            <p>Faça perguntas sobre seus dados em linguagem natural.</p>
            <p className="mt-1">Ex: "Qual é a média da coluna X?" ou "Quais são os valores mais comuns?"</p>
          </div>
        )}

        {chatHistory.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md xl:max-w-lg rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Streaming bubble: shows in real-time while response is arriving */}
        {streamingChatContent && (
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md xl:max-w-lg bg-gray-100 dark:bg-gray-700 rounded-xl px-3 py-2 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {streamingChatContent}
              <span className="inline-block w-0.5 h-3.5 bg-gray-500 dark:bg-gray-300 animate-pulse ml-0.5 align-middle" />
            </div>
          </div>
        )}

        {/* Typing indicator when loading but no content yet */}
        {isLoadingChat && !streamingChatContent && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-2 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {chatError && (
          <div className="text-xs text-red-500 dark:text-red-400 px-2">{chatError}</div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pergunte algo sobre os dados... (Enter para enviar)"
          rows={1}
          disabled={isLoadingChat}
          className="flex-1 resize-none border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoadingChat}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg transition-colors text-sm"
          aria-label="Enviar mensagem"
        >
          ↑
        </button>
      </div>
    </div>
  );
}
