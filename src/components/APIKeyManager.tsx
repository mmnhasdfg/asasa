import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { OpenRouterService } from '../services/openrouter';

interface APIKeyManagerProps {
  onAPIKeyChange: (key: string) => void;
  apiKey: string;
}

const APIKeyManager: React.FC<APIKeyManagerProps> = ({ onAPIKeyChange, apiKey }) => {
  const [showKey, setShowKey] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'untested' | 'valid' | 'invalid'>('untested');
  const [tempKey, setTempKey] = useState(apiKey);

  useEffect(() => {
    setTempKey(apiKey);
    if (apiKey) {
      testConnection(apiKey);
    }
  }, [apiKey]);

  const testConnection = async (key: string) => {
    if (!key.trim()) {
      setConnectionStatus('untested');
      return;
    }

    setTestingConnection(true);
    try {
      const service = new OpenRouterService(key);
      const isValid = await service.testConnection();
      setConnectionStatus(isValid ? 'valid' : 'invalid');
    } catch {
      setConnectionStatus('invalid');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleKeyChange = (newKey: string) => {
    setTempKey(newKey);
    setConnectionStatus('untested');
  };

  const handleSaveKey = () => {
    onAPIKeyChange(tempKey);
    if (tempKey) {
      testConnection(tempKey);
    }
  };

  const getStatusIcon = () => {
    if (testingConnection) {
      return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
    }
    
    switch (connectionStatus) {
      case 'valid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'invalid':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Key className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    if (testingConnection) return 'جاري اختبار الاتصال...';
    
    switch (connectionStatus) {
      case 'valid':
        return 'الاتصال صحيح';
      case 'invalid':
        return 'مفتاح API غير صحيح';
      default:
        return 'لم يتم اختبار المفتاح';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Key className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">مفتاح OpenRouter API</h3>
        <a
          href="https://openrouter.ai/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
        >
          الحصول على المفتاح
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      
      <div className="relative">
        <input
          type={showKey ? 'text' : 'password'}
          value={tempKey}
          onChange={(e) => handleKeyChange(e.target.value)}
          placeholder="أدخل مفتاح OpenRouter API (sk-or-...)"
          className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 pr-20 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        
        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          
          {getStatusIcon()}
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <span className={`text-sm ${
          connectionStatus === 'valid' ? 'text-green-600' :
          connectionStatus === 'invalid' ? 'text-red-600' :
          'text-gray-500'
        }`}>
          {getStatusText()}
        </span>
        
        <button
          onClick={handleSaveKey}
          disabled={tempKey === apiKey || testingConnection}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          حفظ المفتاح
        </button>
      </div>
      
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-xs text-blue-700">
          <strong>ملاحظة:</strong> يتم حفظ مفتاح API محلياً في متصفحك ولا يتم إرساله إلى خوادمنا. 
          جميع استدعاءات API تتم مباشرة إلى OpenRouter من متصفحك.
        </p>
      </div>
    </div>
  );
};

export default APIKeyManager;