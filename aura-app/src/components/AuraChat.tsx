import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Bot, Mic, MicOff, Activity, ChevronDown, Volume2, BrainCircuit, History, Plus, MessageSquare, Trash2, Edit2, Paperclip, File, Image as ImageIcon } from 'lucide-react';
import { ChatMessage, Task, Contact, Project, Note, ChatSession, ChatAttachment } from '../types';
import { getAuraResponse, generateTaskContext, parseCommand, processTextChat } from '../utils/auraLogic';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { createPcmBlob, decodeAudioData } from '../utils/audio';
import { AURA_IMAGE } from '../utils/constants';
import { processFile, SUPPORTED_FILE_TYPES } from '../utils/fileUtils';
import { processTextChatWithAttachments } from '../utils/attachmentProcessor';

interface AuraChatProps {
  isOpen: boolean;
  onClose: () => void;
  onCommand: (text: string) => void;
  tasks: Task[];
  contacts?: Contact[];
  projects?: Project[];
  notes?: Note[];
  userName: string;
  onAddTask: (text: string, eventDate?: string) => void;
  onUpdateTask?: (id: string, updates: Partial<Task>) => void;
  onAddEvent: (title: string, date: string) => void;
  onCreateContact?: (contact: Partial<Contact>) => void;
  onUpdateContact?: (id: string, updates: Partial<Contact>) => void;
  onCreateNote?: (title: string, content: string) => void;
  onUpdateNote?: (id: string, updates: Partial<Note>) => void;
  summaryTrigger?: number;

  // History Props
  chatSessions?: ChatSession[];
  activeChatId?: string | null;
  onSelectSession?: (id: string) => void;
  onCreateSession?: () => void;
  onUpdateSession?: (id: string, messages: ChatMessage[]) => void;
  onDeleteSession?: (id: string) => void;
  onRenameSession?: (id: string, title: string) => void;
}

// ... (Tools remain unchanged)
// --- TOOL DEFINITIONS ---
const createTaskTool: FunctionDeclaration = {
  name: 'createTask',
  description: 'Create a new task with all details.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'Task title' },
      date: { type: Type.STRING, description: 'YYYY-MM-DD' },
      priority: { type: Type.STRING, description: 'alta, media, or baja' },
      status: { type: Type.STRING, description: 'todo, in_progress, done' },
      project: { type: Type.STRING, description: 'Project name' },
      person: { type: Type.STRING, description: 'Associated person name' },
      confidence: { type: Type.NUMBER, description: 'Confidence 0-1' }
    },
    required: ['title', 'confidence']
  }
};

const updateTaskTool: FunctionDeclaration = {
  name: 'updateTask',
  description: 'Update generic properties of a task.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: 'Task ID' },
      title: { type: Type.STRING, description: 'New title' },
      date: { type: Type.STRING, description: 'New date' },
      confidence: { type: Type.NUMBER, description: 'Confidence 0-1' }
    },
    required: ['id', 'confidence']
  }
};

const changeTaskPriorityTool: FunctionDeclaration = {
  name: 'changeTaskPriority',
  description: 'Change the priority of a task.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: 'Task ID' },
      priority: { type: Type.STRING, description: 'alta, media, baja' },
      confidence: { type: Type.NUMBER, description: 'Confidence 0-1' }
    },
    required: ['id', 'priority', 'confidence']
  }
};

const changeTaskStatusTool: FunctionDeclaration = {
  name: 'changeTaskStatus',
  description: 'Change the status of a task.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: 'Task ID' },
      status: { type: Type.STRING, description: 'todo, in_progress, done, review' },
      confidence: { type: Type.NUMBER, description: 'Confidence 0-1' }
    },
    required: ['id', 'status', 'confidence']
  }
};

const rescheduleTaskTool: FunctionDeclaration = {
  name: 'rescheduleTask',
  description: 'Change the date of a task.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: 'Task ID' },
      date: { type: Type.STRING, description: 'New date YYYY-MM-DD' },
      confidence: { type: Type.NUMBER, description: 'Confidence 0-1' }
    },
    required: ['id', 'date', 'confidence']
  }
};

const createNoteTool: FunctionDeclaration = {
  name: 'createNote',
  description: 'Create a new note.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'Note title' },
      content: { type: Type.STRING, description: 'Body content of the note' },
      confidence: { type: Type.NUMBER, description: 'Confidence 0-1' }
    },
    required: ['title', 'content', 'confidence']
  }
};

