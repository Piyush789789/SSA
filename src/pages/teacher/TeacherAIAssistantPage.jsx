import React, { useState } from 'react';
import { Sparkles, Send, Bot, User, BookOpen, Lightbulb, FileText, CheckCircle2, HelpCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const TeacherAIAssistantPage = () => {
  const { currentUser } = useAuth();
  const teacherName = currentUser?.name || 'Anjali Singh';

  const [inputMessage, setInputMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'ai',
      text: `Hello ${teacherName.split(' ')[0]}! I am your AI Teaching Assistant. How can I help you prepare for Class 5-B or 6-A today?`,
      time: 'Just now',
    },
  ]);

  const suggestedActions = [
    { label: 'Create homework', prompt: 'Create a 5-question Math homework assignment on Fractions for Class 5-B.' },
    { label: 'Generate quiz questions', prompt: 'Generate 5 multiple-choice quiz questions on Plant Cell Structure for Class 6-A Science.' },
    { label: 'Explain a topic', prompt: 'Explain the concept of reflection and refraction in simple terms suitable for Grade 6 students.' },
    { label: 'Create lesson plan', prompt: 'Create a 45-minute lesson plan for teaching Angle Classification in Mathematics.' },
    { label: 'Analyze class performance', prompt: 'Analyze recent assessment performance for Class 5-B Mathematics.' },
    { label: 'Generate student feedback', prompt: 'Draft positive progress report feedback for a student showing improvement in Science.' },
  ];

  const handleSendPrompt = (promptText) => {
    const query = promptText || inputMessage;
    if (!query.trim()) return;

    // Append user message
    const userMsg = { sender: 'user', text: query, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChatHistory((prev) => [...prev, userMsg]);
    setInputMessage('');

    // Generate mock AI response after short delay
    setTimeout(() => {
      let aiResponseText = `Here is a tailored response for your request:\n\n`;

      if (query.toLowerCase().includes('homework') || query.toLowerCase().includes('fraction')) {
        aiResponseText += `**Class 5-B Mathematics Homework Assignment:**\n1. Convert 3/4 into a decimal.\n2. Add 1/2 + 2/5 and simplify your answer.\n3. A pizza was cut into 8 equal slices. If Rahul ate 3 slices, what fraction remains?\n4. Compare 4/7 and 5/9 using <, >, or =.\n5. Solve: 3.45 + 12.8 - 4.1.`;
      } else if (query.toLowerCase().includes('quiz') || query.toLowerCase().includes('cell')) {
        aiResponseText += `**Class 6-A Science Quiz Questions (Plant Cell):**\n1. Which organelle is responsible for photosynthesis? (A) Mitochondria (B) Chloroplast (C) Ribosome (D) Cell Membrane [Ans: B]\n2. What gives rigidity and shape to plant cells? (A) Cytoplasm (B) Cell Wall (C) Vacuole (D) Nucleus [Ans: B]\n3. True or False: Animal cells also contain a large central vacuole. [Ans: False]`;
      } else if (query.toLowerCase().includes('explain') || query.toLowerCase().includes('topic')) {
        aiResponseText += `**Topic Explanation for Students:**\nImagine light traveling like a straight flashlight beam. When light bounces off a shiny mirror, that bounce is called **reflection**. When light enters water or glass and bends slightly, that bending is called **refraction**!`;
      } else if (query.toLowerCase().includes('lesson plan') || query.toLowerCase().includes('angle')) {
        aiResponseText += `**45-Minute Lesson Plan: Angles & Measurement**\n- **08:00 - 08:10 AM:** Warm-up & definition of Acute (<90°), Right (=90°), and Obtuse (>90°) angles.\n- **08:10 - 08:30 AM:** Interactive protractor demonstration on whiteboard.\n- **08:30 - 08:45 AM:** Student hands-on worksheet practice & individual assistance.`;
      } else {
        aiResponseText += `Based on your classes 5-B and 6-A, I have synthesized lesson materials and student evaluation summaries. Let me know if you would like me to format this as a downloadable PDF or assign it directly to your class homework list!`;
      }

      const aiMsg = { sender: 'ai', text: aiResponseText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setChatHistory((prev) => [...prev, aiMsg]);
    }, 400);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <Sparkles className="w-7 h-7 text-[#FF6B2C] stroke-[2]" />
          <span>AI Assistant</span>
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
          Your teaching assistant — generate lesson plans, quizzes, homework, and student feedback instantly
        </p>
      </div>

      {/* Suggested Actions Chips */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Suggested Quick Actions</h3>
        <div className="flex flex-wrap gap-2.5">
          {suggestedActions.map((act, idx) => (
            <button
              key={idx}
              onClick={() => handleSendPrompt(act.prompt)}
              className="px-3.5 py-2 bg-slate-50 hover:bg-[#FFF5F0] hover:border-[#FF6B2C]/40 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:text-[#FF6B2C] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Lightbulb className="w-3.5 h-3.5 text-[#FF6B2C]" />
              <span>{act.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col h-[520px]">
        {/* Chat History Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar">
          {chatHistory.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 max-w-3xl ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 ${
                  msg.sender === 'user'
                    ? 'bg-[#FF6B2C] text-white'
                    : 'bg-orange-100 text-[#FF6B2C] border border-orange-200'
                }`}
              >
                {msg.sender === 'user' ? 'AS' : <Bot className="w-5 h-5 stroke-[2]" />}
              </div>

              <div
                className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#FF6B2C] text-white rounded-tr-none'
                    : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-none whitespace-pre-line'
                }`}
              >
                <p>{msg.text}</p>
                <span
                  className={`block text-[10px] mt-1.5 font-medium ${
                    msg.sender === 'user' ? 'text-orange-100' : 'text-slate-400'
                  }`}
                >
                  {msg.time}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt();
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask AI assistant for lesson plans, quizzes, feedback..."
              className="flex-1 h-11 px-4 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/15"
            />
            <button
              type="submit"
              className="h-11 px-5 bg-[#FF6B2C] hover:bg-[#F25A1B] text-white font-bold rounded-2xl shadow-md shadow-[#FF6B2C]/20 flex items-center gap-2 transition-all cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4 stroke-[2]" />
              <span className="hidden sm:inline text-xs">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TeacherAIAssistantPage;
