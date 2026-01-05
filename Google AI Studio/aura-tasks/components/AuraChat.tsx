import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Bot, Mic, MicOff, Activity, ChevronDown } from 'lucide-react';
import { ChatMessage, Task } from '../types';
import { getAuraResponse, generateTaskContext } from '../utils/auraLogic';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { createPcmBlob, decodeAudioData } from '../utils/audio';
import { AURA_IMAGE } from '../utils/constants';

interface AuraChatProps {
  isOpen: boolean;
  onClose: () => void;
  onCommand: (text: string) => void;
  tasks: Task[];
  userName: string;
  onAddTask: (text: string, eventDate?: string) => void;
  onAddEvent: (title: string, date: string) => void;
  summaryTrigger?: number; 
}

// ... (Tools remain unchanged)
const addTaskTool: FunctionDeclaration = {
  name: 'create_task',
  description: 'Create a new task. Use this for actions the user needs to perform.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'The content/title of the task' },
      date: { type: Type.STRING, description: 'The do-date (when to do the task) in YYYY-MM-DD. Defaults to today if not specified.' },
      priority: { type: Type.STRING, description: 'Priority level: alta, media, or baja' },
      eventDate: { type: Type.STRING, description: 'Optional. If the task is related to a future event (e.g. "Prepare for concert on Friday"), put the Friday date here YYYY-MM-DD.' }
    },
    required: ['title']
  }
};

const addEventTool: FunctionDeclaration = {
  name: 'create_calendar_event',
  description: 'Create a calendar event. Use this when the user mentions a specific event (like a concert, meeting, trip) happening on a specific date.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'The name of the event (e.g., "Concierto Alejo")' },
      date: { type: Type.STRING, description: 'The date of the event in YYYY-MM-DD' }
    },
    required: ['title', 'date']
  }
};

const getTasksTool: FunctionDeclaration = {
  name: 'get_tasks',
  description: 'Get the list of current tasks.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  }
};