const updateNoteTool: FunctionDeclaration = {
  name: 'updateNote',
  description: 'Append content or update a note.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: 'Note ID' },
      appendContent: { type: Type.STRING, description: 'Text to append' },
      confidence: { type: Type.NUMBER, description: 'Confidence 0-1' }
    },
    required: ['id', 'confidence']
  }
};

const createContactTool: FunctionDeclaration = {
  name: 'createContact',
  description: 'Create a new contact.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: 'Name' },
      phone: { type: Type.STRING, description: 'Phone' },
      email: { type: Type.STRING, description: 'Email' },
      confidence: { type: Type.NUMBER, description: 'Confidence 0-1' }
    },
    required: ['name', 'confidence']
  }
};

const updateContactTool: FunctionDeclaration = {
  name: 'updateContact',
  description: 'Update a contact.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: 'Contact ID' },
      name: { type: Type.STRING, description: 'New name' },
      phone: { type: Type.STRING, description: 'New phone' },
      confidence: { type: Type.NUMBER, description: 'Confidence 0-1' }
    },
    required: ['id', 'confidence']
  }
};

const queryTasksTool: FunctionDeclaration = {
  name: 'queryTasks',
  description: 'Query existing tasks.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      filter: { type: Type.STRING, description: 'date, status, project' }
    }
  }
};

