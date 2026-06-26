import { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, Send, Bot, User, Lightbulb, Maximize2, Minimize2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import grainbotSvg from '../../assets/grainbot_front.svg';
import { getContextualTips } from '../../utils/contextualTips';

type MovementStyle = 'static-bottom-right' | 'static-bottom-left' | 'static-top-right' | 'static-top-left' | 'horizontal-bottom' | 'horizontal-top' | 'vertical-right' | 'vertical-left' | 'corners';

interface Message {
  role: 'user' | 'bot';
  text: string;
}

const Mascot = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false); // New State
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [movementStyle, setMovementStyle] = useState<MovementStyle>('static-bottom-right');
  const [position, setPosition] = useState({ top: 'auto', bottom: '80px', left: 'auto', right: '24px' });
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<'tips' | 'chat'>('tips');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: 'Hi idol' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, activeTab]);

  useEffect(() => {
    const savedVisibility = localStorage.getItem('mascot-visible');
    if (savedVisibility !== null) {
      setIsVisible(JSON.parse(savedVisibility));
    }
    
    const savedMovement = localStorage.getItem('mascot-movement') as MovementStyle;
    if (savedMovement) {
      setMovementStyle(savedMovement);
    }

    const handleMascotSettingsChange = (e: any) => {
      if (e.detail?.movement) {
        setMovementStyle(e.detail.movement);
      }
      if (e.detail?.visible !== undefined) {
        setIsVisible(e.detail.visible);
      }
    };

    window.addEventListener('mascot-settings-changed', handleMascotSettingsChange);
    return () => window.removeEventListener('mascot-settings-changed', handleMascotSettingsChange);
  }, []);

  useEffect(() => {
    setCurrentTipIndex(0);
  }, [location.pathname]);

  useEffect(() => {
    const positionMap: Record<MovementStyle, { top: string; bottom: string; left: string; right: string }[]> = {
      'static-bottom-right': [{ top: 'auto', bottom: '80px', left: 'auto', right: '24px' }],
      'static-bottom-left': [{ top: 'auto', bottom: '80px', left: '24px', right: 'auto' }],
      'static-top-right': [{ top: '80px', bottom: 'auto', left: 'auto', right: '24px' }],
      'static-top-left': [{ top: '80px', bottom: 'auto', left: '24px', right: 'auto' }],
      'horizontal-bottom': [
        { top: 'auto', bottom: '80px', left: 'auto', right: '24px' },
        { top: 'auto', bottom: '80px', left: '24px', right: 'auto' },
      ],
      'horizontal-top': [
        { top: '80px', bottom: 'auto', left: 'auto', right: '24px' },
        { top: '80px', bottom: 'auto', left: '24px', right: 'auto' },
      ],
      'vertical-right': [
        { top: '80px', bottom: 'auto', left: 'auto', right: '24px' },
        { top: 'auto', bottom: '80px', left: 'auto', right: '24px' },
      ],
      'vertical-left': [
        { top: '80px', bottom: 'auto', left: '24px', right: 'auto' },
        { top: 'auto', bottom: '80px', left: '24px', right: 'auto' },
      ],
      'corners': [
        { top: '80px', bottom: 'auto', left: 'auto', right: '24px' },
        { top: '80px', bottom: 'auto', left: '24px', right: 'auto' },
        { top: 'auto', bottom: '80px', left: '24px', right: 'auto' },
        { top: 'auto', bottom: '80px', left: 'auto', right: '24px' },
      ],
    };

    const positions = positionMap[movementStyle];
    setPosition(positions[0]);

    if (positions.length > 1) {
      let currentIndex = 0;
      const interval = setInterval(() => {
        currentIndex = (currentIndex + 1) % positions.length;
        setPosition(positions[currentIndex]);
      }, 6000);

      return () => clearInterval(interval);
    }
  }, [movementStyle]);

  const handleWave = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const handleNextTip = () => {
    setCurrentTipIndex((prev) => (prev + 1) % tips.length);
  };

  const tips = getContextualTips(location.pathname);
  const currentTip = tips[currentTipIndex];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    const newMessages: Message[] = [...messages, { role: 'user', text: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://grainflow-backend.onrender.com';
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMessage, history: newMessages.slice(-5, -1) })
      });

      if (response.status === 429) {
         setMessages(prev => [...prev, { role: 'bot', text: "Whoa, slowing down!" }]);
         return;
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'bot', text: data.reply || "Sorry, I didn't understand." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: "Oops! Connection failed." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      /* Logic: If maximized, cover the screen and center. 
         If not, behave like a column aligned to the bot.
      */
      className={`fixed z-50 flex pointer-events-none transition-all duration-500 ease-in-out ${
        isMaximized 
          ? 'inset-0 items-center justify-center p-4 sm:p-10' 
          : 'flex-col items-end gap-3'
      }`}
      style={!isMaximized ? {
        top: position.top,
        bottom: position.bottom,
        left: position.left,
        right: position.right,
        transition: 'all 6s ease-in-out, inset 0.5s ease-in-out',
      } : {
        // Clear styles when maximized to allow centering logic to work
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      }}
    >
      {/* 🚀 MODAL BUBBLE */}
      {isOpen && (
        <div className={`
          bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl shadow-2xl flex flex-col overflow-hidden 
          animate-in fade-in zoom-in-95 duration-300 pointer-events-auto transition-all duration-500 ease-in-out
          ${isMaximized 
            ? 'w-full h-full max-w-4xl max-h-[85vh]' // Full screen size (centered via parent)
            : 'w-80 h-auto max-h-[500px]'           // Anchored floating size
          }
        `}>
          
          {/* HEADER WITH CONTROLS */}
          <div className="flex bg-[var(--bg-system)] border-b border-[var(--border-color)] p-1.5 shrink-0 items-center">
            <div className="flex flex-1 gap-1">
                <button 
                onClick={() => setActiveTab('tips')}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'tips' ? 'bg-[var(--bg-card)] text-[var(--primary-main)] shadow-sm' : 'text-[var(--secondary-main)] opacity-50'}`}
                >
                <Lightbulb size={14} /> Tips
                </button>
                <button 
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'chat' ? 'bg-[var(--primary-main)] text-white shadow-sm' : 'text-[var(--secondary-main)] opacity-50'}`}
                >
                <Bot size={14} /> Ask AI
                </button>
            </div>

            {/* SIZING BUTTONS */}
            <div className="flex items-center gap-1 px-1 border-l border-[var(--border-color)] ml-1">
              <button 
                onClick={() => setIsMaximized(!isMaximized)} 
                className="p-2 text-[var(--secondary-main)] opacity-40 hover:opacity-100 hover:bg-[var(--bg-card)] rounded-lg transition-all"
                title={isMaximized ? "Minimize" : "Maximize"}
              >
                {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button 
                onClick={() => { setIsOpen(false); setIsMaximized(false); }} 
                className="p-2 text-[var(--secondary-main)] opacity-40 hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* TAB CONTENT */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeTab === 'tips' ? (
              <div className={`p-5 flex flex-col justify-between h-full`}>
                <div className="animate-in fade-in duration-500">
                  <p className="text-sm font-black text-[var(--text-main)] mb-3 flex items-center gap-2">
                    <Lightbulb size={16} className="text-amber-500" /> Daily Insight
                  </p>
                  <p className={`${isMaximized ? 'text-lg' : 'text-xs'} text-[var(--secondary-main)] opacity-80 leading-relaxed font-medium transition-all duration-500`}>
                    {currentTip}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border-color)]">
                  <span className="text-[10px] font-black text-[var(--secondary-main)] opacity-40 uppercase tracking-widest">
                    {currentTipIndex + 1} / {tips.length}
                  </span>
                  <button onClick={handleNextTip} className="flex items-center gap-1 text-[10px] font-black text-[var(--primary-main)] uppercase hover:bg-[var(--bg-system)] px-3 py-1.5 rounded-lg transition-colors">
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--bg-system)] flex flex-col custom-scrollbar">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-2 max-w-[90%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-all ${msg.role === 'user' ? 'bg-[var(--primary-main)] text-white' : 'bg-white text-[var(--primary-main)] border border-[var(--border-color)]'}`}>
                        {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                      </div>
                      <div className={`p-3 font-medium leading-relaxed shadow-sm transition-all duration-500 ${isMaximized ? 'text-base' : 'text-xs'} ${msg.role === 'user' ? 'bg-[var(--primary-main)] text-white rounded-2xl rounded-tr-sm' : 'bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] rounded-2xl rounded-tl-sm'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isLoading && <div className="animate-pulse p-3 bg-gray-200 w-24 rounded-lg ml-10" />}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSend} className="p-4 bg-[var(--bg-card)] border-t border-[var(--border-color)] shrink-0">
                  <div className={`relative transition-all duration-500 mx-auto ${isMaximized ? 'max-w-4xl' : 'w-full'}`}>
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask GrainBot..."
                      disabled={isLoading}
                      className="w-full pl-4 pr-12 py-3 bg-[var(--bg-system)] border border-[var(--border-color)] rounded-xl text-sm font-bold text-[var(--text-main)] focus:border-[var(--primary-main)] outline-none"
                    />
                    <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[var(--primary-main)] text-white rounded-lg hover:brightness-110 active:scale-95 transition-all">
                      <Send size={18} />
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mascot Button */}
      <div className={`relative pointer-events-auto transition-all duration-500 ${isMaximized ? 'scale-0 opacity-0 h-0 pointer-events-none' : 'scale-100'}`}>
        <button
          onClick={() => { setIsOpen(!isOpen); handleWave(); }}
          className="group focus:outline-none transition-transform hover:scale-110"
        >
          <img src={grainbotSvg} alt="Bot" className={`w-20 h-24 drop-shadow-xl ${isAnimating ? 'animate-bounce' : ''}`} />
        </button>
      </div>
    </div>
  );
};

export default Mascot;