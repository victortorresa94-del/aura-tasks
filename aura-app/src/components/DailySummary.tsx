import React, { useEffect, useRef, useState } from 'react';
import { X, PlayCircle, CheckCircle, Calendar, ArrowRight, Mic, Activity } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from '@google/genai';
import { Task } from '../types';
import { generateTaskContext } from '../utils/auraLogic';
import { createPcmBlob, decodeAudioData } from '../utils/audio';
import { AURA_IMAGE } from '../utils/constants';

interface DailySummaryProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  userName: string;
  onUpdateTask: (task: Task) => void;
}

const DailySummary: React.FC<DailySummaryProps> = ({ isOpen, onClose, tasks, userName, onUpdateTask }) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [status, setStatus] = useState<'connecting' | 'listening' | 'speaking' | 'idle'>('connecting');
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);

  // Filter relevant tasks for display
  const today = new Date().toISOString().split('T')[0];
  const relevantTasks = tasks.filter(t => (t.date === today || t.date < today) && t.status !== 'completada');

  // Tools for the Summary AI
  const updateTaskTool = {
    name: 'update_task',
    description: 'Update an existing task status or date.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: 'The exact ID of the task to update' },
        status: { type: Type.STRING, description: 'new status (completada, pendiente)' },
        date: { type: Type.STRING, description: 'new date YYYY-MM-DD' }
      },
      required: ['id']
    }
  };

  useEffect(() => {
    if (isOpen) {
      startSession();
    } else {
      stopSession();
    }
    return () => stopSession();
  }, [isOpen]);

  const startSession = async () => {
    if (!process.env.API_KEY) return;
    setStatus('connecting');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } });
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      inputSourceRef.current = source;
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      nextStartTimeRef.current = outputCtx.currentTime;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: { parts: [{ text: "Eres Aura. Estás dando el resumen del día. Sé breve, directa y profesional. Si el usuario quiere cambiar algo, usa update_task." }] },
          tools: [{ functionDeclarations: [updateTaskTool] }],
        },
        callbacks: {
          onopen: () => {
             setStatus('speaking');
             // Send Context Immediately
             const context = generateTaskContext(tasks, userName);
             sessionPromise.then(s => s.sendRealtimeInput({
               content: { role: 'user', parts: [{ text: context }] }
             }));
          },
          onmessage: async (msg: LiveServerMessage) => {
             // Audio Output
             const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (audioData) {
               const buffer = await decodeAudioData(audioData, outputCtx);
               const src = outputCtx.createBufferSource();
               src.buffer = buffer;
               src.connect(outputCtx.destination);
               src.start(Math.max(outputCtx.currentTime, nextStartTimeRef.current));
               nextStartTimeRef.current += buffer.duration;
             }
             
             // Tool Calls (Update Task)
             if (msg.toolCall) {
                for (const fc of msg.toolCall.functionCalls) {
                  if (fc.name === 'update_task') {
                    const args = fc.args as any;
                    const taskToUpdate = tasks.find(t => t.id === args.id);
                    if (taskToUpdate) {
                       const updated = { ...taskToUpdate, ...args };
                       onUpdateTask(updated);
                       setActiveTask(updated); // Highlight the task being modified
                    }
                    sessionPromise.then(s => s.sendToolResponse({
                        functionResponses: { name: fc.name, id: fc.id, response: { result: "Tarea actualizada" } }
                    }));
                  }
                }
             }
          },
          onclose: () => setStatus('idle')
        }
      });

      sessionRef.current = sessionPromise;

      processor.onaudioprocess = (e) => {
         const data = e.inputBuffer.getChannelData(0);
         const blob = createPcmBlob(data);
         sessionPromise.then(s => s.sendRealtimeInput({ media: { mimeType: blob.mimeType, data: blob.data } }));
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

    } catch (e) {
      console.error(e);
      setStatus('idle');
    }
  };

  const stopSession = () => {
     if (processorRef.current) processorRef.current.disconnect();
     if (inputSourceRef.current) inputSourceRef.current.disconnect();
     if (audioContextRef.current) audioContextRef.current.close();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-gray-900/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in-up">
      <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white p-2">
        <X size={32} />
      </button>

      <div className="text-center mb-10 scale-100 relative">
         <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 relative border-4 border-white/10 shadow-2xl bg-black">
             <img src={AURA_IMAGE} className="w-full h-full rounded-full object-cover relative z-10" alt="Aura" />
            {/* Animation rings behind the image */}
            {status === 'speaking' && <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-30 z-0"></div>}
            {status === 'connecting' && <div className="absolute -inset-1 border-t-2 border-indigo-500 rounded-full animate-spin z-20"></div>}
         </div>
         <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Resumen del Día</h2>
         <p className="text-indigo-200 font-medium">
           {status === 'connecting' ? 'Conectando con Aura...' : 'Analizando tu agenda...'}
         </p>
      </div>

      <div className="w-full max-w-md space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
         {relevantTasks.map(task => (
           <div 
             key={task.id} 
             className={`p-4 rounded-2xl flex items-center justify-between transition-all duration-300 ${
               activeTask?.id === task.id 
                 ? 'bg-indigo-600 border border-indigo-400 shadow-lg scale-105' 
                 : 'bg-white/5 border border-white/10 hover:bg-white/10'
             }`}
           >
              <div className="flex-1 min-w-0 mr-4">
                 <h3 className="font-bold text-white truncate">{task.title}</h3>
                 <p className="text-xs text-white/60 flex items-center gap-1">
                   {task.date < today && <span className="text-red-400 font-bold bg-red-400/10 px-1.5 py-0.5 rounded">Atrasada</span>}
                   <span className="capitalize">{task.priority}</span>
                 </p>
              </div>
              <div className="flex gap-2">
                 <button 
                   onClick={() => onUpdateTask({...task, date: new Date(Date.now() + 86400000).toISOString().split('T')[0]})}
                   className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white/80 transition-colors"
                   title="Posponer a mañana"
                 >
                   <Calendar size={18} />
                 </button>
                 <button 
                    onClick={() => onUpdateTask({...task, status: 'completada'})}
                    className="p-2 bg-green-500/20 hover:bg-green-500/40 text-green-400 rounded-xl border border-green-500/30 transition-colors"
                    title="Completar"
                 >
                   <CheckCircle size={18} />
                 </button>
              </div>
           </div>
         ))}
         {relevantTasks.length === 0 && (
            <div className="text-center py-8 bg-white/5 rounded-2xl border border-dashed border-white/10">
              <p className="text-white/60">¡Todo limpio! No tienes tareas pendientes para hoy.</p>
            </div>
         )}
      </div>

      <div className="mt-8 text-white/40 text-sm font-medium">
         Prueba a decir: "Pasa la compra a mañana"
      </div>
    </div>
  );
};

export default DailySummary;
