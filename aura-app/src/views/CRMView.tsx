import React, { useState } from 'react';
import {
  Phone, Mail, Plus, Search, MoreVertical, Send, UserPlus,
  Linkedin, MapPin, Briefcase, X, Camera, Globe, Link as LinkIcon
} from 'lucide-react';
import { Contact, Task, Note, FileItem, LinkedItem } from '../types';
import LinkManager from '../components/LinkManager';

interface CRMViewProps {
  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  // Linking Context
  tasks: Task[];
  notes: Note[];
  files: FileItem[];
  showToast?: (msg: string) => void;
}

const CRMView: React.FC<CRMViewProps> = ({ contacts, setContacts, tasks, notes, files, showToast }) => {
  const [search, setSearch] = useState('');
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Empty State for New Contact
  const emptyContact: Contact = {
    id: '',
    name: '',
    role: '',
    company: '',
    email: '',
    phone: '',
    avatar: '',
    linkedin: '',
    location: '',
    tags: [],
    notes: '',
    links: []
  };

  const handleSave = () => {
    if (!editingContact || !editingContact.name) return;

    if (editingContact.id) {
      setContacts(prev => prev.map(c => c.id === editingContact.id ? editingContact : c));
      if (showToast) showToast("Contacto actualizado");
    } else {
      setContacts(prev => [{ ...editingContact, id: Date.now().toString() }, ...prev]);
      if (showToast) showToast("Contacto creado");
    }
    setEditingContact(null);
  };

  const deleteContact = (id: string) => {
    if (confirm("¿Eliminar contacto?")) {
      setContacts(prev => prev.filter(c => c.id !== id));
      setEditingContact(null);
      if (showToast) showToast("Contacto eliminado");
    }
  };

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col p-4 md:p-8 space-y-6 overflow-y-auto custom-scrollbar bg-aura-black pb-32">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-aura-white">CRM</h2>
          <p className="text-sm text-gray-400">Gestiona tus relaciones profesionales</p>
        </div>
        <button
          onClick={() => setEditingContact({ ...emptyContact })}
          className="flex items-center gap-2 px-4 py-2 bg-aura-accent text-aura-black rounded-xl shadow-lg hover:bg-white transition-all font-medium"
        >
          <UserPlus size={18} /> <span className="hidden md:inline">Nuevo Contacto</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, empresa o cargo..."
          className="w-full pl-10 pr-4 py-3 bg-aura-gray/20 border border-white/10 rounded-2xl shadow-sm focus:ring-1 focus:ring-aura-accent outline-none text-aura-white placeholder:text-gray-500"
        />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(contact => (
          <div key={contact.id} className="bg-aura-gray/20 rounded-2xl border border-white/5 shadow-sm hover:shadow-lg hover:border-aura-accent/30 transition-all group relative overflow-hidden flex flex-col">
            {/* Banner decorative */}
            <div className="h-24 bg-gradient-to-r from-aura-gray to-aura-gray-light relative border-b border-white/5">
              <div className="absolute top-2 right-2 flex gap-1">
                {contact.linkedin && <a href={contact.linkedin} target="_blank" className="p-1.5 bg-black/20 hover:bg-black/40 rounded-lg text-gray-400 hover:text-white transition-colors"><Linkedin size={14} /></a>}
              </div>
            </div>

            <div className="px-5 pb-5 flex-1 flex flex-col">
              {/* Avatar & Header */}
              <div className="flex justify-between items-end -mt-12 mb-3">
                <div className="w-24 h-24 rounded-2xl bg-aura-black p-1.5 shadow-sm border border-white/10">
                  <img
                    src={contact.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=random`}
                    alt={contact.name}
                    className="w-full h-full rounded-xl object-cover bg-aura-gray"
                  />
                </div>
                <button onClick={() => setEditingContact(contact)} className="mb-1 p-2 text-gray-500 hover:text-aura-accent hover:bg-aura-gray/50 rounded-lg transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>

              <div className="mb-4">
                <h3 className="font-bold text-xl text-aura-white leading-tight mb-1">{contact.name}</h3>
                {contact.role && <p className="text-sm text-aura-accent font-bold">{contact.role}</p>}
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  {contact.company && <><Briefcase size={12} /> {contact.company}</>}
                  {contact.location && <><span className="mx-1 text-gray-600">•</span> <MapPin size={12} /> {contact.location}</>}
                </p>
              </div>

              {/* Tags & Links Count */}
              <div className="flex flex-wrap gap-2 mb-6">
                {contact.tags.map(tag => (
                  <span key={tag} className="text-[10px] bg-white/5 border border-white/10 text-gray-300 px-2 py-1 rounded-md font-medium uppercase tracking-wide">
                    {tag}
                  </span>
                ))}
                {contact.links && contact.links.length > 0 && (
                  <span className="text-[10px] bg-aura-accent/10 text-aura-accent px-2 py-1 rounded-md font-bold uppercase tracking-wide flex items-center gap-1 border border-aura-accent/20">
                    <LinkIcon size={10} /> {contact.links.length} Conexiones
                  </span>
                )}
              </div>

              {/* Actions Footer */}
              <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center gap-2">
                <div className="flex gap-2">
                  {contact.phone && <a href={`tel:${contact.phone}`} className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors border border-transparent hover:border-emerald-500/20"><Phone size={18} /></a>}
                  {contact.email && <a href={`mailto:${contact.email}`} className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors border border-transparent hover:border-blue-500/20"><Mail size={18} /></a>}
                </div>
                <button className="flex items-center gap-1.5 px-4 py-2 bg-aura-white text-aura-black rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors shadow-sm">
                  <Send size={12} /> Contactar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 opacity-40 animate-fade-in-up">
          <UserPlus size={64} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 text-lg font-medium">Tu agenda está vacía</p>
          <p className="text-sm text-gray-400">Añade contactos para potenciar tu red profesional.</p>
        </div>
      )}

      {/* --- EDIT / CREATE MODAL --- */}
      {editingContact && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-aura-black w-full h-[90vh] sm:h-auto sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-2xl overflow-hidden flex flex-col border border-white/10">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-aura-black sticky top-0 z-10">
              <h2 className="font-bold text-aura-white flex items-center gap-2">
                {editingContact.id ? 'Editar Contacto' : 'Nuevo Contacto'}
              </h2>
              <button onClick={() => setEditingContact(null)} className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-aura-black custom-scrollbar">
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                {/* Avatar Input */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-24 h-24 rounded-2xl bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden relative group cursor-pointer hover:border-aura-accent transition-colors">
                    {editingContact.avatar ? (
                      <img src={editingContact.avatar} className="w-full h-full object-cover" />
                    ) : (
                      <Camera size={24} className="text-gray-500 group-hover:text-aura-accent" />
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs text-center p-2 transition-opacity font-bold">
                      Pegar URL Imagen
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="URL de foto..."
                    value={editingContact.avatar || ''}
                    onChange={e => setEditingContact({ ...editingContact, avatar: e.target.value })}
                    className="text-xs border border-white/10 rounded-lg p-1 w-24 text-center bg-aura-gray/20 text-aura-white focus:ring-1 focus:ring-aura-accent outline-none"
                  />
                </div>

                {/* Main Info */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nombre Completo</label>
                    <input
                      value={editingContact.name}
                      onChange={e => setEditingContact({ ...editingContact, name: e.target.value })}
                      className="w-full border border-white/10 rounded-xl px-4 py-2.5 text-aura-white bg-aura-gray/20 focus:ring-1 focus:ring-aura-accent outline-none font-bold text-lg placeholder:text-gray-600"
                      placeholder="Ej: Ana García"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Cargo / Role</label>
                    <input
                      value={editingContact.role || ''}
                      onChange={e => setEditingContact({ ...editingContact, role: e.target.value })}
                      className="w-full border border-white/10 rounded-xl px-4 py-2 text-aura-white bg-aura-gray/20 focus:ring-1 focus:ring-aura-accent outline-none placeholder:text-gray-600"
                      placeholder="Ej: CEO"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Empresa</label>
                    <input
                      value={editingContact.company || ''}
                      onChange={e => setEditingContact({ ...editingContact, company: e.target.value })}
                      className="w-full border border-white/10 rounded-xl px-4 py-2 text-aura-white bg-aura-gray/20 focus:ring-1 focus:ring-aura-accent outline-none placeholder:text-gray-600"
                      placeholder="Ej: Tech Solutions"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-white/10 my-6" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block flex items-center gap-1"><Mail size={12} /> Email</label>
                  <input
                    value={editingContact.email}
                    onChange={e => setEditingContact({ ...editingContact, email: e.target.value })}
                    className="w-full border border-white/10 rounded-xl px-3 py-2 text-aura-white bg-aura-gray/20 focus:ring-1 focus:ring-aura-accent outline-none placeholder:text-gray-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block flex items-center gap-1"><Phone size={12} /> Teléfono</label>
                  <input
                    value={editingContact.phone}
                    onChange={e => setEditingContact({ ...editingContact, phone: e.target.value })}
                    className="w-full border border-white/10 rounded-xl px-3 py-2 text-aura-white bg-aura-gray/20 focus:ring-1 focus:ring-aura-accent outline-none placeholder:text-gray-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block flex items-center gap-1"><Linkedin size={12} /> LinkedIn URL</label>
                  <input
                    value={editingContact.linkedin || ''}
                    onChange={e => setEditingContact({ ...editingContact, linkedin: e.target.value })}
                    className="w-full border border-white/10 rounded-xl px-3 py-2 text-aura-white bg-aura-gray/20 focus:ring-1 focus:ring-aura-accent outline-none placeholder:text-gray-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block flex items-center gap-1"><MapPin size={12} /> Ubicación</label>
                  <input
                    value={editingContact.location || ''}
                    onChange={e => setEditingContact({ ...editingContact, location: e.target.value })}
                    className="w-full border border-white/10 rounded-xl px-3 py-2 text-aura-white bg-aura-gray/20 focus:ring-1 focus:ring-aura-accent outline-none placeholder:text-gray-600"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Notas Privadas</label>
                <textarea
                  value={editingContact.notes}
                  onChange={e => setEditingContact({ ...editingContact, notes: e.target.value })}
                  className="w-full border border-white/10 rounded-xl px-3 py-2 text-aura-white bg-aura-gray/20 focus:ring-1 focus:ring-aura-accent outline-none h-24 resize-none placeholder:text-gray-600"
                  placeholder="Detalles sobre reuniones, intereses, etc."
                />
              </div>

              {/* LINK MANAGER SECTION */}
              <div className="bg-aura-gray/30 p-5 rounded-2xl border border-white/5">
                <h3 className="text-xs font-bold text-aura-accent uppercase tracking-wider mb-3 flex items-center gap-2">
                  <LinkIcon size={12} /> Conexiones y Proyectos
                </h3>
                <LinkManager
                  currentLinks={editingContact.links || []}
                  onUpdateLinks={(links) => setEditingContact({ ...editingContact, links })}
                  tasks={tasks}
                  notes={notes}
                  contacts={contacts}
                  files={files}
                  excludeId={editingContact.id}
                />
              </div>
            </div>

            <div className="p-4 border-t border-white/10 flex justify-between bg-aura-black pb-safe sticky bottom-0 z-10">
              {editingContact.id ? (
                <button onClick={() => deleteContact(editingContact.id)} className="text-red-400 text-sm font-bold hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors">Eliminar</button>
              ) : <div></div>}

              <div className="flex gap-2">
                <button onClick={() => setEditingContact(null)} className="px-4 py-2 text-gray-400 hover:bg-white/5 rounded-xl transition-colors">Cancelar</button>
                <button onClick={handleSave} className="px-6 py-2 bg-aura-white text-aura-black font-bold rounded-xl shadow-md hover:bg-gray-200 transition-colors">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMView;