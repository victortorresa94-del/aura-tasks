
import React, { useState } from 'react';
import { X, Youtube, FileText, Wand2, RefreshCw, Save, AlertCircle } from 'lucide-react';
import { aiService, AiGenerationResult } from '../../../services/aiService';
import { notesRepo } from '../../../firebase/repositories';
import { Note } from '../../../types';

interface VideoToDocModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    onNoteCreated: (note: Note) => void;
}

const TEMPLATE_OPTIONS = [
    'Resumen ejecutivo',
    'Bullet points accionables',
    'Notas tipo Notion',
    'Checklist',
    'Guía paso a paso',
    'Q&A'
];

const VideoToDocModal: React.FC<VideoToDocModalProps> = ({ isOpen, onClose, userId, onNoteCreated }) => {
    const [step, setStep] = useState<'input' | 'processing' | 'preview'>('input');
    const [error, setError] = useState<string | null>(null);

    // Inputs
    const [url, setUrl] = useState('');
    const [template, setTemplate] = useState(TEMPLATE_OPTIONS[0]);
    const [length, setLength] = useState('medium');
    const [prompt, setPrompt] = useState('');
    const [transcript, setTranscript] = useState(''); // User provided transcript

    // Result
    const [result, setResult] = useState<AiGenerationResult | null>(null);
    const [editableDoc, setEditableDoc] = useState('');

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!url && !transcript) {
            setError("Por favor inroduce una URL o la transcripción.");
            return;
        }

        setStep('processing');
        setError(null);

        try {
            const res = await aiService.createDocFromVideo(userId, url, transcript, {
                template,
                length,
                prompt
            });

            setResult(res);
            setEditableDoc(res.doc.documentMarkdown);
            setStep('preview');
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Error generando el documento.");
            setStep('input');
        }
    };

    const handleSave = async () => {
        if (!result) return;

        try {
            const newNote: any = {
                ownerId: userId,
                title: result.doc.title || 'Documento IA',
                content: editableDoc,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                blocks: [], // Empty blocks for now, pure markdown content
                ai: {
                    sourceType: 'video',
                    sourceUrl: url,
                    template: template,
                    model: 'gemini-1.5-flash',
                    generatedAt: Date.now()
                }
            };

            const id = crypto.randomUUID();
            await notesRepo.create(userId, { ...newNote, id });
            onNoteCreated({ ...newNote, id });
            onClose();
        } catch (e: any) {
            setError("Error guardando la nota: " + e.message);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-[#1A1A1A] rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh] animate-scale-in">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-gradient-to-r from-red-500/10 to-transparent">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-500/20 text-red-400 rounded-xl shadow-lg shadow-red-500/10 ring-1 ring-red-500/20">
                            <Youtube size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white tracking-tight">Documento desde Vídeo</h3>
                            <p className="text-xs text-gray-400 font-medium">IA Generativa de estudio</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-all active:scale-95">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-200 text-sm rounded-lg flex items-center gap-2">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    {step === 'input' && (
                        <div className="space-y-4">
                            <div className="group">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">URL del Vídeo (YouTube)</label>
                                <div className="relative">
                                    <input
                                        value={url}
                                        onChange={e => setUrl(e.target.value)}
                                        placeholder="Pegar enlace de YouTube..."
                                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl p-4 pl-12 text-sm text-white focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all placeholder:text-gray-700 font-medium"
                                    />
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">
                                        <Youtube size={18} />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Plantilla</label>
                                    <select
                                        value={template}
                                        onChange={e => setTemplate(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-aura-accent"
                                    >
                                        {TEMPLATE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Longitud</label>
                                    <select
                                        value={length}
                                        onChange={e => setLength(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-aura-accent"
                                    >
                                        <option value="short">Corto (Resumido)</option>
                                        <option value="medium">Medio (Estándar)</option>
                                        <option value="long">Largo (Detallado)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Prompt Adicional (Opcional)</label>
                                <textarea
                                    value={prompt}
                                    onChange={e => setPrompt(e.target.value)}
                                    placeholder="Ej: Enfócate en los consejos de marketing..."
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-aura-accent h-20 resize-none"
                                />
                            </div>

                            <div className="group">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex justify-between items-center">
                                    <span className="tracking-wider">Transcripción (Opcional)</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-500 border border-white/5">Recomendado para mayor precisión</span>
                                </label>
                                <textarea
                                    value={transcript}
                                    onChange={e => setTranscript(e.target.value)}
                                    placeholder="Pega aquí el texto del vídeo si la URL no funciona automáticamente..."
                                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl p-4 text-sm text-gray-300 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all h-32 resize-none font-mono text-xs placeholder:text-gray-700 custom-scrollbar leading-relaxed"
                                />
                            </div>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full animate-pulse"></div>
                                <div className="relative z-10 p-4 bg-[#0A0A0A] rounded-2xl border border-red-500/20 shadow-2xl shadow-red-500/10">
                                    <Wand2 size={48} className="text-red-500 animate-spin-slow" />
                                </div>
                            </div>
                            <h4 className="text-2xl font-bold text-white mb-3 tracking-tight">Analizando vídeo...</h4>
                            <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                                Nuestra IA está procesando el contenido visual y textual para extraer los puntos clave.
                            </p>
                            <div className="mt-8">
                                <button onClick={() => setStep('input')} className="text-xs text-red-400 hover:text-red-300 font-bold tracking-wide uppercase px-4 py-2 rounded-lg hover:bg-red-500/10 transition-colors">
                                    Cancelar Operación
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'preview' && result && (
                        <div className="h-full flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex gap-2">
                                    <span className="text-xs font-bold bg-white/10 text-white px-2 py-1 rounded">Score: {(result.doc.confidenceScore * 100).toFixed(0)}%</span>
                                    {result.doc.tags?.map((tag: string) => (
                                        <span key={tag} className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded">#{tag}</span>
                                    ))}
                                </div>
                            </div>
                            <textarea
                                value={editableDoc}
                                onChange={e => setEditableDoc(e.target.value)}
                                className="flex-1 w-full bg-black/30 border border-white/10 rounded-xl p-4 text-sm text-gray-300 focus:outline-none focus:border-white/30 resize-none font-mono leading-relaxed"
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-[#1A1A1A] rounded-b-2xl flex justify-end gap-3">
                    {step === 'input' && (
                        <>
                            <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors">Cancelar</button>
                            <button onClick={handleGenerate} className="px-6 py-2 bg-aura-accent text-black font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                <Wand2 size={16} />
                                Generar
                            </button>
                        </>
                    )}

                    {step === 'processing' && (
                        <button disabled className="px-6 py-3 bg-white/5 text-gray-500 font-bold rounded-xl flex items-center gap-3 cursor-not-allowed border border-white/5">
                            <RefreshCw size={18} className="animate-spin" />
                            <span className="tracking-wide">Procesando...</span>
                        </button>
                    )}

                    {step === 'preview' && (
                        <>
                            <button onClick={() => setStep('input')} className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors">Volver</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-aura-accent text-black font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2">
                                <Save size={16} />
                                Guardar Nota
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoToDocModal;
