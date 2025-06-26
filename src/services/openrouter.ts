import { ChatMessage } from '../types';
import { envConfig } from '../utils/env';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// واجهة لخيارات إرسال الرسالة
interface SendMessageOptions {
  model: string;
  messages: ChatMessage[];
  onStream?: (chunk: string) => void;
  maxRetries?: number;
  temperature?: number;
  maxTokens?: number;
}

export class OpenRouterService {
  private apiKeys: string[] = [];
  private currentKeyIndex: number = 0;
  private model: string;
  private maxRetries: number;

  /**
   * إنشاء مثيل جديد من خدمة OpenRouter
   * @param model معرف النموذج الافتراضي
   * @param apiKey مفتاح API اختياري لتجاوز المفاتيح الافتراضية
   * @param maxRetries عدد المحاولات الأقصى عند الفشل
   */
  constructor(model: string, apiKey?: string, maxRetries: number = 3) {
    this.model = model;
    this.maxRetries = maxRetries;
    
    // استخدام المفتاح المقدم أو الحصول على المفاتيح من الإعدادات
    if (apiKey && apiKey.trim()) {
      this.apiKeys = [apiKey];
    } else {
      // الحصول على المفاتيح المخصصة للنموذج
      this.apiKeys = this.getModelApiKeys(model);
    }
    
    // بدء بمفتاح عشوائي لتوزيع الحمل
    this.currentKeyIndex = this.apiKeys.length > 0 
      ? Math.floor(Math.random() * this.apiKeys.length) 
      : 0;
  }
  
  /**
   * الحصول على مفاتيح API المخصصة لنموذج معين
   */
  private getModelApiKeys(modelId: string): string[] {
  // الحصول على مفاتيح النموذج من الإعدادات
  const modelConfig = envConfig.models[modelId];
  if (modelConfig && Array.isArray(modelConfig.apiKeys) && modelConfig.apiKeys.length > 0) {
    return modelConfig.apiKeys.filter(Boolean);
  }
  // العودة إلى المفاتيح العامة إذا لم يتم العثور على مفاتيح مخصصة
  console.warn(`No API keys configured for model ${modelId}, using default keys`);
  return envConfig.apiKeys.openRouter.filter(Boolean);
}

  /**
   * الحصول على المفتاح الحالي للاستخدام
   */
  private getCurrentApiKey(): string {
    if (this.apiKeys.length === 0) {
      throw new Error('لا توجد مفاتيح API متاحة لهذا النموذج');
    }
    const key = this.apiKeys[this.currentKeyIndex];
    if (typeof key !== 'string') {
      throw new Error('API key is undefined or not a string');
    }
    return key;
  }

  /**
   * التبديل إلى المفتاح التالي في القائمة
   */
  private switchToNextKey(): void {
    if (this.apiKeys.length === 0) return;
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
  }

  /**
   * إرسال رسالة إلى النموذج
   * @param options خيارات إرسال الرسالة
   * @returns وعد يحمل الرد من النموذج
   */
  async sendMessage(options: SendMessageOptions): Promise<string> {
    const {
      model = this.model,
      messages,
      onStream,
      maxRetries = this.maxRetries,
      temperature = 0.7,
      maxTokens = 2000
    } = options;

    let lastError: Error | null = null;
    
    // التحقق من وجود مفاتيح متاحة
    if (this.apiKeys.length === 0) {
      throw new Error('لا توجد مفاتيح API متاحة لهذا النموذج');
    }
    
    // محاولة إرسال الطلب مع جميع المفاتيح المتاحة
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const currentKey = this.getCurrentApiKey();
      
      if (!currentKey) {
        console.warn(`المفتاح الحالي غير صالح، جاري التبديل إلى المفتاح التالي...`);
        this.switchToNextKey();
        continue;
      }
      try {
        const apiKey = this.getCurrentApiKey();
        const headers = {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'AI Chat Application',
        };

        const requestBody = {
          model: model,
          messages: messages.map(msg => ({
            role: msg.role,
            content: this.formatMessageContent(msg),
            ...(msg.images && msg.images.length > 0 && { images: msg.images }),
          })),
          stream: Boolean(onStream),
          temperature: temperature,
          max_tokens: maxTokens,
        };

        console.log(`Sending request to ${model} with key ${apiKey.substring(0, 10)}...`);
        
        const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = `HTTP error! status: ${response.status}`;
          
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error?.message || errorMessage;
            
            // إذا كانت المشكلة في المفتاح الحالي، انتقل إلى المفتاح التالي
            if (errorData.error?.code === 'invalid_api_key' || 
                errorData.error?.code === 'account_deactivated') {
              console.warn(`API key error: ${errorMessage}`);
              throw new Error('invalid_api_key');
            }
          } catch (e) {
            console.error('Error parsing error response:', e);
          }
          
          throw new Error(errorMessage);
        }

