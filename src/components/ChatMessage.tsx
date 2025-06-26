import React from 'react';
import { User, Bot, Copy, Check, Image, FileText } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../types';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isStreaming = false }) => {
  const [copied, setCopied] = React.useState(false);
  const isUser = message.role === 'user';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      
      <div className={`max-w-[80%] ${isUser ? 'ml-12' : 'mr-12'}`}>
        <div
          className={`p-4 rounded-2xl shadow-sm ${
            isUser
              ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white ml-auto'
              : 'bg-white/90 backdrop-blur-sm text-gray-800 border border-gray-100'
          } ${isStreaming ? 'animate-pulse' : ''}`}
        >
          {/* Images */}
          {message.images && message.images.length > 0 && (
            <div className="mb-3 grid grid-cols-2 gap-2">
              {message.images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image}
                    alt={`Uploaded image ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1">
                    <Image className="w-3 h-3 text-white" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Files */}
          {message.files && message.files.length > 0 && (
            <div className="mb-3 space-y-2">
              {message.files.map((file, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700 truncate">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Message content */}
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {message.content}
            </pre>
          </div>

          {/* Message footer */}
          <div className={`flex items-center justify-between mt-3 pt-2 border-t ${
            isUser ? 'border-blue-500/30' : 'border-gray-200'
          }`}>
            <div className="flex items-center gap-2 text-xs opacity-70">
              <span>{formatTime(message.timestamp)}</span>
              {message.model && !isUser && (
                <>
                  <span>•</span>
                  <span className="font-medium">{message.model.split('/').pop()?.split(':')[0]}</span>
                </>
              )}
            </div>
            
            <button
              onClick={copyToClipboard}
              className={`p-1 rounded hover:bg-black/10 transition-colors ${
                isUser ? 'text-blue-100' : 'text-gray-500'
              }`}
              title="Copy message"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;