const AuraChat: React.FC<AuraChatProps> = ({
  isOpen, onClose, onCommand, tasks, contacts = [], projects = [], notes = [], userName,
  onAddTask, onUpdateTask, onAddEvent, onCreateContact, onUpdateContact, onCreateNote, onUpdateNote, summaryTrigger,
  chatSessions = [], activeChatId, onSelectSession, onCreateSession, onUpdateSession, onDeleteSession, onRenameSession
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]); // Synced via effect
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [statusState, setStatusState] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [showHistory, setShowHistory] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize messages from active session
  useEffect(() => {
    if (activeChatId && chatSessions) {
      const session = chatSessions.find(s => s.id === activeChatId);
      if (session) {
        setMessages(session.messages);
      } else {
        setMessages([]); // Fallback?
      }
    } else if (messages.length === 0 && !activeChatId) {
      // Initial greeting if no session active yet (local only)
      setMessages([{ id: '1', role: 'aura', text: '¡Hola! Soy Aura ✨\nPuedo crear tareas, eventos en el calendario y organizarte. ¿Qué necesitas?', timestamp: Date.now() }]);
    }
  }, [activeChatId, chatSessions]);


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
  }, [messages, isTyping, isOpen, showHistory]);

  // Handle Summary Trigger
  useEffect(() => {
    if (summaryTrigger && summaryTrigger > lastSummaryTriggerRef.current) {
      lastSummaryTriggerRef.current = summaryTrigger;
      if (statusState === 'idle') {
        startLiveSession(true);
      }
    }
  }, [summaryTrigger]);

  useEffect(() => {
    return () => {
      stopLiveSession();
    };
  }, []);

  // File upload handlers
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFile(true);
    try {
      const newAttachments: ChatAttachment[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const processed = await processFile(file);
          newAttachments.push(processed);
        } catch (error) {
          console.error('Error processing file:', error);
          alert(`Error con ${file.name}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
      }

      setAttachments(prev => [...prev, ...newAttachments]);
    } finally {
      setUploadingFile(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  // Handle paste event for screenshots (Ctrl+V)
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Check if the item is an image
      if (item.type.startsWith('image/')) {
        e.preventDefault(); // Prevent pasting text representation

        const file = item.getAsFile();
        if (!file) continue;

        setUploadingFile(true);
        try {
          const processed = await processFile(file);
          setAttachments(prev => [...prev, processed]);
        } catch (error) {
          console.error('Error processing pasted image:', error);
          alert(`Error al procesar imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
          setUploadingFile(false);
        }
      }
    }
  };

  const handleSend = async () => {

    if (!input.trim() && attachments.length === 0) return;

    const userText = input;
    setInput('');
    const currentAttachments = [...attachments];
    setAttachments([]); // Clear attachments after sending

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      timestamp: Date.now(),
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined
    };

    // Optimistic Update
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsTyping(true);

    // Sync with session if active
    if (activeChatId && onUpdateSession) {
      onUpdateSession(activeChatId, newMessages);
    } else if (!activeChatId && onCreateSession) {
      // Create session on first message if none active?
      // But for now let's just create it. 
      // Logic Gap: onCreateSession in App.tsx creates a NEW session ID. We don't get it back immediately here unless we wait or useEffect handles it.
      // Simple workaround: If no session, we just work locally until user clicks "New Chat" or similar.
      // OR better: Ask App.tsx to create one potentially?
      // Let's assume for this "Conversation History" feature, the user manually manages sessions or we auto-create.
      // Given UX, maybe just encourage creating a session. For now, works locally.
    }


    try {
      const parsed = parseCommand(userText);
      // Heuristic: if it looks like a direct command, execute local logic to be fast
      if (parsed.length > 0 && (userText.toLowerCase().startsWith('crear') || userText.toLowerCase().includes('mañana'))) {
        onCommand(userText);
        const auraMsg: ChatMessage = { id: Date.now().toString(), role: 'aura', text: "Comando ejecutado localmente.", timestamp: Date.now() };
        const finalMessages = [...newMessages, auraMsg];
        setMessages(finalMessages);
        if (activeChatId && onUpdateSession) onUpdateSession(activeChatId, finalMessages);
        setIsTyping(false);
        return;
      }


      const deepseekKey = (import.meta as any).env.VITE_DEEPSEEK_API_KEY || "sk-aa9aee7b2db34db2a47a81ec9e8e5a60";
      const geminiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || (process as any).env.GEMINI_API_KEY || "";
      const context = generateTaskContext(tasks, userName);
      // PASSING HISTORY AND ATTACHMENTS TO API
      const output = await processTextChatWithAttachments(userText, newMessages, context, deepseekKey, geminiKey);

      const auraMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'aura',
        text: output,
        timestamp: Date.now()
      };

      const finalWithAura = [...newMessages, auraMsg];
      setMessages(finalWithAura);
      if (activeChatId && onUpdateSession) onUpdateSession(activeChatId, finalWithAura);

      // Auto-rename session if it's the first exchange and default title
      if (activeChatId && chatSessions && onRenameSession) {
        const session = chatSessions.find(s => s.id === activeChatId);
        if (session && session.title === 'Nueva conversación' && newMessages.length <= 2) {
          // Simple heuristic for title
          const title = userText.length > 20 ? userText.substring(0, 20) + '...' : userText;
          onRenameSession(activeChatId, title);
        }
      }


    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'aura', text: "Error en el chat.", timestamp: Date.now() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const startLiveSession = async (isSummaryMode = false) => {
    const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || (process as any).env.GEMINI_API_KEY || "";

    // Warn if no key but don't break main app logic
    if (!apiKey) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'aura',
        text: "⚠️ Falta la API Key de Gemini en .env.local (VITE_GEMINI_API_KEY). El modo de voz no funcionará.",
        timestamp: Date.now()
      }]);
      return;
    }

    try {
      setStatusState('listening');
      const ai = new GoogleGenAI({ apiKey });

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      inputSourceRef.current = source;

      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      nextStartTimeRef.current = outputCtx.currentTime;

      let systemInstructionText = `
Añadimos funcionalidades al modo voz:
Este modo tiene reglas específicas distintas del chat escrito.

Tu prioridad absoluta es:
👉 entender correctamente al usuario antes de responder o actuar.

---

## 🕒 CONTROL DE TURNOS DE VOZ (MUY IMPORTANTE)

1. **Nunca respondas inmediatamente**
   - Espera SIEMPRE a que el usuario termine de hablar.
   - Usa un tiempo de espera dinámico (silencio) antes de procesar.

2. Considera que el usuario HA TERMINADO cuando:
   - Hay al menos 1.2–1.5 segundos de silencio continuo
   - O el usuario dice palabras de cierre como:
     “ya está”, “eso es todo”, “vale”, “listo”

3. Si el mensaje parece incompleto:
   - NO respondas
   - NO ejecutes acciones
   - Espera más input

---

## 🧠 PROCESAMIENTO PROGRESIVO

Si detectas múltiples frases encadenadas, analiza el mensaje completo como una sola intención.

---

## 🧭 REGLA CLAVE DE CONFIANZA

Si no estás segura de haber entendido:
- NO ejecutes
- Resume lo que has entendido
- Pide confirmación breve

Ejemplo correcto:
“Vale, he entendido esto: crear una tarea para mañana con prioridad alta. ¿Es correcto?”

---

## 🗣️ TONO EN MODO VOZ

- Natural, Calmado, Breve
- Sin frases largas
- Sin relleno
    
Eres AURA, agente operativo del sistema Aura Tasks.
Tu función no es solo crear cosas, sino MODIFICAR, ACTUALIZAR y ORGANIZAR lo que ya existe.

---

## 🧩 ACCIONES DISPONIBLES (NO INVENTAR OTRAS)

Puedes ejecutar SOLO estas acciones:

TAREAS:
- createTask (título, fecha, prioridad, estado, proyecto)
- updateTask
- changeTaskPriority
- changeTaskStatus
- rescheduleTask

NOTAS:
- createNote (título, contenido)
- updateNote
- linkNoteToTask

CONTACTOS:
- createContact
- updateContact

Si una acción no existe:
→ dilo claramente
→ no simules

---

## 📝 CREACIÓN DE TAREAS (AMPLIADA)

Al crear una tarea, puedes y DEBES interpretar:
- título, fecha
- prioridad (alta, media, baja)
- estado (si se menciona)
- proyecto
- persona asociada

Ejemplo: “mañana llamar a Raúl, es urgente” -> createTask(title="Llamar Raúl", date="mañana", priority="alta")

---

## 🔄 MODIFICACIÓN DE TAREAS EXISTENTES

Cuando el usuario dice: “pásala a prioridad alta” o “muévela a mañana” o “ponla en hecho”
Debes:
1. Usar memoria contextual para identificar la tarea
2. Ejecutar updateTask / changeTaskPriority / changeTaskStatus
3. NO crear una nueva tarea

---

## 📓 NOTAS

Puedes crear notas cuando el usuario diga: “apunta esto” o “crea una nota”.
Reglas:
- El contenido debe ir en el cuerpo de la nota
- El título debe ser corto y representativo
- NO mezclar con tareas

---

## 🧠 CONTEXTO ACTUAL
Fecha: ${new Date().toLocaleString()}
Usuario: ${userName}
`;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: { parts: [{ text: systemInstructionText }] },
          tools: [{ functionDeclarations: [createTaskTool, updateTaskTool, changeTaskPriorityTool, changeTaskStatusTool, rescheduleTaskTool, createNoteTool, updateNoteTool, createContactTool, updateContactTool, queryTasksTool] }],
        },
        callbacks: {
          onopen: () => {
            console.log("Aura Live Connected");
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'aura', text: isSummaryMode ? "🎙️ Generando resumen..." : "🎧 Escuchando...", timestamp: Date.now() }]);

            if (isSummaryMode) {
              const context = generateTaskContext(taskListRef.current, userName);
              /*  sessionPromise.then(session => {
                   try {
                     // session.send({ parts: [{ text: context }], role: 'user' });
                   } catch (e) { console.error("Summary error", e); }
               }); */
            }
          },
          onmessage: async (msg: LiveServerMessage) => {
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              setStatusState('speaking');
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
                const args = fc.args as any;
                // Default to 1.0 if confidence is missing
                const confidence = typeof args.confidence === 'number' ? args.confidence : 1.0;

                const isAction = ['createTask', 'updateTask', 'createContact', 'updateContact', 'addShoppingItem'].includes(fc.name);

                if (isAction && confidence < 0.7) {
                  sessionPromise.then(session => session.sendToolResponse({
                    functionResponses: {
                      name: fc.name,
                      id: fc.id,
                      response: { result: `Confidence (${confidence}) is too low. Ask for confirmation.` }
                    }
                  }));
                  continue;
                }

                if (fc.name === 'createTask') {
                  const items = args.title ? [args.title] : [];
                  // If list provided, might need specific handling, or just append to title/notes
                  onAddTask(args.title || "Tarea sin título", args.date);

                  if (args.list && args.list.toLowerCase() === 'compra') {
                    // Optional: Trigger shopping list logic if separated
                  }

                  sessionPromise.then(session => session.sendToolResponse({
                    functionResponses: {
                      name: fc.name,
                      id: fc.id,
                      response: { result: "Acción ejecutada: createTask" }
                    }
                  }));
                } else if (fc.name === 'createContact') {
                  if (onCreateContact) {
                    onCreateContact({
                      name: args.name,
                      phone: args.phone,
                      email: args.email,
                      company: args.company
                    });
                  }
                  sessionPromise.then(session => session.sendToolResponse({
                    functionResponses: {
                      name: fc.name,
                      id: fc.id,
                      response: { result: "Acción ejecutada: createContact" }
                    }
                  }));
                } else if (fc.name === 'updateContact') {
                  if (onUpdateContact && args.id) {
                    onUpdateContact(args.id, args);
                    sessionPromise.then(session => session.sendToolResponse({
                      functionResponses: {
                        name: fc.name,
                        id: fc.id,
                        response: { result: "Acción ejecutada: updateContact" }
                      }
                    }));
                  } else {
                    sessionPromise.then(session => session.sendToolResponse({
                      functionResponses: {
                        name: fc.name,
                        id: fc.id,
                        response: { result: "Error: Falta ID o función." }
                      }
                    }));
                  }
                } else if (fc.name === 'addShoppingItem') {
                  // Add each item as a task to 'Shopping' list or similar
                  // Assuming onAddTask can handle this if we pass a specific list ID?
                  // Currently filtering by project name 'Personal' or 'Trabajo' or creating tasks.
                  // We will add them as tasks for now.
                  if (args.items && Array.isArray(args.items)) {
                    args.items.forEach((item: string) => {
                      onAddTask(`Comprar ${item}`);
                    });
                  }
                  sessionPromise.then(session => session.sendToolResponse({
                    functionResponses: {
                      name: fc.name,
                      id: fc.id,
                      response: { result: "Items añadidos." }
                    }
                  }));
                } else if (fc.name === 'queryTasks') {
                  const tasksSummary = taskListRef.current.map(t => `ID:${t.id} - ${t.title} (${t.date})`).join(', ');
                  sessionPromise.then(session => session.sendToolResponse({
                    functionResponses: {
                      name: fc.name,
                      id: fc.id,
                      response: { result: tasksSummary || "No hay tareas." }
                    }
                  }));
                } else if (fc.name === 'queryAgenda') {
                  // Similar to queryTasks for now, but could filter by date or type='event'
                  const events = taskListRef.current.filter(t => t.type === 'event' || t.date === args.date);
                  const summary = events.map(t => `${t.title} (${t.date})`).join('\n');
                  sessionPromise.then(session => session.sendToolResponse({
                    functionResponses: {
                      name: fc.name,
                      id: fc.id,
                      response: { result: summary || "Agenda libre." }
                    }
                  }));
                } else if (fc.name === 'updateTask') {
                  if (onUpdateTask && args.id) {
                    const updates: any = {};
                    if (args.title) updates.title = args.title;
                    if (args.date) updates.date = args.date;
                    if (args.status) updates.status = args.status;
                    if (args.project) {
                      // Lookup project ID
                      const proj = projects.find(p => p.name.toLowerCase() === args.project.toLowerCase());
                      if (proj) updates.listId = proj.id;
                    }

                    onUpdateTask(args.id, updates);

                    sessionPromise.then(session => session.sendToolResponse({
                      functionResponses: {
                        name: fc.name,
                        id: fc.id,
                        response: { result: "Tarea actualizada." }
                      }
                    }));
                  } else {
                    sessionPromise.then(session => session.sendToolResponse({
                      functionResponses: {
                        name: fc.name,
                        id: fc.id,
                        response: { result: "Error: Fallo al actualizar." }
                      }
                    }));
                  }
                } else if (fc.name === 'createNote') { // Add missing note handlers
                  console.log("TOOL: createNote", args);
                  if (onCreateNote) {
                    onCreateNote(args.title || "Nota de voz", args.content || "");
                    sessionPromise.then(session => session.sendToolResponse({
                      functionResponses: { name: fc.name, id: fc.id, response: { result: "Nota creada." } }
                    }));
                  } else {
                    console.warn("Tool handler onCreateNote not available");
                  }
                } else if (fc.name === 'updateNote') {
                  console.log("TOOL: updateNote", args);
                  if (onUpdateNote && args.id) {
                    onUpdateNote(args.id, args);
                    sessionPromise.then(session => session.sendToolResponse({
                      functionResponses: { name: fc.name, id: fc.id, response: { result: "Nota actualizada." } }
                    }));
                  }
                }
              }
            }
          },
          onclose: () => {
            setStatusState('idle');
          },
          onerror: (err) => {
            console.error("Aura Live Error", err);
            setStatusState('idle');
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'aura', text: "⚠️ Error de conexión.", timestamp: Date.now() }]);
          }
        }
      });

      liveClientRef.current = sessionPromise;

      await audioContext.audioWorklet.addModule('/audio-processor.js');

      const workletNode = new AudioWorkletNode(audioContext, 'audio-recorder-processor');
      processorRef.current = workletNode as any; // Cast to satisfy ref type or need to update ref type to AudioNode

      workletNode.port.onmessage = (event) => {
        const inputData = event.data;
        // inputData is Float32Array from Worklet
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

      source.connect(workletNode);
      workletNode.connect(audioContext.destination);

    } catch (e) {
      console.error(e);
      setStatusState('idle');
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
    setStatusState('idle');
  };

  const toggleLive = () => {
    if (statusState !== 'idle') {
      stopLiveSession();
    } else {
      startLiveSession();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`
      fixed z-[70] flex flex-col animate-fade-in-up bg-aura-black shadow-2xl border-aura-gray/30 overflow-hidden
      inset-0 md:inset-auto md:right-4 md:top-20 md:bottom-24 md:w-96 md:h-auto md:rounded-2xl md:border
    `}>
      {/* Header */}
      <div className={`p-4 text-white flex items-center justify-between transition-colors duration-500 ${statusState !== 'idle' ? 'bg-aura-accent text-aura-black' : 'bg-aura-gray border-b border-aura-gray-light/30'}`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={AURA_IMAGE} className="w-10 h-10 rounded-full border-2 border-white/10 object-cover" alt="Aura" />
            {statusState !== 'idle' && (
              <div className="absolute -bottom-1 -right-1 p-1 bg-aura-black rounded-full border border-aura-accent flex items-center justify-center w-5 h-5">
                {statusState === 'listening' && <Mic size={12} className="text-aura-accent animate-pulse" />}
                {statusState === 'speaking' && <Volume2 size={12} className="text-aura-accent animate-bounce" />}
                {statusState === 'processing' && <BrainCircuit size={12} className="text-aura-accent animate-spin" />}
              </div>
            )}
          </div>
          <div>
            <h3 className={`font-bold text-sm ${statusState !== 'idle' ? 'text-aura-black' : 'text-aura-white'}`}>
              {statusState === 'idle' && 'Aura AI'}
              {statusState === 'listening' && 'Escuchando...'}
              {statusState === 'processing' && 'Pensando...'}
              {statusState === 'speaking' && 'Aura Hablando'}
            </h3>
            <p className={`text-xs opacity-80 ${statusState !== 'idle' ? 'text-aura-black' : 'text-gray-400'}`}>
              {statusState === 'idle' ? 'Siempre disponible' : 'Modo voz activo'}
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-1 ${statusState !== 'idle' ? 'text-aura-black' : 'text-gray-400'}`}>
          {/* History Button */}
          <button onClick={() => setShowHistory(!showHistory)} className="p-1 hover:bg-white/20 rounded transition-colors" title="Historial">
            <History size={18} />
          </button>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded transition-colors">
            <ChevronDown size={24} className="md:hidden" />
            <X size={18} className="hidden md:block" />
          </button>
        </div>
      </div>

      {/* History Panel (Overlay) */}
      {showHistory && (
        <div className="absolute inset-x-0 top-16 bottom-0 bg-aura-black z-10 p-4 border-b border-aura-gray/30 overflow-y-auto animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-aura-white">Historial de Chat</h4>
            <button
              onClick={() => {
                if (onCreateSession) onCreateSession();
                setShowHistory(false);
              }}
              className="flex items-center gap-1 text-xs bg-aura-gray text-aura-white border border-white/10 px-2 py-1 rounded hover:bg-aura-gray-light"
            >
              <Plus size={12} /> Nuevo Chat
            </button>
          </div>
          <div className="space-y-2">
            {chatSessions && chatSessions.length > 0 ? chatSessions.map(session => (
              <div
                key={session.id}
                className={`p-3 rounded-lg border cursor-pointer hover:bg-aura-gray/30 flex justify-between items-center ${activeChatId === session.id ? 'border-aura-accent/50 bg-aura-gray/50' : 'border-white/5'}`}
                onClick={() => {
                  if (onSelectSession) onSelectSession(session.id);
                  setShowHistory(false);
                }}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquare size={16} className="text-gray-500 shrink-0" />
                  <div className="truncate">
                    <p className="text-sm font-medium text-aura-white truncate">{session.title}</p>
                    <p className="text-xs text-gray-500">{new Date(session.lastActive).toLocaleDateString()} {new Date(session.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <button
                  className="p-1.5 text-gray-500 hover:text-red-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDeleteSession) onDeleteSession(session.id);
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )) : (
              <p className="text-center text-gray-500 text-sm py-4">No hay historial.</p>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-aura-black scrollbar-thin scrollbar-thumb-aura-gray scrollbar-track-transparent" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'aura' && (
              <img src={AURA_IMAGE} className="w-8 h-8 rounded-full border border-white/10 shadow-sm mr-2 mt-1 object-cover" alt="Aura" />
            )}
            <div className="flex flex-col gap-2 max-w-[85%] md:max-w-[80%]">
              {/* Attachments */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {msg.attachments.map(att => (
                    <div key={att.id} className="rounded-lg overflow-hidden border border-white/10">
                      {att.type === 'image' ? (
                        <img
                          src={`data:${att.mimeType};base64,${att.data}`}
                          alt={att.name}
                          className="max-w-[200px] max-h-[200px] object-cover"
                        />
                      ) : (
                        <div className="bg-aura-gray p-2 flex items-center gap-2 min-w-[150px]">
                          <File size={16} className="text-gray-400" />
                          <span className="text-xs truncate text-gray-300">{att.name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {/* Text Message */}
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-line ${msg.role === 'user'
                  ? 'bg-aura-white text-aura-black rounded-br-none font-medium'
                  : 'bg-aura-gray/40 text-gray-200 rounded-bl-none border border-white/5'
                  }`}
              >
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <img src={AURA_IMAGE} className="w-8 h-8 rounded-full border border-white/10 shadow-sm mr-2 mt-1 object-cover" alt="Aura" />
            <div className="bg-aura-gray/40 border border-white/5 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 bg-aura-black border-t border-aura-gray/30 pb-safe">
        {/* Attachment Preview */}
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map(att => (
              <div key={att.id} className="relative group bg-aura-gray rounded-lg p-2 flex items-center gap-2 max-w-[200px] border border-white/10">
                {att.type === 'image' ? (
                  <ImageIcon size={16} className="text-aura-accent" />
                ) : (
                  <File size={16} className="text-gray-400" />
                )}
                <span className="text-xs truncate flex-1 text-gray-300">{att.name}</span>
                <button
                  onClick={() => removeAttachment(att.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/10 rounded transition-opacity"
                >
                  <X size={14} className="text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={SUPPORTED_FILE_TYPES.join(',')}
          onChange={handleFileUpload}
          className="hidden"
        />

        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-aura-gray/30 px-3 py-3 md:py-2 rounded-xl border border-white/5 focus-within:border-aura-gray-light focus-within:ring-1 focus-within:ring-aura-gray-light/50 transition-all">
            {/* Attachment Button */}
            <button
              onClick={handleFileSelect}
              disabled={statusState !== 'idle' || uploadingFile}
              className="p-1 text-gray-500 hover:text-aura-accent disabled:opacity-50 transition-colors"
              title="Adjuntar archivo"
            >
              <Paperclip size={18} />
            </button>

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              onPaste={handlePaste}
              placeholder={uploadingFile ? "Procesando archivo..." : (statusState !== 'idle' ? "Habla con Aura..." : "Escribe algo...")}
              disabled={statusState !== 'idle' || uploadingFile}
              className="flex-1 bg-transparent text-base md:text-sm border-none focus:ring-0 placeholder:text-gray-600 text-aura-white disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={(!input.trim() && attachments.length === 0) || statusState !== 'idle' || uploadingFile}
              className="p-1.5 bg-aura-white text-aura-black rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              <Send size={16} />
            </button>
          </div>

          <button
            onClick={toggleLive}
            className={`p-3 rounded-xl transition-all duration-300 shadow-sm ${statusState !== 'idle'
              ? 'bg-red-500 text-white animate-pulse-slow ring-4 ring-red-900/30'
              : 'bg-aura-gray/30 text-gray-400 hover:bg-aura-gray/50 hover:text-aura-white'
              }`}
          >
            {statusState !== 'idle' ? <MicOff size={22} /> : <Mic size={22} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuraChat;
