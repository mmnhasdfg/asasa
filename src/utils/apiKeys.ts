import { getOpenRouterApiKeys } from './env';

// تعريف النماذج والمفاتيح المرتبطة بها
const MODEL_KEYS = {
  // نموذج DeepSeek - يستخدم المفتاحين 1 و 2
  'deepseek/deepseek-chat-v3-0324:free': [
    'VITE_OPENROUTER_API_KEY',
    'VITE_OPENROUTER_API_KEY_2'
  ],
  // نموذج Google Gemma - يستخدم المفتاحين 3 و 4
  'google/gemma-3-27b-it:free': [
    'VITE_OPENROUTER_API_KEY_3',
    'VITE_OPENROUTER_API_KEY_4'
  ],
  // نموذج Meta Llama - يستخدم المفتاحين 5 و 6
  'meta-llama/llama-4-maverick:free': [
    'VITE_OPENROUTER_API_KEY_5',
    'VITE_OPENROUTER_API_KEY_6'
  ]
} as const;

// الحصول على جميع المفاتيح المتاحة
const apiKeys = getOpenRouterApiKeys();

/**
 * الحصول على مفتاح API عشوائي من المفاتيح المتاحة
 */
export function getRandomApiKey() {
  if (apiKeys.length === 0) {
    console.error('لم يتم العثور على مفاتيح API صالحة');
    return '';
  }
  return apiKeys[Math.floor(Math.random() * apiKeys.length)] ?? '';
}

/**
 * الحصول على مفتاح API مخصص للنموذج المحدد
 * @param modelId معرف النموذج
 * @returns مفتاح API صالح للنموذج المحدد
 */
export function getApiKeyForModel(modelId: string): string {
  // الحصول على أسماء المتغيرات البيئية المرتبطة بالنموذج
  const envVarNames = MODEL_KEYS[modelId as keyof typeof MODEL_KEYS] || [];
  
  // تحويل أسماء المتغيرات إلى قيمها الفعلية
  const keys = envVarNames
    .map(varName => import.meta.env[varName])
    .filter((key): key is string => Boolean(key));
  
  if (keys.length === 0) {
    console.warn(`لا توجد مفاتيح متاحة للنموذج: ${modelId}`);
    return getRandomApiKey(); // العودة إلى مفتاح عشوائي إذا لم يتم العثور على مفاتيح محددة
  }
  
  // اختيار مفتاح عشوائي من المفاتيح المتاحة لهذا النموذج
  return keys[Math.floor(Math.random() * keys.length)] ?? '';
}

/**
 * التحقق من توفر مفاتيح API
 * @returns true إذا كان هناك على الأقل مفتاح واحد متاح
 */
export const isApiKeysAvailable = (): boolean => {
  return Object.values(MODEL_KEYS)
    .flat()
    .some(varName => Boolean(import.meta.env[varName]));
};

/**
 * الحصول على حالة المفاتيح المتاحة
 * @returns كائن يحتوي على حالة كل مفتاح
 */
export const getApiKeysStatus = () => {
  const allKeys = Object.values(MODEL_KEYS).flat();
  return allKeys.reduce((acc, key) => ({
    ...acc,
    [key]: Boolean(import.meta.env[key])
  }), {} as Record<string, boolean>);
};

// تصدير تعيين النماذج والمفاتيح للاستخدام في أماكن أخرى
export { MODEL_KEYS };
