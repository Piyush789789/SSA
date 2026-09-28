import React, { useState } from 'react';
import { Sparkles, Send, Bot, User, BookOpen, Lightbulb, CheckCircle2, HelpCircle, RefreshCw, Copy, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const StudentAIAssistantPage = () => {
  const { currentUser } = useAuth();
  const studentName = currentUser?.name || 'Rohit Verma';
  const className = currentUser?.className || '5-B';

  const [inputMessage, setInputMessage] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'ai',
      text: `Hello ${studentName.split(' ')[0]}! 🌟 I'm your AI Study Tutor. Ask me anything about your Class ${className} subjects—Mathematics, Science, English, or Social Studies. How can I help you learn today?`,
      time: 'Just now',
    },
  ]);

  const suggestedPrompts = [
    { label: '🔢 Explain Fractions', prompt: 'Explain how to add fractions with unlike denominators using simple step-by-step examples.' },
    { label: '🌱 Photosynthesis Quiz', prompt: 'Give me 3 quick practice questions about photosynthesis and plant parts for Grade 5.' },
    { label: '📝 Essay Writing Tips', prompt: 'How do I write a good introductory paragraph for my English essay about "My Favorite Hobby"?' },
    { label: '🪐 Solar System Facts', prompt: 'Explain the difference between inner rocky planets and outer gas giants.' },
    { label: '📐 Geometry Angles', prompt: 'What is the difference between acute, right, and obtuse angles?' },
    { label: '💡 Math Practice Problem', prompt: 'Give me a word problem on calculating area and perimeter with its solution.' },
  ];

  const handleSendPrompt = (promptText) => {
    const query = promptText || inputMessage;
    if (!query.trim()) return;

    const userMsg = {
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatHistory((prev) => [...prev, userMsg]);
    setInputMessage('');

    // Generate intelligent AI response after short simulated think time
    setTimeout(() => {
      let aiResponseText = ``;

      const qLower = query.toLowerCase();
      if (qLower.includes('fraction') || qLower.includes('denominator')) {
        aiResponseText = `### Adding Fractions with Unlike Denominators 🍕\n\nHere is how you do it in 3 easy steps:\n\n1. **Find the Common Denominator (LCM):**\n   Suppose you want to add **1/3 + 1/4**.\n   The common denominator of 3 and 4 is **12**.\n\n2. **Convert each fraction:**\n   - 1/3 = (1 × 4) / (3 × 4) = **4/12**\n   - 1/4 = (1 × 3) / (4 × 3) = **3/12**\n\n3. **Add only the numerators (top numbers):**\n   - 4/12 + 3/12 = **7/12**\n\n🎉 *Final Answer: 7/12! Would you like a practice problem to try yourself?*`;
      } else if (qLower.includes('photosynthesis') || qLower.includes('plant')) {
        aiResponseText = `### Grade 5 Science Mini-Quiz: Photosynthesis 🌱\n\nTest your knowledge with these 3 questions:\n\n1. **Question 1:** What green pigment inside plant leaves absorbs sunlight for photosynthesis?\n   *(Hint: It starts with C)*\n\n2. **Question 2:** What gas do plants take in from the air, and what gas do they release?\n\n3. **Question 3:** What is the sugar/food produced by the plant called?\n\n👉 *Type your answers in the chat, and I'll grade them for you!*`;
      } else if (qLower.includes('angle') || qLower.includes('geometry')) {
        aiResponseText = `### Understanding Angles in Geometry 📐\n\nAngles are measured in degrees (°):\n\n- **Acute Angle:** Smaller than 90° (Think: "A cute small angle!"), like 30° or 45°.\n- **Right Angle:** Exactly 90° (Looks like a perfect letter 'L' or the corner of your textbook).\n- **Obtuse Angle:** Greater than 90° but less than 180° (Wide open, like an open book).\n- **Straight Angle:** Exactly 180° (A flat straight line).\n\n💡 *Tip for your test: The corners of your classroom door and notebook are always 90° right angles!*`;
      } else if (qLower.includes('essay') || qLower.includes('hobby') || qLower.includes('english')) {
        aiResponseText = `### How to Write a Strong Introduction Paragraph ✍️\n\nA great essay opening has 3 key ingredients:\n\n1. **The Hook (1st sentence):** Grab the reader's attention with an exciting fact or thought.\n   *Example: "Imagine spending an entire afternoon lost in another world with just a paintbrush and canvas."*\n2. **Connecting Sentence:** Explain what your hobby is and why you love it.\n   *Example: "For me, painting has been my favorite creative outlet since I was seven years old."*\n3. **Thesis Statement:** Tell the reader what the essay will cover.\n   *Example: "Painting not only relaxes my mind after school, but it also improves my concentration and lets me express my imagination."*`;
      } else if (qLower.includes('planet') || qLower.includes('solar system')) {
        aiResponseText = `### Inner vs. Outer Planets 🪐\n\n- **Inner Planets (Mercury, Venus, Earth, Mars):**\n  - Made of solid rock and metal (Terrestrial).\n  - Smaller in size, closer to the Sun, and have very few or no moons.\n\n- **Outer Planets (Jupiter, Saturn, Uranus, Neptune):**\n  - Huge giant planets made mostly of hydrogen, helium, and ices (Gas Giants).\n  - Have thick atmospheres, rings, and dozens of moons!`;
      } else if (qLower.includes('area') || qLower.includes('perimeter')) {
        aiResponseText = `### Math Word Problem: Rectangle Area & Perimeter 📏\n\n**Problem:**\nRohan wants to build a fence around his rectangular garden which is **8 meters long** and **5 meters wide**.\n1. How much fencing wire does he need in total (Perimeter)?\n2. What is the total planting ground space (Area)?\n\n**Solution:**\n- **Perimeter = 2 × (Length + Width)** = 2 × (8 + 5) = 2 × 13 = **26 meters** of wire.\n- **Area = Length × Width** = 8 × 5 = **40 square meters** (m²).`;
      } else {
        aiResponseText = `Great question about **${query}**! 📚\n\nHere are the core concepts to remember for your Class ${className} study:\n- Review key definitions in your textbook Chapter summary.\n- Practice 2-3 sample numericals or concept questions.\n- Make flashcard notes for quick revision before your weekly test!\n\nWould you like me to explain any specific formula or give you a practice problem on this?`;
      }

      const aiMsg = {
        sender: 'ai',
        text: aiResponseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatHistory((prev) => [...prev, aiMsg]);
    }, 450);
  };

  const handleCopyText = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-[#FF6B2C]" />
            AI Study Tutor
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Your personalized learning assistant for homework help, revision quizzes, and concept explanations.
          </p>
        </div>

        <button
          onClick={() => {
            setChatHistory([
              {
                sender: 'ai',
                text: `Chat reset! Hello ${studentName.split(' ')[0]}! What would you like to learn or practice next?`,
                time: 'Just now',
              },
            ]);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl text-xs font-bold transition-all shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          Reset Tutor Chat
        </button>
      </div>

      {/* Suggested Quick Topics */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          Quick Practice Prompts
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {suggestedPrompts.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSendPrompt(item.prompt)}
              className="text-left p-3 rounded-2xl bg-white border border-slate-200 hover:border-[#FF6B2C] hover:bg-[#FFF5F0]/30 transition-all text-xs text-slate-700 font-medium group cursor-pointer shadow-2xs"
            >
              <div className="font-bold text-slate-900 group-hover:text-[#FF6B2C] mb-1">{item.label}</div>
              <p className="text-slate-500 line-clamp-1">{item.prompt}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col h-[560px] overflow-hidden">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {chatHistory.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 max-w-[85%] ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs ${
                  msg.sender === 'user'
                    ? 'bg-[#FF6B2C] text-white'
                    : 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white'
                }`}
              >
                {msg.sender === 'user' ? 'ME' : <Bot className="w-4 h-4" />}
              </div>

              <div className="group relative">
                <div
                  className={`p-4 rounded-3xl text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#FF6B2C] text-white rounded-tr-xs'
                      : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">{msg.text}</div>
                </div>

                <div
                  className={`flex items-center gap-2 mt-1 px-1 text-[10px] text-slate-400 font-medium ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <span>{msg.time}</span>
                  {msg.sender === 'ai' && (
                    <button
                      onClick={() => handleCopyText(msg.text, index)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer inline-flex items-center gap-1"
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-500">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-slate-50/80 border-t border-slate-200/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask a question about your lessons (e.g., 'How to find LCM of 6 and 8?')..."
              className="flex-1 h-12 bg-white border border-slate-200 rounded-2xl px-4 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/20"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="h-12 px-5 bg-[#FF6B2C] hover:bg-[#F25A1B] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-2xl shadow-sm shadow-[#FF6B2C]/20 transition-all cursor-pointer flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentAIAssistantPage;
