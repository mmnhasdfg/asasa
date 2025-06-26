export const AI_MODELS = [
  {
    id: "deepseek/deepseek-chat-v3-0324:free",
    name: "DeepSeek Chat v3 (Free)",
    provider: "DeepSeek",
    description: "نموذج قوي لتحليل النصوص، يدعم الفهم العميق والتحليل الفلكي.",
    capabilities: ["تحليل فلكي", "توقعات", "تحليل نصوص"],
    contextLength: 32768,
    supportsVision: false
  },
  {
    id: "google/gemini-2.0-flash-exp:free",
    name: "Gemini 2.0 Flash (Free)"
  },
  {
    id: "google/gemma-3-27b-it:free",
    name: "Gemma 3 27B IT (Free)",
    provider: "Google",
    description: "نموذج متقدم لتحليل النصوص والتنجيم، لا يدعم الصور.",
    capabilities: ["تحليل فلكي", "توقعات", "تحليل نصوص"],
    contextLength: 8192,
    supportsVision: false
  },
  {
    id: "meta-llama/llama-4-maverick:free",
    name: "Llama 4 Maverick (Free)",
    provider: "Meta",
    description: "نموذج قوي في التحليل الفلكي والتوقعات النصية.",
    capabilities: ["تحليل فلكي", "توقعات", "تحليل نصوص"],
    contextLength: 8192,
    supportsVision: false
  },
  {
    id: "deepseek/deepseek-r1-0528-qwen3-8b:free",
    name: "DeepSeek R1 Qwen3 8B (Free)"
  },
  {
    id: "microsoft/mai-ds-r1:free",
    name: "Microsoft MAI DS R1 (Free)"
  }
];