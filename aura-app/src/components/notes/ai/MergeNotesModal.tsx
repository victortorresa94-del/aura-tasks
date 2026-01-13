
import React, { useState } from 'react';
import { X, Files, Wand2, RefreshCw, Save, AlertCircle, Check } from 'lucide-react';
import { aiService, AiGenerationResult } from '../../../services/aiService';
import { notesRepo } from '../../../firebase/repositories';
import { Note } from '../../../types';

interface MergeNotesModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    notes: Note[];
    onNoteCreated: (note: Note) => void;
}

const TEMPLATE_OPTIONS = [
    'Resumen combinado',
    'Bullet points más importantes',
    'Checklist accionable',
    'Frameworks y modelos',
    'Contradicciones / coincidencias'
];

const MergeNotesModal: React.FC<MergeNotesModalProps> = ({ isOpen, onClose, userId, notes, onNoteCreated }) => {
    const [step, setStep] = useState<'input' | 'processing' | 'preview'>('input');
    const [error, setError] = useState<string | null>(null);

    // Inputs
    const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
    const [template, setTemplate] = useState(TEMPLATE_OPTIONS[0]);
    const [prompt, setPrompt] = useState('');

    // Result
    const [result, setResult] = useState<AiGenerationResult | null>(null);
    const [editableDoc, setEditableDoc] = useState('');

    if (!isOpen) return null;

    const toggleNote = (id: string) => {
        setSelectedNoteIds(prev =>
            prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]
        );
    };

    const handleGenerate = async () => {
        if (selectedNoteIds.length < 2) {
            setError("Por favor selecciona al menos 2 notas para fusionar.");
            return;
        }

        setStep('processing');
        setError(null);

        try {
            const selectedNotes = notes.filter(n => selectedNoteIds.includes(n.id));
            const res = await aiService.mergeNotes(userId, selectedNotes, {
                template,
                prompt
            });

            setResult(res);
            setEditableDoc(res.doc.documentMarkdown);
            setStep('preview');
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Error fusionando notas.");
            setStep('input');
        }
    };

    const handleSave = async () => {
        if (!result) return;

        try {
            const newNote: any = {
                ownerId: userId,
                title: result.doc.title || `Fusión: ${selectedNoteIds.length} notas`,
                content: editableDoc,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                blocks: [],
                ai: {
                    sourceType: 'merge',
                    sourceNoteIds: selectedNoteIds,
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
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-gradient-to-r from-emerald-500/10 to-transparent">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/20">
                            <Files size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white tracking-tight">Fusionar Notas</h3>
                            <p className="text-xs text-gray-400 font-medium">Sintetizador de conocimiento</p>
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
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Seleccionar Notas ({selectedNoteIds.length})</label>
                                <div className="max-h-56 overflow-y-auto bg-[#0A0A0A] border border-white/10 rounded-xl p-2 space-y-1 custom-scrollbar">
                                    {notes.map(note => (
                                        <div
                                            key={note.id}
                                            onClick={() => toggleNote(note.id)}
                                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${selectedNoteIds.includes(note.id) ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100' : 'bg-transparent border-transparent hover:bg-white/5 text-gray-400'}`}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <span className="text-lg opacity-70">{note.icon}</span>
                                                <span className="text-sm font-medium truncate">{note.title || 'Sin Título'}</span>
                                            </div>
                                            {selectedNoteIds.includes(note.id) && <div className="bg-emerald-500 text-black p-0.5 rounded-full"><Check size={12} strokeWidth={3} /></div>}
                                        </div>
                                    ))}
                                    {notes.length === 0 && <p className="text-center text-xs text-gray-500 p-8">No tienes notas para fusionar.</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Objetivo de la Fusión</label>
                                    <select
                                        value={template}
                                        onChange={e => setTemplate(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-aura-accent"
                                    >
                                        {TEMPLATE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Prompt Adicional (Opcional)</label>
                                <textarea
                                    value={prompt}
                                    onChange={e => setPrompt(e.target.value)}
                                    placeholder="Ej: Busca contradicciones entre las fuentes..."
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-aura-accent h-24 resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse"></div>
                                <div className="relative z-10 p-4 bg-[#0A0A0A] rounded-2xl border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
                                    <Wand2 size={48} className="text-emerald-500 animate-spin-slow" />
                                </div>
                            </div>
                            <h4 className="text-2xl font-bold text-white mb-3 tracking-tight">Sintetizando...</h4>
                            <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                                Analizando y combinando {selectedNoteIds.length} notas para generar un documento maestro.
                            </p>
                            <div className="mt-8">
                                <button onClick={() => setStep('input')} className="text-xs text-emerald-400 hover:text-emerald-300 font-bold tracking-wide uppercase px-4 py-2 rounded-lg hover:bg-emerald-500/10 transition-colors">
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
                            <button onClick={handleGenerate} className="px-6 py-2 bg-aura-accent text-black font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2">
                                <Wand2 size={16} />
                                Fusionar
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

export default MergeNotesModal;
