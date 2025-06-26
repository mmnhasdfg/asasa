// نموذج لتخزين إعدادات البيئة
interface EnvConfig {
  // إعدادات API
  apiKeys: {
    openRouter: string[];
  };
  // إعدادات النماذج
  models: {
    [modelId: string]: {
      name: string;
      description: string;
      apiKeys: string[];
    };
  };
}

// دالة مساعدة للوصول الآمن لمتغيرات البيئة
export function getEnvVar(key: string, fallback: string = ''): string {
  const envKey = key.startsWith('VITE_') ? key : `VITE_${key}`;
  
  // 1. محاولة الحصول من import.meta.env (Vite في المتصفح)
  if (import.meta.env[envKey]) {
    return import.meta.env[envKey] as string;
  }
  
  // 2. محاولة الحصول من process.env (Node.js في الخادم)
  if (typeof process !== 'undefined' && process.env[envKey]) {
    return process.env[envKey] as string;
  }
  
  // 3. محاولة الوصول المباشر (لوقت البناء)
  const envValue = (import.meta as any).env?.[envKey] || '';
  if (envValue) return envValue;
  
  // 4. إرجاع القيمة الافتراضية إذا لم يتم العثور على المتغير
  return fallback;
}

// الحصول على جميع مفاتيح OpenRouter المتاحة
export function getOpenRouterApiKeys(): string[] {
  // الحصول على جميع المفاتيح الممكنة
  const allPossibleKeys = [
    'VITE_OPENROUTER_API_KEY',
    'VITE_OPENROUTER_API_KEY_2',
    'VITE_OPENROUTER_API_KEY_3',
    'VITE_OPENROUTER_API_KEY_4',
    'VITE_OPENROUTER_API_KEY_5',
    'VITE_OPENROUTER_API_KEY_6',
  ];

  // تصفية المفاتيح الفارغة
  const validKeys = allPossibleKeys
    .map(key => getEnvVar(key.replace('VITE_', '')))
    .filter(Boolean);

  if (validKeys.length === 0) {
    console.warn('لم يتم العثور على مفاتيح OpenRouter API في متغيرات البيئة');
  }

  return validKeys;
}

// الحصول على إعدادات البيئة الكاملة
export function getEnvConfig(): EnvConfig {
  return {
    apiKeys: {
      openRouter: getOpenRouterApiKeys(),
    },
    models: {
      'deepseek/deepseek-chat-v3-0324:free': {
        name: 'DeepSeek Chat v3',
        description: 'نموذج DeepSeek المتقدم للدردشة',
        apiKeys: [
          getEnvVar('VITE_OPENROUTER_API_KEY'),
          getEnvVar('VITE_OPENROUTER_API_KEY_2'),
        ].filter(Boolean),
      },
      'google/gemma-3-27b-it:free': {
        name: 'Google Gemma 3 27B',
        description: 'نموذج Gemma من جوجل',
        apiKeys: [
          getEnvVar('VITE_OPENROUTER_API_KEY_3'),
          getEnvVar('VITE_OPENROUTER_API_KEY_4'),
        ].filter(Boolean),
      },
      'meta-llama/llama-4-maverick:free': {
        name: 'Meta Llama 4 Maverick',
        description: 'نموذج Llama المتقدم من Meta',
        apiKeys: [
          getEnvVar('VITE_OPENROUTER_API_KEY_5'),
          getEnvVar('VITE_OPENROUTER_API_KEY_6'),
        ].filter(Boolean),
      },
    },
  };
}

// تصدير الإعدادات الافتراضية
export const envConfig = getEnvConfig();
