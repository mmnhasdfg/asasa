import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Key, Copy } from 'lucide-react';
import { ChatMessage } from './types';
import { AI_MODELS } from './config/models';
import { OpenRouterService } from './services/openrouter';
import { getApiKeyForModel } from './utils/apiKeys';
import { ASTRO_PROMPT } from './components/ModelSelector';


const App: React.FC = () => {
  // Add messages state and its updater
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // Add message input state and its updater
  const [message, setMessage] = useState<string>('');

  // Helper to create a new conversation
  // (Removed unused createNewConversation function)

  // (Removed unused currentConversation state)

  // API key state and its updater
  const [apiKey, setApiKey] = useState<string>('');

  // Sidebar open state (removed unused isSidebarOpen)

  // State for showing/hiding the API key input
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  // State for selected AI model
  const [selectedModel, setSelectedModel] = useState<string>(AI_MODELS[0]?.id || '');

  // Loading state for async actions (e.g., sending messages)
  const [isLoading, setIsLoading] = useState(false);

  // Select conversation handler
  // (Removed unused selectConversation function)

  // Delete conversation handler
  // (Removed unused deleteConversation function)
  const fileInputRef = useRef<HTMLInputElement>(null);

  // خصوصية عالية: لا حفظ للمحادثات في localStorage
  // حذف الدردشة بعد الانتهاء مباشرة
  // حذف كل الرسائل (محو الشات)
  const clearChat = () => {
    setMessages([]);
    setMessage('');
  };

  // نسخ رد الذكاء الصناعي
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // تعديل رسالة المستخدم
  const editUserMessage = (msgId: string) => {
    const msg = messages.find(m => m.id === msgId && m.role === 'user');
    if (msg) setMessage(msg.content);
    setMessages(prev => prev.filter(m => m.id !== msgId));
  };

  // لا تحفظ أي محادثة في localStorage
  useEffect(() => {
    // لا شيء
  }, [messages]);

  // عند انتهاء الشات (مثلاً عند محو الشات أو إغلاق الصفحة) احذف الرسائل
  useEffect(() => {
    const handleBeforeUnload = () => {
      setMessages([]);
      setMessage('');
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // دعم لصق الصور أو الملفات مباشرة في مربع الإدخال
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item && item.kind === 'file') {
        const file = item.getAsFile();
        if (file && file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const imageUrl = event.target?.result as string;
            // لا ترسل الصورة إلا مع نص
            if (message.trim()) {
              const imageMessage: ChatMessage = {
                id: Date.now().toString(),
                role: 'user',
                content: message,
                images: [imageUrl],
                timestamp: new Date(),
              };
              setMessages((prev) => [...prev, imageMessage]);
              setMessage('');
            }
          };
          reader.readAsDataURL(file);
        }
        e.preventDefault();
        break;
      }
    }
  };

  // عند رفع صورة: إذا لم يوجد نص، احفظ الصورة مؤقتاً حتى يكتب المستخدم نصاً
  const [pendingImage, setPendingImage] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        if (message.trim()) {
          const imageMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: message,
            images: [imageUrl],
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, imageMessage]);
          setMessage('');
        } else {
          setPendingImage(imageUrl);
        }
      };
      reader.onerror = () => { console.error('Error reading file'); };
      reader.readAsDataURL(file);
    }
  };

  // عند إرسال رسالة، إذا هناك صورة معلقة أرسلها مع النص
  const handleSendMessage = async () => {
    if ((!message.trim() && !pendingImage) || isLoading || !apiKey) return;

    setIsLoading(true);

    // أضف البرومبت دائماً في أول رسالة ترسل للنموذج
    const systemPrompt: ChatMessage = {
      id: 'system',
      role: "assistant",
      content: ASTRO_PROMPT,
      images: [],
      timestamp: new Date(),
    };

    // Create user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      images: pendingImage ? [pendingImage] : [],
      timestamp: new Date(),
    };

    // أرسل البرومبت دائماً مع الرسائل (حتى لو كانت المحادثة مستمرة)
    const messagesToSend = [systemPrompt, userMessage];

    setMessages((prev) => [...prev, userMessage]);
    setMessage('');
    setPendingImage(null);

    try {
      // Initialize OpenRouterService with the selected model and API key
      const service = new OpenRouterService(selectedModel, apiKey);
      const response = await service.sendMessage({
        model: selectedModel,
        messages: messagesToSend,
        temperature: 0.7,
        maxTokens: 2000
      });

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        images: [],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      // ...no conversation update, privacy enforced...
    } catch (error) {
      // Error handling
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: 'حدث خطأ أثناء إرسال الرسالة. حاول مرة أخرى.',
        images: [],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Ref for scrolling to the bottom of the messages
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Function to switch to a new random API key (حسب النموذج)
  const switchApiKey = () => {
    const newKey = getApiKeyForModel(selectedModel);
    setApiKey(newKey || '');
    localStorage.setItem('apiKey', newKey || '');
  };

  // تحديث المفتاح تلقائياً عند تغيير النموذج
  useEffect(() => {
    const newKey = getApiKeyForModel(selectedModel);
    setApiKey(newKey || '');
    localStorage.setItem('apiKey', newKey || '');
    // eslint-disable-next-line
  }, [selectedModel]);

  // Sidebar toggle handler (يجب تعريفه قبل استخدامه)
  // Sidebar toggle handler (removed unused toggleSidebar)
  return (
    <div className="min-h-screen min-w-full flex items-center justify-center bg-gradient-to-b from-[#1a1333] via-[#232329] to-[#0d0c1b] astro-bg relative overflow-hidden">
      {/* خلفية نجوم متحركة (SVG أو CSS) */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <svg width="100%" height="100%">
          <defs>
            <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fffbe6" stopOpacity="1" />
              <stop offset="100%" stopColor="#fffbe6" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="astroAurora" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a18fff" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#6f4cff" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          {/* نجوم عشوائية */}
          {[...Array(60)].map((_, i) => (
            <circle
              key={i}
              cx={Math.random() * 1920}
              cy={Math.random() * 1080}
              r={Math.random() * 1.5 + 0.5}
              fill="url(#starGlow)"
              opacity={Math.random() * 0.7 + 0.3}
            />
          ))}
          {/* هالة فلكية أعلى وأسفل */}
          <ellipse
            cx="50%"
            cy="0"
            rx="60%"
            ry="12%"
            fill="url(#astroAurora)"
            opacity="0.7"
          />
          <ellipse
            cx="50%"
            cy="100%"
            rx="60%"
            ry="12%"
            fill="url(#astroAurora)"
            opacity="0.7"
          />
          {/* رموز فلكية متحركة */}
          <text x="10%" y="20%" fontSize="32" fill="#e0baff" opacity="0.12" style={{ fontFamily: 'serif' }}>♈︎</text>
          <text x="80%" y="30%" fontSize="28" fill="#e0baff" opacity="0.10" style={{ fontFamily: 'serif' }}>♓︎</text>
          <text x="60%" y="80%" fontSize="36" fill="#e0baff" opacity="0.10" style={{ fontFamily: 'serif' }}>☉</text>
          <text x="30%" y="70%" fontSize="30" fill="#e0baff" opacity="0.08" style={{ fontFamily: 'serif' }}>☽</text>
        </svg>
        {/* خطوط هالة متحركة CSS */}
        <div className="astro-aurora pointer-events-none"></div>
      </div>
      <main
        className="
          relative z-10 w-full
          max-w-4xl
          mx-auto flex flex-col
          rounded-2xl shadow-2xl border border-[#3a2e5a]
          bg-gradient-to-b from-[#20173a]/90 via-[#232329]/90 to-[#18181b]/95 astro-chat-bg
          min-h-[70vh]
          min-w-[90vw]
          sm:min-w-[700px]
          sm:max-w-4xl
          sm:p-0
          p-0
        "
        style={{ boxSizing: 'border-box' }}
      >
        {/* الشريط العلوي: المفاتيح والنماذج في الأعلى يسار */}
        <header className="w-full flex flex-row justify-between items-center rounded-t-2xl bg-gradient-to-r from-[#2d1e4f] to-[#18181b] shadow-sm p-4 border-b border-[#3a2e5a]">
          <span className="text-[#e0baff] text-xl font-bold flex items-center gap-2">🔭 Astro Chat</span>
          <div className="flex items-center space-x-2 flex-row-reverse">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="border border-gray-700 bg-[#232329] text-gray-100 rounded-lg px-3 py-1"
              disabled={isLoading}
            >
              {AI_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              className="p-2 rounded-lg hover:bg-gray-800"
              title="إعدادات مفتاح API"
            >
              <Key className="w-5 h-5" />
            </button>
            <button
              onClick={switchApiKey}
              className="p-2 rounded-lg hover:bg-gray-800"
              title="تبديل مفتاح API"
              disabled={isLoading}
            >
              🔄
            </button>
          </div>
        </header>
        {/* مربع الشات يغطي كل الواجهة تحت الشريط العلوي */}
        <div className="flex-1 flex flex-col justify-between">
          {/* الرسائل */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-4 astro-chat-bg">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#bfaaff]">
                <span className="text-6xl mb-4 animate-pulse">✨</span>
                <h3 className="text-2xl font-bold mb-2">ابدأ استكشاف أسرارك الفلكية</h3>
                <p className="mb-6">اكتب بيانات ميلادك أو سؤالك الفلكي لبدء التحليل الروحاني.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                  <div className="p-4 border border-[#3a2e5a] rounded-lg bg-[#232329]/80 shadow">
                    <h4 className="font-medium mb-2 text-[#e0baff]">أمثلة</h4>
                    <ul className="space-y-2 text-right">
                      <li
                        className="p-2 hover:bg-gray-50 rounded cursor-pointer"
                        onClick={() => setMessage("اشرح لي الحوسبة الكمية بشكل بسيط")}
                      >
                        "اشرح لي الحوسبة الكمية بشكل بسيط"
                      </li>
                      <li
                        className="p-2 hover:bg-gray-50 rounded cursor-pointer"
                        onClick={() =>
                          setMessage("أعطني أفكاراً إبداعية لعيد ميلاد طفل عمره 10 سنوات")
                        }
                      >
                        "أعطني أفكاراً إبداعية لعيد ميلاد طفل عمره 10 سنوات"
                      </li>
                      <li
                        className="p-2 hover:bg-gray-50 rounded cursor-pointer"
                        onClick={() => setMessage("كيف يمكنني عمل طلب HTTP في JavaScript؟")}
                      >
                        "كيف يمكنني عمل طلب HTTP في JavaScript؟"
                      </li>
                    </ul>
                  </div>
                  <div className="p-4 border border-[#3a2e5a] rounded-lg bg-[#232329]/80 shadow">
                    <h4 className="font-medium mb-2 text-[#e0baff]">الإمكانيات</h4>
                    <ul className="space-y-2 text-right">
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>يتذكر ما قلته سابقاً في المحادثة</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>يسمح بإجراء تصحيحات متابعة</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>مدرب على رفض الطلبات غير المناسبة</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`relative max-w-3xl rounded-lg px-4 py-2 shadow-lg astro-bubble ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-l from-[#a18fff] to-[#6f4cff] text-white rounded-br-none border border-[#8e6cff]'
                        : 'bg-gradient-to-r from-[#232329] to-[#2d1e4f] text-[#e0baff] rounded-bl-none border border-[#3a2e5a]'
                    }`}
                    style={{
                      boxShadow: msg.role === 'assistant'
                        ? '0 0 16px 2px #e0baff33'
                        : '0 0 12px 2px #a18fff44'
                    }}
                  >
                    {/* نسخ رد الذكاء الصناعي */}
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => copyToClipboard(msg.content)}
                        className="absolute top-2 left-2 p-1 rounded hover:bg-gray-700"
                        title="نسخ الرد"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                    {/* تعديل رسالة المستخدم */}
                    {msg.role === 'user' && (
                      <button
                        onClick={() => editUserMessage(msg.id)}
                        className="absolute top-2 left-2 p-1 rounded hover:bg-gray-700"
                        title="تعديل الرسالة"
                      >
                        ✏️
                      </button>
                    )}
                    {msg.content}
                    {/* الصورة فقط مع النص */}
                    {msg.images && msg.content && msg.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt="تم الرفع"
                        className="max-w-xs max-h-48 rounded mt-2"
                      />
                    ))}
                    <p className="text-xs opacity-70 mt-1 text-gray-400">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          {/* إدخال الرسالة */}
          <div className="border-t border-[#3a2e5a] p-2 sm:p-4 bg-gradient-to-r from-[#2d1e4f] to-[#18181b] flex flex-col gap-2 shadow-inner rounded-b-2xl">
            <div className="w-full">
              <div className="flex items-end space-x-2">
                <div className="flex-1 relative">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,.pdf,.txt,.doc,.docx"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute left-2 bottom-2 text-gray-400 hover:text-gray-200"
                    disabled={isLoading}
                    title="إرفاق ملف"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onPaste={handlePaste}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={
                      pendingImage
                        ? "اكتب نص الرسالة لإرسال الصورة..."
                        : "اكتب رسالتك..."
                    }
                    className="w-full border border-[#6f4cff] bg-[#232329] text-[#e0baff] rounded-lg pl-10 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-[#a18fff] focus:border-transparent resize-none shadow text-sm sm:text-base"
                    rows={1}
                    disabled={isLoading}
                    dir="auto"
                  />
                  {/* عرض معاينة للصورة المعلقة قبل الإرسال */}
                  {pendingImage && (
                    <div className="mt-2 flex items-center gap-2">
                      <img
                        src={pendingImage}
                        alt="معاينة الصورة"
                        className="max-w-xs max-h-32 rounded"
                      />
                      <button
                        onClick={() => setPendingImage(null)}
                        className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                        type="button"
                      >
                        حذف الصورة
                      </button>
                    </div>
                  )}
                  <button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isLoading}
                    className="absolute right-2 bottom-2 p-1 rounded-full text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed"
                    title="إرسال"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            <div className="w-full flex justify-end">
              <button
                onClick={() => {
                  if (messages.length > 0) {
                    const aiMsgs = messages.filter(m => m.role === 'assistant').map(m => m.content).join('\n\n');
                    if (aiMsgs) copyToClipboard(aiMsgs);
                  }
                  clearChat();
                }}
                className="mt-2 px-4 py-2 bg-gradient-to-r from-[#a18fff] to-[#6f4cff] text-white rounded-lg hover:from-[#c3b1fa] hover:to-[#8e6cff] shadow"
                title="نسخ كل الردود ومحو الشات"
                disabled={messages.length === 0}
              >
                نسخ كل الردود ومحو الشات
              </button>
            </div>
          </div>
          {/* إعدادات مفتاح API */}
          {showApiKeyInput && (
            <div className="border-t border-gray-800 p-4 bg-[#18181b] rounded-b-2xl">
              <div className="max-w-4xl mx-auto flex space-x-2">
                <input
                  type={apiKey ? 'password' : 'text'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="أدخل مفتاح API الخاص بك"
                  className="flex-1 border border-gray-700 bg-[#232329] text-gray-100 rounded-lg px-3 py-2 text-right"
                  dir="ltr"
                />
                <button
                  onClick={() => setShowApiKeyInput(false)}
                  className="px-4 py-2 bg-gray-700 text-gray-100 rounded-lg hover:bg-gray-600"
                >
                  حفظ
                </button>
              </div>
              <p className="text-sm text-gray-400 mt-2 text-right">
                يتم تخزين مفتاح API الخاص بك محلياً في متصفحك.
              </p>
            </div>
          )}
          {!apiKey && (
            <p className="text-sm text-red-400 mt-2 text-right">
              الرجاء إدخال مفتاح API لبدء الدردشة.
            </p>
          )}
        </div>
      </main>
      {/* ...existing code for background and styles... */}
      <style>{`
        .astro-bg::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-radial-gradient(circle at 20% 30%, #fffbe633 0 1px, transparent 1px 100px),
                      repeating-radial-gradient(circle at 70% 80%, #e0baff22 0 1.5px, transparent 1.5px 120px);
          z-index: 1;
          pointer-events: none;
        }
        .astro-bubble {
          position: relative;
          overflow: visible;
          word-break: break-word;
        }
        .astro-bubble:after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 30px;
          width: 24px;
          height: 24px;
          background: radial-gradient(circle, #a18fff44 0%, transparent 80%);
          filter: blur(6px);
          z-index: 0;
          pointer-events: none;
        }
        .astro-chat-bg {
          animation: astro-bg-move 30s linear infinite alternate;
        }
        @keyframes astro-bg-move {
          0% { background-position: 0 0, 0 0; }
          100% { background-position: 100px 200px, 200px 100px; }
        }
        /* Aurora effect */
        .astro-aurora {
          position: absolute;
          left: 0; right: 0; top: 0; bottom: 0;
          z-index: 2;
          pointer-events: none;
          background: radial-gradient(ellipse at 50% 0%, #a18fff33 0%, transparent 70%),
                      radial-gradient(ellipse at 50% 100%, #6f4cff22 0%, transparent 70%);
          animation: astro-aurora-move 12s ease-in-out infinite alternate;
        }
        @keyframes astro-aurora-move {
          0% { opacity: 0.7; filter: blur(0px);}
          100% { opacity: 0.9; filter: blur(2px);}
        }
      `}</style>
    </div>
  );
};

export default App;