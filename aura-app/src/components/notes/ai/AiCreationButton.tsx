
import React, { useState, useRef } from 'react';
import { Sparkles, Video, Type, Files, ChevronDown, Wand2 } from 'lucide-react';

interface AiCreationButtonProps {
    onOpenVideo: () => void;
    onOpenTopic: () => void;
    onOpenMerge: () => void;
}

const AiCreationButton: React.FC<AiCreationButtonProps> = ({ onOpenVideo, onOpenTopic, onOpenMerge }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
            >
                <Sparkles size={16} className="animate-pulse-slow" />
                <span className="hidden sm:inline">Crear con IA</span>
                <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full right-0 mt-2 w-56 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl z-50 p-2 animate-fade-in-up flex flex-col gap-1">
                        <div className="px-2 py-1 text-[10px] font-bold text-gray-500 uppercase">Generar Documento</div>

                        <button onClick={() => { onOpenVideo(); setIsOpen(false); }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-colors text-xs font-medium text-left">
                            <div className="p-1.5 bg-red-500/20 text-red-400 rounded-md"><Video size={14} /></div>
                            <div>
                                <div className="font-bold">Desde Vídeo</div>
                                <div className="text-[10px] text-gray-500">YouTube o enlace</div>
                            </div>
                        </button>

                        <button onClick={() => { onOpenTopic(); setIsOpen(false); }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-colors text-xs font-medium text-left">
                            <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-md"><Type size={14} /></div>
                            <div>
                                <div className="font-bold">Desde Tema</div>
                                <div className="text-[10px] text-gray-500">Prompt libre</div>
                            </div>
                        </button>

                        <div className="h-px bg-white/10 my-1"></div>
                        <div className="px-2 py-1 text-[10px] font-bold text-gray-500 uppercase">Utilidades</div>

                        <button onClick={() => { onOpenMerge(); setIsOpen(false); }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-colors text-xs font-medium text-left">
                            <div className="p-1.5 bg-green-500/20 text-green-400 rounded-md"><Files size={14} /></div>
                            <div>
                                <div className="font-bold">Fusionar Notas</div>
                                <div className="text-[10px] text-gray-500">Consolidar conocimiento</div>
                            </div>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default AiCreationButton;
