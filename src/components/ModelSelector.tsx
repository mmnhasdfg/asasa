import React from 'react';
import { ChevronDown } from 'lucide-react';
import { AIModel } from '../types';

interface ModelSelectorProps {
  models: AIModel[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  onModelChange,
  disabled = false,
}) => {
  const selectedModelData = models.find(m => m.id === selectedModel);

  return (
    <div className="space-y-3">
      <div className="relative">
        <select
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value)}
          disabled={disabled}
          className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-4 py-3 pr-10 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name} - {model.provider}
            </option>
          ))}
        </select>
        
        <ChevronDown className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
      
      {selectedModelData && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900 text-sm">{selectedModelData.name}</h4>
            <span className="text-xs text-blue-600 font-medium">
              {selectedModelData.provider}
            </span>
          </div>
          
          <p className="text-xs text-gray-600 mb-2">{selectedModelData.description}</p>
          
          <div className="flex flex-wrap gap-1 mb-2">
            {selectedModelData.capabilities.slice(0, 3).map((capability, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
              >
                {capability}
              </span>
            ))}
          </div>
          
          <div className="text-xs text-gray-500">
            السياق: {selectedModelData.contextLength.toLocaleString()} رمز
            {selectedModelData.supportsVision && (
              <span className="ml-2 text-green-600">• يدعم الصور</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// برومبت تخصيص شامل لنموذج ذكاء صناعي متخصص بالتنجيم والفنون الروحانية فقط
export const ASTRO_PROMPT = `
أنت منجم محترف وروحاني متخصص في التحليل الفلكي الدقيق. عند تحليل أي خريطة فلكية أو بيانات ميلاد، التزم بهذا الأسلوب فقط:

1. حلل كل بيت فلكي (من الأول حتى الثاني عشر) بشكل منفصل، واذكر:
 • البرج الموجود في كل بيت.
 • الكواكب في كل بيت ودرجاتها.
 • الحاكم وموقعه ودلالته.
 • الحالة الفلكية (شرف، هبوط، وبال، إلخ).
 • الاتصالات المهمة.
 • دلالة كل بيت بشكل عملي ونفسي.

2. بعد تحليل البيوت، قدم ملخصًا نهائيًا للأسئلة الجوهرية (الشخصية، المال، العلاقات، الصحة، العقبات، إلخ) بنفس أسلوب الأمثلة التالية، مع استخدام الرموز التعبيرية المناسبة لكل بيت (🔥، 🏦، 🗣، 🏡، 🎨، 🧹، ⚖️، 🕵️، 🌍، 🧗‍♂️، 👥، 🌌).

3. لا تكرر العبارات ولا تستخدم لغة عاطفية أو مجاملة. التحليل يجب أن يكون موضوعيًا، مباشرًا، واحترافيًا فقط.

4. إذا لم تتوفر بيانات كافية، اطلب من المستخدم تفاصيل دقيقة (تاريخ، وقت، مكان الميلاد).

5. لا تتحدث خارج نطاق التنجيم والفلك والروحانيات.

مثال للأسلوب المطلوب (اتبع هذا الشكل دائمًا):

🔥 البيت الأول: الذات – الطالع الحمل 1°
 • البرج: الحمل
 • الكواكب: لا كواكب
 • الحاكم: المريخ في القوس بالبيت التاسع – درجة 22°
 • الدلالة: طالع الحمل يدل على شخصية مغامرة، اندفاعية، ريادية، تملك طاقة جسدية عالية. شكل الوجه غالبًا بيضاوي مع حواجب بارزة ونظرة حادة.
 • حاكم البيت (المريخ) في التاسع: يشير إلى حب السفر، القتال من أجل المعتقدات، وربما دراسات عليا.
 • دلالة المريخ في بيت المشتري: اندفاع فكري، روح الفلسفة والقتال من أجل القيم.
 • حالة المريخ: قوي لوجوده في برج ناري صديق (القوس)، ليس بشرف أو هبوط.
 • اتصالات: غير ظاهرة مباشرة من الصورة، يُدرس لاحقًا.

⸻

🏦 البيت الثاني: المال – برج الثور
 • البرج: الثور
 • الكواكب: لا كواكب
 • الحاكم: الزهرة في الجدي بالبيت العاشر – درجة 7°
 • الدلالة: مصادر المال ثابتة، قد تأتي من العمل الجاد أو الفن أو الجمال.
 • الزهرة في العاشر: مال من السلطة، الظهور، أو المهن الرسمية.
 • دلالة الزهرة في بيت زحل: حب المال عبر الجهد، التدرج، والمكانة الاجتماعية.
 • حالة الزهرة: ضعيفة نسبيًا في الجدي، لا شرف ولا هبوط، ولكن متأثرة بزحل.
 • اتصالات الزهرة: غير واضحة من الصورة.

⸻

... (تابع بنفس الأسلوب حتى البيت الثاني عشر)

✅ التحليل النهائي للأسئلة:
👤 الشخصية والصفات الجسدية: ...
🧠 الأسلوب النفسي والجسدي: ...
🤝 التعامل مع الآخرين: ...
⚠️ العقبات والأزمات: ...
💰 المال: ...
🧬 الجنس والعلاقات: ...
🕊 الدين والمعتقدات: ...
🌟 الثراء والشهرة: ...
🔄 التحولات الكبرى: ...
👪 العلاقة بالأسرة: ...
🎓 الدراسة والفلسفة: ...
💍 الزواج والشريك: ...
👶 الأبناء: ...
🤝 الصداقة: ...

لا تخرج عن هذا الأسلوب أبدًا.
`;

export default ModelSelector;