const AuraChat: React.FC<AuraChatProps> = ({ isOpen, onClose, onCommand, tasks, userName, onAddTask, onAddEvent, summaryTrigger }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'aura', text: '¡Hola! Soy Aura ✨\nPuedo crear tareas, eventos en el calendario y organizarte. ¿Qué necesitas?', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const liveClientRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const taskListRef = useRef<Task[]>(tasks);
  const lastSummaryTriggerRef = useRef<number>(0);

  useEffect(() => {
    taskListRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isOpen]);

  // Handle Summary Trigger
  useEffect(() => {
    if (summaryTrigger && summaryTrigger > lastSummaryTriggerRef.current) {
      lastSummaryTriggerRef.current = summaryTrigger;
      if (!isLiveActive) {
        startLiveSession(true);
      }
    }
  }, [summaryTrigger]);

  useEffect(() => {
    return () => {
      stopLiveSession();
    };
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      onCommand(userMsg.text);
      const auraMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'aura',
        text: getAuraResponse(userMsg.text, tasks.filter(t => t.status !== 'completada').length),
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, auraMsg]);
      setIsTyping(false);
    }, 1000);
  };

  const startLiveSession = async (isSummaryMode = false) => {
    if (!process.env.API_KEY) {
      alert("API Key not found in environment.");
      return;
    }

    try {
      setIsLiveActive(true);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true
      }});
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      inputSourceRef.current = source;
      
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      nextStartTimeRef.current = outputCtx.currentTime;

      let systemInstructionText = "Eres Aura, un asistente personal inteligente. Tu tono es profesional, empático y eficiente. " +
        "IMPORTANTE: Cuando el usuario diga una tarea relacionada con un evento futuro (ej: 'Enviar tonos para el concierto del viernes'), " +
        "debes realizar DOS acciones: " +
        "1. Crear la tarea de acción para HOY (o la fecha que diga el usuario para HACERLO). " +
        "2. Crear un EVENTO DE CALENDARIO separado para la fecha del evento. " +
        "Usa la herramienta `create_task` para la acción y `create_calendar_event` para el evento.";

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: { parts: [{ text: systemInstructionText }] },
          tools: [{ functionDeclarations: [addTaskTool, addEventTool, getTasksTool] }],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            console.log("Aura Live Connected");
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'aura', text: isSummaryMode ? "🎙️ Generando resumen del día..." : "🎧 Escuchando...", timestamp: Date.now() }]);
            
            if (isSummaryMode) {
                const context = generateTaskContext(taskListRef.current, userName);
                sessionPromise.then(session => {
                    session.sendRealtimeInput({
                        content: {
                            role: 'user',
                            parts: [{ text: context }]
                        }
                    });
                });
            }
          },
          onmessage: async (msg: LiveServerMessage) => {
             const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              const buffer = await decodeAudioData(audioData, outputCtx);
              const src = outputCtx.createBufferSource();
              src.buffer = buffer;
              src.connect(outputCtx.destination);
              const now = outputCtx.currentTime;
              const start = Math.max(now, nextStartTimeRef.current);
              src.start(start);
              nextStartTimeRef.current = start + buffer.duration;
            }

            if (msg.toolCall) {
              for (const fc of msg.toolCall.functionCalls) {
                if (fc.name === 'create_task') {
                  const args = fc.args as any;
                  let taskDesc = args.title;
                  if (args.date) taskDesc += ` ${args.date}`;
                  
                  onAddTask(taskDesc, args.eventDate);
                  
                  sessionPromise.then(session => session.sendToolResponse({
                    functionResponses: {
                      name: fc.name,
                      id: fc.id,
                      response: { result: "Tarea creada." }
                    }
                  }));
                } else if (fc.name === 'create_calendar_event') {
                  const args = fc.args as any;
                  onAddEvent(args.title, args.date);
                  
                  sessionPromise.then(session => session.sendToolResponse({
                    functionResponses: {
                      name: fc.name,
                      id: fc.id,
                      response: { result: "Evento creado en calendario." }
                    }
                  }));
                } else if (fc.name === 'get_tasks') {
                   const tasksSummary = taskListRef.current.map(t => `${t.title} (${t.date})`).join(', ');
                   sessionPromise.then(session => session.sendToolResponse({
                    functionResponses: {
                      name: fc.name,
                      id: fc.id,
                      response: { result: tasksSummary || "No hay tareas pendientes." }
                    }
                  }));
                }
              }
            }
          },
          onclose: () => {
            setIsLiveActive(false);
          },
          onerror: (err) => {
            console.error("Aura Live Error", err);
            setIsLiveActive(false);
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'aura', text: "⚠️ Error de conexión.", timestamp: Date.now() }]);
          }
        }
      });

      liveClientRef.current = sessionPromise;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBlob = createPcmBlob(inputData);
        sessionPromise.then(session => {
           session.sendRealtimeInput({
             media: {
               mimeType: pcmBlob.mimeType,
               data: pcmBlob.data
             }
           });
        });
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

    } catch (e) {
      console.error(e);
      setIsLiveActive(false);
    }
  };

  const stopLiveSession = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (inputSourceRef.current) {
      inputSourceRef.current.disconnect();
      inputSourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsLiveActive(false);
  };

  const toggleLive = () => {
    if (isLiveActive) {
      stopLiveSession();
    } else {
      startLiveSession();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`
      fixed z-[70] flex flex-col animate-fade-in-up bg-white shadow-2xl border-gray-200 overflow-hidden
      inset-0 md:inset-auto md:right-4 md:top-20 md:bottom-24 md:w-96 md:h-auto md:rounded-2xl md:border
    `}>
      {/* Header */}
      <div className={`p-4 text-white flex items-center justify-between transition-colors duration-500 ${isLiveActive ? 'bg-red-500' : 'bg-gradient-to-r from-indigo-600 to-purple-600'}`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={AURA_IMAGE} className="w-10 h-10 rounded-full border-2 border-white/30 object-cover" alt="Aura" />
            {isLiveActive && <div className="absolute -bottom-1 -right-1 p-1 bg-red-500 rounded-full border border-white"><Activity size={10} className="animate-pulse" /></div>}
          </div>
          <div>
            <h3 className="font-bold text-sm">{isLiveActive ? 'Aura En Vivo 🎙️' : 'Aura AI'}</h3>
            <p className="text-xs text-indigo-100 opacity-80">{isLiveActive ? 'Escuchando...' : 'Siempre disponible'}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded transition-colors">
          <ChevronDown size={24} className="md:hidden" />
          <X size={18} className="hidden md:block" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'aura' && (
              <img src={AURA_IMAGE} className="w-8 h-8 rounded-full border border-white shadow-sm mr-2 mt-1 object-cover" alt="Aura" />
            )}
            <div 
              className={`max-w-[85%] md:max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-line ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
             <img src={AURA_IMAGE} className="w-8 h-8 rounded-full border border-white shadow-sm mr-2 mt-1 object-cover" alt="Aura" />
              <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}/>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}/>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}/>
              </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-gray-100 pb-safe">
        <div className="flex items-center gap-2">
           <div className="flex-1 flex items-center gap-2 bg-gray-50 px-3 py-3 md:py-2 rounded-xl border border-gray-200 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-100 transition-all">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isLiveActive ? "Habla con Aura..." : "Escribe algo..."}
              disabled={isLiveActive}
              className="flex-1 bg-transparent text-base md:text-sm border-none focus:ring-0 placeholder:text-gray-400 disabled:opacity-50"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLiveActive}
              className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
          
          <button 
            onClick={toggleLive}
            className={`p-3 rounded-xl transition-all duration-300 shadow-sm ${
              isLiveActive 
              ? 'bg-red-500 text-white animate-pulse-slow ring-4 ring-red-100' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isLiveActive ? <MicOff size={22} /> : <Mic size={22} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuraChat;