        if (onStream) {
          return await this.handleStreamResponse(response, onStream);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || '';
      } catch (error) {
        const errorObj = error as Error;
        lastError = errorObj;
        
        // تسجيل الخطأ مع تفاصيل إضافية
        console.warn(`المحاولة ${attempt + 1}/${maxRetries + 1} فشلت مع المفتاح ${this.currentKeyIndex + 1}/${this.apiKeys.length}:`, errorObj.message);
        
        // إذا كان الخطأ متعلقًا بالمفتاح الحالي، انتقل إلى المفتاح التالي
        if (errorObj.message === 'invalid_api_key' || 
            errorObj.message.includes('rate limit') ||
            errorObj.message.includes('quota') ||
            errorObj.message.includes('429') ||
            errorObj.message.includes('insufficient') ||
            errorObj.message.includes('invalid_api_key') ||
            errorObj.message.includes('account_deactivated')) {
          
          console.warn(`التبديل إلى المفتاح التالي بسبب: ${errorObj.message}`);
          this.switchToNextKey();
          
          // إذا لم يتبقى محاولات، ألقِ خطأً
          if (attempt >= maxRetries) {
            const errorMsg = `فشلت جميع المحاولات (${maxRetries + 1}) مع جميع المفاتيح المتاحة`;
            console.error(errorMsg);
            throw new Error(errorMsg);
          }
          
          // انتظار قصير قبل المحاولة التالية
          const delay = 1000 * Math.pow(2, attempt); // زيادة التأخير تدريجياً
          console.log(`الانتظار لمدة ${delay} مللي ثانية قبل المحاولة التالية...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // إذا لم يكن الخطأ متعلقًا بالمفتاح، أعد إلقاء الخطأ
        throw errorObj;
      }
    }

    // إذا وصلنا هنا، فهذا يعني أن جميع المحاولات قد فشلت ولم يتم إرجاع قيمة
    throw lastError ?? new Error('فشل إرسال الرسالة ولم يتم تحديد سبب.');
  }

  private formatMessageContent(message: ChatMessage): any {
    if (message.images && message.images.length > 0) {
      return [
        {
          type: 'text',
          text: message.content,
        },
        ...message.images.map(image => ({
          type: 'image_url',
          image_url: {
            url: image,
          },
        })),
      ];
    }
    return message.content;
  }

  /**
   * معالجة الاستجابة المتدفقة
   */
  private async handleStreamResponse(
    response: Response,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('فشل في الحصول على قارئ الاستجابة');
    }

    let fullResponse = '';
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              if (content) {
                fullResponse += content;
                onChunk(content);
              }
            } catch (e) {
              console.error('خطأ في تحليل جزء من البيانات:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullResponse;
  }

  /**
   * اختبار اتصال API مع جميع المفاتيح المتاحة
   * @returns وعد يحمل حالة الاتصال مع تفاصيل المفتاح النشط
   */
  async testConnection(): Promise<{ success: boolean; activeKeyIndex?: number; totalKeys: number; error?: string }> {
    if (this.apiKeys.length === 0) {
      console.error('لا توجد مفاتيح API متاحة للاختبار');
      return { success: false, totalKeys: 0, error: 'لا توجد مفاتيح API متاحة' };
    }
    
    console.log(`جاري اختبار الاتصال باستخدام ${this.apiKeys.length} مفتاح...`);
    
    // اختبار المفتاح الحالي أولاً
    try {
      const currentKey = this.getCurrentApiKey();
      console.log(`اختبار المفتاح ${this.currentKeyIndex + 1}/${this.apiKeys.length}...`);
      
      const response = await fetch(`${OPENROUTER_BASE_URL}/models`, {
        headers: {
          'Authorization': `Bearer ${currentKey}`,
        },
      });
      
      if (response.ok) {
        console.log(`تم التحقق من المفتاح ${this.currentKeyIndex + 1} بنجاح`);
        return { 
          success: true, 
          activeKeyIndex: this.currentKeyIndex,
          totalKeys: this.apiKeys.length 
        };
      }
      
      console.warn(`فشل المفتاح ${this.currentKeyIndex + 1} برمز الخطأ: ${response.status}`);
    } catch (error) {
      console.error(`خطأ في اختبار المفتاح ${this.currentKeyIndex + 1}:`, error);
    }
    
    // إذا فشل المفتاح الحالي، جرب المفاتيح الأخرى
    for (let i = 0; i < this.apiKeys.length; i++) {
      if (i === this.currentKeyIndex) continue;
      
      try {
        console.log(`اختبار المفتاح ${i + 1}/${this.apiKeys.length}...`);
        
        const testResponse = await fetch(`${OPENROUTER_BASE_URL}/models`, {
          headers: {
            'Authorization': `Bearer ${this.apiKeys[i]}`,
          },
        });
        
        if (testResponse.ok) {
          this.currentKeyIndex = i;
          console.log(`تم العثور على مفتاح صالح: ${i + 1}/${this.apiKeys.length}`);
          return { 
            success: true, 
            activeKeyIndex: i,
            totalKeys: this.apiKeys.length 
          };
        }
        
        console.warn(`فشل المفتاح ${i + 1} برمز الخطأ: ${testResponse.status}`);
      } catch (error) {
        console.error(`خطأ في اختبار المفتاح ${i + 1}:`, error);
      }
    }
    
    // إذا فشلت جميع المفاتيح
    const errorMsg = 'فشل الاتصال بجميع المفاتيح المتاحة';
    console.error(errorMsg);
    return { 
      success: false, 
      totalKeys: this.apiKeys.length,
      error: errorMsg 
    };
  }

  /**
   * الحصول على عدد المفاتيح المتاحة
   */
  getAvailableKeysCount(): number {
    return this.apiKeys.length;
  }

  /**
   * الحصول على فهرس المفتاح الحالي
   */
  getCurrentKeyIndex(): number {
    return this.apiKeys.length > 0 ? this.currentKeyIndex + 1 : 0;
  }
  
  /**
   * تحديث النموذج المستخدم
   * @param modelId معرف النموذج الجديد
   */
  setModel(modelId: string): void {
    this.model = modelId;
    this.apiKeys = this.getModelApiKeys(modelId);
    this.currentKeyIndex = 0;
  }
}