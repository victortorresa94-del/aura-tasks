import React, { useState, useMemo } from 'react';
import { Link, Search, X, CheckSquare, StickyNote, User, File, Plus } from 'lucide-react';
import { LinkedItem, Task, Note, Contact, FileItem, EntityType } from '../types';

interface LinkManagerProps {
  currentLinks: LinkedItem[];
  onUpdateLinks: (newLinks: LinkedItem[]) => void;
  // All available data for search
  tasks: Task[];
  notes: Note[];
  contacts: Contact[];
  files: FileItem[];
  excludeId: string; // Don't link to self
}

const LinkManager: React.FC<LinkManagerProps> = ({
  currentLinks = [], onUpdateLinks, tasks, notes, contacts, files, excludeId
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const getIcon = (type: EntityType) => {
    switch (type) {
      case 'task': return <CheckSquare size={14} className="text-emerald-500" />;
      case 'note': return <StickyNote size={14} className="text-amber-500" />;
      case 'contact': return <User size={14} className="text-indigo-500" />;
      case 'file': return <File size={14} className="text-blue-500" />;
    }
  };

  // Combine all entities for search
  const allEntities = useMemo(() => {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();

    const results: LinkedItem[] = [
      ...tasks.map(t => ({ id: t.id, type: 'task' as EntityType, title: t.title, subtitle: t.date })),
      ...notes.map(n => ({ id: n.id, type: 'note' as EntityType, title: n.title || 'Nota sin título', subtitle: 'Página' })),
      ...contacts.map(c => ({ id: c.id, type: 'contact' as EntityType, title: c.name, subtitle: c.company })),
      ...files.map(f => ({ id: f.id, type: 'file' as EntityType, title: f.name, subtitle: f.type }))
    ];

    return results
      .filter(item => item.id !== excludeId) // Remove self
      .filter(item => !currentLinks.some(l => l.id === item.id)) // Remove already linked
      .filter(item => item.title.toLowerCase().includes(term));
  }, [searchTerm, tasks, notes, contacts, files, excludeId, currentLinks]);

  const addLink = (item: LinkedItem) => {
    onUpdateLinks([...currentLinks, item]);
    setSearchTerm('');
    setIsSearching(false);
  };

  const removeLink = (id: string) => {
    onUpdateLinks(currentLinks.filter(l => l.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
          <Link size={12} /> Conexiones ({currentLinks.length})
        </label>
        <button
          onClick={() => setIsSearching(!isSearching)}
          className="text-xs text-aura-accent hover:text-white font-bold flex items-center gap-1"
        >
          <Plus size={12} /> Añadir
        </button>
      </div>

      {isSearching && (
        <div className="relative animate-fade-in-up">
          <div className="flex items-center gap-2 bg-aura-gray/20 border border-aura-accent/30 rounded-lg px-2 py-1.5 focus-within:ring-1 focus-within:ring-aura-accent">
            <Search size={14} className="text-gray-500" />
            <input
              autoFocus
              className="bg-transparent border-none text-sm w-full focus:ring-0 p-0 placeholder:text-gray-600 text-aura-white"
              placeholder="Buscar tarea, nota, persona..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <button onClick={() => setIsSearching(false)}><X size={14} className="text-gray-500 hover:text-white" /></button>
          </div>

          {/* Dropdown Results */}
          {searchTerm && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-aura-black border border-white/10 shadow-xl rounded-lg max-h-48 overflow-y-auto z-50">
              {allEntities.length > 0 ? allEntities.map(item => (
                <button
                  key={item.id}
                  onClick={() => addLink(item)}
                  className="w-full text-left px-3 py-2 hover:bg-white/5 flex items-center gap-2 border-b border-white/5 last:border-0"
                >
                  {getIcon(item.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-aura-white truncate">{item.title}</p>
                    <p className="text-[10px] text-gray-400 truncate">{item.subtitle}</p>
                  </div>
                  <span className="text-xs text-aura-accent opacity-0 group-hover:opacity-100">Vincular</span>
                </button>
              )) : (
                <div className="p-3 text-xs text-gray-500 text-center">No se encontraron resultados</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Links List */}
      <div className="flex flex-wrap gap-2">
        {currentLinks.map(link => (
          <div key={link.id} className="group flex items-center gap-2 pl-2 pr-1 py-1 bg-aura-gray/20 border border-white/5 rounded-lg shadow-sm hover:border-aura-accent/30 transition-colors">
            {getIcon(link.type)}
            <span className="text-xs font-medium text-aura-white max-w-[150px] truncate">{link.title}</span>
            <button
              onClick={() => removeLink(link.id)}
              className="p-1 hover:bg-red-500/10 hover:text-red-400 rounded text-gray-500 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        {currentLinks.length === 0 && !isSearching && (
          <p className="text-xs text-gray-500 italic">Sin conexiones activas.</p>
        )}
      </div>
    </div>
  );
};

export default LinkManager;