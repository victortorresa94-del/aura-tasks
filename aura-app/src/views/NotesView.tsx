import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, ChevronRight, ChevronDown,
  Image as ImageIcon, Type, Heading1, Heading2, Heading3,
  CheckSquare, Trash2, GripVertical,
  ToggleRight, Quote, Info, X, Link, ArrowLeft, CheckCircle, Cloud,
  Maximize2, Minimize2, Save, FilePlus
} from 'lucide-react';
import { Note, NoteBlock, BlockType, Task, Contact, FileItem } from '../types';
import LinkManager from '../components/LinkManager';

interface NotesViewProps {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  initialSelectedNoteId?: string | null;
  tasks: Task[];
  contacts: Contact[];
  files: FileItem[];
  showToast?: (msg: string) => void;
}

const DEFAULT_COVER = "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1000&q=80";

// --- Recursive Sidebar Item ---
interface NoteTreeItemProps {
  note: Note;
  depth?: number;
  selectedNoteId: string | null;
  onSelect: (id: string) => void;
  onToggleExpand: (e: React.MouseEvent, note: Note) => void;
  onCreateNote: (parentId: string | null) => void;
  onDeleteNote: (e: React.MouseEvent, id: string) => void;
  getChildren: (parentId: string | null) => Note[];
}

