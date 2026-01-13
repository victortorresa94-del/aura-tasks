
import React, { useState, useRef, useEffect } from 'react';
import {
    MoreHorizontal, EyeOff, Trash2, Edit3, Type, ArrowLeftRight, Check, X,
    Palette, List
} from 'lucide-react'; // Assuming lucide-react is available
import { createPortal } from 'react-dom';

interface ColumnHeaderProps {
    colId: string;
    label: string;
    icon: React.ReactNode;
    type: string;
    width: number;
    minWidth: number;
    fixed?: boolean;
    onResize: (newWidth: number) => void;
    onHide: () => void;
    onDelete?: () => void; // For custom fields
    onRename?: (newName: string) => void;
}

const FixedPopover = ({ children, triggerRect, onClose }: { children: React.ReactNode, triggerRect: DOMRect, onClose: () => void }) => {
    // Basic positioning
    const top = triggerRect.bottom + 5;
    const left = triggerRect.left;

    return createPortal(
        <>
            <div className="fixed inset-0 z-[9998]" onClick={onClose} />
            <div
                className="fixed z-[9999] animate-scale-in origin-top-left"
                style={{ top, left }}
            >
                {children}
            </div>
        </>,
        document.body
    );
};

export const ColumnHeader: React.FC<ColumnHeaderProps> = ({
    colId, label, icon, type, width, minWidth, fixed, onResize, onHide, onDelete, onRename
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);

    // Resizing State
    const [isResizing, setIsResizing] = useState(false);
    const startX = useRef(0);
    const startWidth = useRef(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsResizing(true);
        startX.current = e.clientX;
        startWidth.current = width;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        const handleMouseMove = (mv: MouseEvent) => {
            const diff = mv.clientX - startX.current;
            const newW = Math.max(minWidth, startWidth.current + diff);
            onResize(newW);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const toggleMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (triggerRef.current) {
            setTriggerRect(triggerRef.current.getBoundingClientRect());
            setIsMenuOpen(!isMenuOpen);
        }
    };

    // Rename State
    const [isRenaming, setIsRenaming] = useState(false);
    const [tempName, setTempName] = useState(label);

    const saveRename = () => {
        if (tempName.trim() && onRename) onRename(tempName.trim());
        setIsRenaming(false);
        setIsMenuOpen(false);
    };

    return (
        <div
            className="flex items-center justify-between h-full px-2 py-2 border-r border-transparent hover:border-white/10 relative group select-none transition-colors hover:bg-white/5"
            style={{ width }}
        >
            <div className="flex items-center gap-2 overflow-hidden flex-1">
                <span className="text-gray-500">{icon}</span>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider truncate flex-1">{label}</span>
            </div>

            {/* Menu Trigger */}
            <button
                ref={triggerRef}
                onClick={toggleMenu}
                className={`opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 transition-all ${isMenuOpen ? 'opacity-100 bg-white/10' : ''}`}
            >
                <MoreHorizontal size={14} className="text-gray-400" />
            </button>

            {/* Menu Popover */}
            {isMenuOpen && triggerRect && (
                <FixedPopover triggerRect={triggerRect} onClose={() => { setIsMenuOpen(false); setIsRenaming(false); }}>
                    <div className="w-56 bg-aura-gray border border-white/10 rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 text-xs">

                        {/* Rename Section */}
                        {isRenaming ? (
                            <div className="p-2 bg-white/5 rounded-lg mb-1">
                                <input
                                    value={tempName}
                                    onChange={e => setTempName(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded p-1.5 text-white mb-2"
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button onClick={saveRename} className="flex-1 bg-aura-accent text-black py-1 rounded font-bold">Guardar</button>
                                    <button onClick={() => setIsRenaming(false)} className="flex-1 bg-white/5 text-gray-400 py-1 rounded">Cancelar</button>
                                </div>
                            </div>
                        ) : onRename && (
                            <button onClick={(e) => { e.stopPropagation(); setIsRenaming(true); }} className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/5 rounded-lg w-full text-left text-gray-300">
                                <Edit3 size={14} /> Renombrar
                            </button>
                        )}

                        <button onClick={() => { onHide(); setIsMenuOpen(false); }} className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/5 rounded-lg w-full text-left text-gray-300">
                            <EyeOff size={14} /> Ocultar columna
                        </button>

                        {onDelete && (
                            <>
                                <div className="h-px bg-white/10 my-0.5"></div>
                                <button onClick={() => { onDelete(); setIsMenuOpen(false); }} className="flex items-center gap-2 px-2 py-1.5 hover:bg-red-500/20 text-red-400 rounded-lg w-full text-left">
                                    <Trash2 size={14} /> Eliminar campo
                                </button>
                            </>
                        )}
                    </div>
                </FixedPopover>
            )}

            {/* Resizer Handle */}
            <div
                onMouseDown={handleMouseDown}
                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-aura-accent/50 z-10"
            />
        </div>
    );
};