const NoteTreeItem: React.FC<NoteTreeItemProps> = ({
  note, depth = 0, selectedNoteId, onSelect, onToggleExpand, onCreateNote, onDeleteNote, getChildren
}) => {
  const children = getChildren(note.id);
  const hasChildren = children.length > 0;
  const isSelected = selectedNoteId === note.id;

  return (
    <div className="select-none">
      <div
        onClick={() => onSelect(note.id)}
        className={`
          group flex items-center gap-2 py-2 px-3 mx-2 rounded-lg cursor-pointer transition-all duration-200 text-sm mb-0.5
          ${isSelected ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm' : 'hover:bg-gray-100 text-gray-600'}
        `}
        style={{ paddingLeft: `${depth * 12 + 12}px` }}
      >
        <div
          onClick={(e) => { e.stopPropagation(); hasChildren ? onToggleExpand(e, note) : null; }}
          className={`p-0.5 rounded hover:bg-gray-300/50 text-gray-400 transition-opacity ${hasChildren ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}
        >
          {note.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
        <span className="text-lg leading-none">{note.icon || '📄'}</span>
        <span className="truncate flex-1">{note.title || 'Sin título'}</span>

        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onCreateNote(note.id); }} className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-700" title="Nueva sub-página">
            <Plus size={14} />
          </button>
          <button onClick={(e) => onDeleteNote(e, note.id)} className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-red-500" title="Eliminar">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {note.expanded && children.map(child => (
        <NoteTreeItem
          key={child.id}
          note={child}
          depth={depth + 1}
          selectedNoteId={selectedNoteId}
          onSelect={onSelect}
          onToggleExpand={onToggleExpand}
          onCreateNote={onCreateNote}
          onDeleteNote={onDeleteNote}
          getChildren={getChildren}
        />
      ))}
    </div>
  );
};

// --- MAIN NOTES VIEW ---
const NotesView: React.FC<NotesViewProps> = ({ notes, setNotes, initialSelectedNoteId, tasks, contacts, files, showToast }) => {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(initialSelectedNoteId || null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const getNoteTree = (parentId: string | null = null) => {
    return notes.filter(n => (n.parentId || null) === parentId);
  };

  const createNote = (parentId: string | null = null) => {
    const newNote: Note = {
      id: Date.now().toString(),
      parentId,
      title: '',
      content: '',
      blocks: [{ id: Date.now().toString() + 'b', type: 'text', content: '' }],
      updatedAt: Date.now(),
      icon: '📄',
      coverImage: parentId ? undefined : DEFAULT_COVER,
      expanded: true,
      links: []
    };
    setNotes(prev => [...prev, newNote]);
    setSelectedNoteId(newNote.id);
    if (window.innerWidth < 768) {
      // On mobile, implicitly go to editor
    }
    if (showToast) showToast("Nueva nota creada");
  };

  const deleteNote = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('¿Estás seguro de eliminar esta página y todo su contenido?')) {
      setNotes(prev => prev.filter(n => n.id !== id && n.parentId !== id));
      if (selectedNoteId === id) setSelectedNoteId(null);
      if (showToast) showToast("Nota eliminada");
    }
  };

  const toggleExpand = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    setNotes(prev => prev.map(n => n.id === note.id ? { ...n, expanded: !n.expanded } : n));
  };

  const selectedNote = notes.find(n => n.id === selectedNoteId);

  return (
    <div className="flex h-full bg-white relative overflow-hidden">

      {/* SIDEBAR (List) */}
      <div
        className={`
          flex-col bg-gray-50/80 border-r border-gray-200 transition-all duration-300 h-full backdrop-blur-sm
          ${selectedNoteId ? 'hidden md:flex' : 'flex w-full'} 
          ${sidebarOpen ? 'md:w-[280px]' : 'md:w-0 md:opacity-0 md:overflow-hidden'}
        `}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-2 text-gray-800 font-bold">
            <span className="w-6 h-6 bg-indigo-600 text-white rounded-md text-xs flex items-center justify-center shadow-sm">N</span>
            <span>Mis Notas</span>
          </div>
          <button
            onClick={() => createNote(null)}
            className="flex items-center gap-1.5 px-2 py-1.5 bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 rounded-lg text-xs font-bold text-gray-600 transition-all shadow-sm"
          >
            <Plus size={14} /> Nueva
          </button>
        </div>

        {/* Note Tree */}
        <div className="flex-1 overflow-y-auto py-3 custom-scrollbar">
          {getNoteTree(null).map(note => (
            <NoteTreeItem
              key={note.id}
              note={note}
              selectedNoteId={selectedNoteId}
              onSelect={setSelectedNoteId}
              onToggleExpand={toggleExpand}
              onCreateNote={createNote}
              onDeleteNote={deleteNote}
              getChildren={getNoteTree}
            />
          ))}

          {/* Empty State in Sidebar */}
          {notes.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 text-center p-6 animate-fade-in-up">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-gray-100">
                <FilePlus size={32} className="text-indigo-200" />
              </div>
              <p className="text-sm font-medium mb-1 text-gray-900">Tu cuaderno está vacío</p>
              <p className="text-xs text-gray-500 mb-4">Empieza a organizar tus ideas hoy.</p>
              <button
                onClick={() => createNote(null)}
                className="text-white bg-indigo-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <Plus size={16} /> Crear primera nota
              </button>
            </div>
          )}
        </div>
      </div>

      {/* EDITOR AREA */}
      <div
        className={`
          flex-1 flex flex-col h-full bg-white relative transition-all duration-300
          ${selectedNoteId ? 'flex z-20 absolute inset-0 md:static' : 'hidden md:flex'}
        `}
      >
        {selectedNote ? (
          <Editor
            note={selectedNote}
            updateNote={(n) => setNotes(prev => prev.map(old => old.id === n.id ? n : old))}
            tasks={tasks} contacts={contacts} files={files} notes={notes}
            onBack={() => setSelectedNoteId(null)} // Mobile Back
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)} // Desktop Toggle
            isSidebarOpen={sidebarOpen}
            showToast={showToast}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30 p-8 text-center animate-fade-in-up">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-gray-100 transform rotate-3">
              <Type size={48} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Selecciona una página</h3>
            <p className="max-w-xs mx-auto mb-8 text-gray-500">Elige una nota del menú lateral para ver su contenido o crea una nueva.</p>

            <button
              onClick={() => createNote(null)}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 hover:border-indigo-400 text-gray-700 hover:text-indigo-600 rounded-xl font-bold transition-all shadow-sm hover:shadow-md"
            >
              <Plus size={20} /> Crear Nueva Nota
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- EDITOR COMPONENT ---
const Editor: React.FC<{
  note: Note,
  updateNote: (n: Note) => void,
  tasks: Task[], notes: Note[], contacts: Contact[], files: FileItem[],
  onBack: () => void,
  toggleSidebar: () => void,
  isSidebarOpen: boolean,
  showToast?: (msg: string) => void
}> = ({ note, updateNote, tasks, notes, contacts, files, onBack, toggleSidebar, isSidebarOpen, showToast }) => {
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showRelations, setShowRelations] = useState(false);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  // Auto-save simulation
  useEffect(() => {
    setSaveStatus('saving');
    const timer = setTimeout(() => setSaveStatus('saved'), 1000);
    return () => clearTimeout(timer);
  }, [note]);

  const handleManualSave = () => {
    setSaveStatus('saved');
    if (showToast) showToast("Nota guardada correctamente");
  };

  const updateBlock = (blockId: string, updates: Partial<NoteBlock>) => {
    const newBlocks = note.blocks.map(b => b.id === blockId ? { ...b, ...updates } : b);
    updateNote({ ...note, blocks: newBlocks });
  };

  const addBlock = (afterId: string, type: BlockType = 'text') => {
    const idx = note.blocks.findIndex(b => b.id === afterId);
    const newId = Date.now().toString();
    const newBlock: NoteBlock = { id: newId, type, content: '' };
    const newBlocks = [...note.blocks];
    newBlocks.splice(idx + 1, 0, newBlock);
    updateNote({ ...note, blocks: newBlocks });
    setFocusedBlockId(newId);
  };

  const removeBlock = (id: string) => {
    if (note.blocks.length <= 1) return;
    const idx = note.blocks.findIndex(b => b.id === id);
    if (idx > 0) setFocusedBlockId(note.blocks[idx - 1].id);
    updateNote({ ...note, blocks: note.blocks.filter(b => b.id !== id) });
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-white">

      {/* EDITOR TOOLBAR */}
      <div className="h-14 border-b border-gray-100 flex items-center justify-between px-3 md:px-6 sticky top-0 bg-white/90 backdrop-blur-md z-40 shrink-0">
        <div className="flex items-center gap-2">
          {/* Mobile Back Button */}
          <button onClick={onBack} className="md:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </button>

          {/* Desktop Sidebar Toggle */}
          <button onClick={toggleSidebar} className="hidden md:flex p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors" title={isSidebarOpen ? "Pantalla completa" : "Mostrar menú"}>
            {isSidebarOpen ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
          </button>

          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-gray-500 overflow-hidden ml-2">
            <span className="truncate font-medium text-gray-900 max-w-[150px] md:max-w-[300px]">{note.icon} {note.title || 'Sin título'}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-3">
          {/* Save Indicator / Button */}
          <button
            onClick={handleManualSave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-xs font-medium text-gray-500 hover:text-indigo-600"
            title="Guardar ahora"
          >
            {saveStatus === 'saved' ? (
              <CheckCircle size={14} className="text-emerald-500" />
            ) : (
              <Cloud size={14} className="text-indigo-500 animate-pulse" />
            )}
            <span className="hidden sm:inline">{saveStatus === 'saved' ? 'Guardado' : 'Guardando...'}</span>
          </button>

          <div className="h-4 w-px bg-gray-200 mx-1"></div>

          <button
            onClick={() => setShowRelations(!showRelations)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors ${showRelations ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
            title="Ver conexiones"
          >
            <Link size={14} />
            <span className="hidden sm:inline">{showRelations ? 'Ocultar' : 'Conexiones'}</span>
            {note.links && note.links.length > 0 && <span className="bg-indigo-600 text-white text-[9px] px-1.5 rounded-full">{note.links.length}</span>}
          </button>

          {/* Close / Back for mobile consistency */}
          <button className="md:hidden p-2 text-gray-400" onClick={onBack}><X size={20} /></button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden flex">
        {/* SCROLLABLE CONTENT AREA */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">

          {/* Cover Image */}
          <div className="group relative h-40 md:h-52 w-full bg-gray-50 shrink-0">
            {note.coverImage && <img src={note.coverImage} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" alt="Cover" />}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => {
                  const url = prompt("URL de la imagen:", note.coverImage);
                  if (url !== null) updateNote({ ...note, coverImage: url || undefined });
                }}
                className="bg-white/90 hover:bg-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm text-gray-700 backdrop-blur-sm transition-all"
              >
                {note.coverImage ? 'Cambiar portada' : 'Añadir portada'}
              </button>
            </div>
          </div>

          <div className="max-w-3xl mx-auto px-6 md:px-12 pb-32 -mt-12 relative z-10">
            {/* Icon */}
            <div className="relative inline-block group mb-6">
              <button
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="text-6xl md:text-7xl shadow-sm rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer select-none bg-white p-2 border border-transparent hover:border-gray-200"
              >
                {note.icon || '📄'}
              </button>
              {showIconPicker && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-2 grid grid-cols-5 gap-1 z-50 w-64 animate-fade-in-up">
                  {['📄', '💡', '🚀', '💻', '🎨', '📅', '✅', '🔥', '❤️', '⭐', '📁', '📊', '📝', '🏠', '✈️'].map(emoji => (
                    <button key={emoji} onClick={() => { updateNote({ ...note, icon: emoji }); setShowIconPicker(false); }} className="text-xl p-2 hover:bg-gray-100 rounded-lg">
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title */}
            <input
              value={note.title}
              onChange={(e) => updateNote({ ...note, title: e.target.value })}
              placeholder="Escribe un título..."
              className="w-full text-3xl md:text-5xl font-bold text-gray-900 placeholder:text-gray-300 border-none focus:ring-0 bg-transparent p-0 mb-8 leading-tight"
            />

            {/* Blocks */}
            <div className="space-y-1 min-h-[200px]" onClick={() => {
              // Focus last block if clicking empty space
              if (note.blocks.length > 0) {
                // This is a bit hacky to implement simply without refs to all blocks, 
                // but allows clicking below content to type
                const lastId = note.blocks[note.blocks.length - 1].id;
                // In a real app we'd use refs. Here we rely on the specific hint area below.
              }
            }}>
              {note.blocks.map((block, i) => (
                <Block
                  key={block.id}
                  block={block}
                  onUpdate={(updates) => updateBlock(block.id, updates)}
                  onEnter={() => addBlock(block.id)}
                  onDelete={() => removeBlock(block.id)}
                  isFirst={i === 0}
                  isFocused={focusedBlockId === block.id}
                  onFocus={() => setFocusedBlockId(block.id)}
                />
              ))}
            </div>

            {/* Add Block Hint at bottom */}
            <div
              className="h-32 flex items-center text-gray-300 hover:text-gray-400 cursor-text group"
              onClick={() => addBlock(note.blocks[note.blocks.length - 1].id)}
            >
              <span className="opacity-0 group-hover:opacity-100 text-sm transition-opacity">Haz clic aquí para seguir escribiendo...</span>
            </div>
          </div>
        </div>

        {/* Relations Sidebar (Right) */}
        {showRelations && (
          <div className="w-80 border-l border-gray-200 bg-gray-50/50 p-6 overflow-y-auto shadow-xl z-30 absolute right-0 top-0 bottom-0 md:static animate-fade-in-right backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900 flex items-center gap-2"><Link size={16} /> Conexiones</h3>
              <button onClick={() => setShowRelations(false)} className="p-1 hover:bg-gray-200 rounded text-gray-500"><X size={18} /></button>
            </div>

            <LinkManager
              currentLinks={note.links || []}
              onUpdateLinks={(links) => updateNote({ ...note, links })}
              tasks={tasks}
              notes={notes}
              contacts={contacts}
              files={files}
              excludeId={note.id}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// --- SINGLE BLOCK COMPONENT (Notion Style) ---
const Block: React.FC<{
  block: NoteBlock;
  onUpdate: (u: Partial<NoteBlock>) => void;
  onEnter: () => void;
  onDelete: () => void;
  isFirst: boolean;
  isFocused: boolean;
  onFocus: () => void;
}> = ({ block, onUpdate, onEnter, onDelete, isFirst, isFocused, onFocus }) => {
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFocused]);

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const val = e.currentTarget.value;
    if (val.endsWith('/') && !showSlashMenu) setShowSlashMenu(true);
    if (showSlashMenu && !val.includes('/')) setShowSlashMenu(false);
    onUpdate({ content: val });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (showSlashMenu) return;
      e.preventDefault();
      onEnter();
    }
    if (e.key === 'Backspace' && block.content === '' && !isFirst) {
      e.preventDefault();
      onDelete();
    }
    if (e.key === 'Escape' && showSlashMenu) setShowSlashMenu(false);
  };

  const selectType = (type: BlockType) => {
    onUpdate({ type, content: block.content.replace('/', '') });
    setShowSlashMenu(false);
    inputRef.current?.focus();
  };

  const commonClasses = "w-full bg-transparent border-none p-0 focus:ring-0 text-gray-800 resize-none overflow-hidden placeholder:text-gray-300";

  return (
    <div className="group relative pl-6 md:pl-0" onClick={onFocus}>
      {/* Visual Controls (Hover - Desktop) */}
      <div className="absolute left-[-2rem] top-1.5 opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center gap-1 hidden md:flex">
        <button className="text-gray-300 hover:text-gray-600 cursor-grab p-1 hover:bg-gray-100 rounded" title="Arrastrar (Próximamente)"><GripVertical size={14} /></button>
      </div>

      {/* Visual Controls (Mobile - Always visible slightly) */}
      <div className="absolute left-0 top-2 text-gray-300 md:hidden">
        <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
      </div>

      {/* Render Types */}
      {block.type === 'h1' && <input ref={inputRef as any} value={block.content} onChange={handleInput} onKeyDown={handleKeyDown} onFocus={onFocus} className={`${commonClasses} text-3xl font-bold mt-6 mb-2`} placeholder="Encabezado 1" />}
      {block.type === 'h2' && <input ref={inputRef as any} value={block.content} onChange={handleInput} onKeyDown={handleKeyDown} onFocus={onFocus} className={`${commonClasses} text-2xl font-bold mt-4 mb-2`} placeholder="Encabezado 2" />}
      {block.type === 'h3' && <input ref={inputRef as any} value={block.content} onChange={handleInput} onKeyDown={handleKeyDown} onFocus={onFocus} className={`${commonClasses} text-xl font-bold mt-3 mb-1`} placeholder="Encabezado 3" />}

      {block.type === 'checkbox' && (
        <div className="flex items-start gap-2 my-1">
          <button onClick={() => onUpdate({ checked: !block.checked })} className={`mt-1 flex-shrink-0 w-4 h-4 rounded border transition-colors flex items-center justify-center ${block.checked ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-400 hover:bg-gray-100'}`}>
            {block.checked && <CheckSquare size={10} />}
          </button>
          <textarea ref={inputRef as any} value={block.content} onChange={handleInput} onKeyDown={handleKeyDown} onFocus={onFocus} className={`${commonClasses} ${block.checked ? 'line-through text-gray-400' : ''}`} rows={1} placeholder="To-do" />
        </div>
      )}

      {block.type === 'toggle' && (
        <div className="flex items-center gap-2 my-1">
          <button onClick={() => onUpdate({ isOpen: !block.isOpen })} className="text-gray-500 hover:bg-gray-100 p-0.5 rounded transition-transform" style={{ transform: block.isOpen ? 'rotate(90deg)' : 'rotate(0)' }}><ChevronRight size={18} /></button>
          <input ref={inputRef as any} value={block.content} onChange={handleInput} onKeyDown={handleKeyDown} onFocus={onFocus} className={`${commonClasses} font-medium`} placeholder="Lista desplegable" />
        </div>
      )}

      {block.type === 'quote' && (
        <div className="flex gap-3 pl-4 border-l-4 border-gray-900 my-2">
          <Quote className="text-gray-900 flex-shrink-0 mt-1" size={16} />
          <textarea ref={inputRef as any} value={block.content} onChange={handleInput} onKeyDown={handleKeyDown} onFocus={onFocus} className={`${commonClasses} text-lg italic text-gray-700`} rows={1} placeholder="Escribe una cita..." />
        </div>
      )}

      {block.type === 'callout' && (
        <div className="flex gap-3 p-4 bg-gray-100 rounded-lg my-2 border border-gray-200">
          <Info className="text-gray-900 flex-shrink-0 mt-0.5" size={20} />
          <textarea ref={inputRef as any} value={block.content} onChange={handleInput} onKeyDown={handleKeyDown} onFocus={onFocus} className={`${commonClasses} bg-transparent font-medium`} rows={1} placeholder="Texto destacado..." />
        </div>
      )}

      {block.type === 'image' && (
        <div className="my-2">
          {block.content ? (
            <div className="relative group/img rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm">
              <img src={block.content} className="w-full max-h-[500px] object-contain" />
              <button onClick={() => onUpdate({ content: '' })} className="absolute top-2 right-2 bg-white/90 p-1.5 rounded text-red-500 opacity-0 group-hover/img:opacity-100 transition-opacity"><Trash2 size={16} /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 border-dashed text-gray-400">
              <ImageIcon size={18} />
              <input ref={inputRef as any} autoFocus className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-gray-400" placeholder="Pega URL de imagen..." value={block.content} onChange={handleInput} onKeyDown={handleKeyDown} onFocus={onFocus} />
            </div>
          )}
        </div>
      )}

      {block.type === 'text' && (
        <div className="flex items-center gap-2 py-1">
          <textarea ref={inputRef as any} value={block.content} onChange={handleInput} onKeyDown={handleKeyDown} onFocus={onFocus} className={`${commonClasses} leading-relaxed`} rows={1} placeholder='Escribe "/" para comandos...' onInput={(e) => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }} />
        </div>
      )}

      {/* Slash Menu */}
      {showSlashMenu && (
        <div className="absolute top-full left-0 z-50 mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-100 max-h-60 overflow-y-auto animate-fade-in-up">
          <div className="p-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Bloques básicos</div>
          {[
            { id: 'text', label: 'Texto', icon: <Type size={14} />, desc: 'Texto plano' },
            { id: 'h1', label: 'Encabezado 1', icon: <Heading1 size={14} />, desc: 'Título grande' },
            { id: 'h2', label: 'Encabezado 2', icon: <Heading2 size={14} />, desc: 'Título mediano' },
            { id: 'h3', label: 'Encabezado 3', icon: <Heading3 size={14} />, desc: 'Título pequeño' },
            { id: 'checkbox', label: 'Lista tareas', icon: <CheckSquare size={14} />, desc: 'Checkboxes' },
            { id: 'toggle', label: 'Desplegable', icon: <ToggleRight size={14} />, desc: 'Ocultar info' },
            { id: 'quote', label: 'Cita', icon: <Quote size={14} />, desc: 'Texto citado' },
            { id: 'callout', label: 'Destacado', icon: <Info size={14} />, desc: 'Resaltar texto' },
            { id: 'image', label: 'Imagen', icon: <ImageIcon size={14} />, desc: 'Subir o URL' },
          ].map(item => (
            <button key={item.id} onClick={() => selectType(item.id as BlockType)} className="w-full text-left px-3 py-2 hover:bg-indigo-50 flex items-center gap-3 transition-colors group/item">
              <div className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center bg-white text-gray-500 group-hover/item:text-indigo-600 group-hover/item:border-indigo-200">
                {item.icon}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800">{item.label}</div>
                <div className="text-[10px] text-gray-400">{item.desc}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesView;