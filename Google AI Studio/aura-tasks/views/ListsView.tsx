import React, { useState } from 'react';
import { Plus, Trash2, Edit2, GripVertical, Check, ArrowRight, FolderKanban } from 'lucide-react';
import { Project } from '../types';

interface ProjectsViewProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  onOpenProject: (projectId: string) => void;
}

const COLORS = [
  { name: 'Azul', value: 'text-blue-500' },
  { name: 'Rojo', value: 'text-red-500' },
  { name: 'Verde', value: 'text-green-500' },
  { name: 'Morado', value: 'text-purple-500' },
  { name: 'Naranja', value: 'text-orange-500' },
  { name: 'Rosa', value: 'text-pink-500' },
];

const ICONS = ['📝', '💼', '🛒', '🎵', '✈️', '🏠', '📚', '💪', '🎮', '💡'];

const ProjectsView: React.FC<ProjectsViewProps> = ({ projects, setProjects, onOpenProject }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(ICONS[0]);
  const [color, setColor] = useState(COLORS[0].value);

  const resetForm = () => {
    setName('');
    setIcon(ICONS[0]);
    setColor(COLORS[0].value);
    setIsCreating(false);
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;

    if (editingId) {
      setProjects(prev => prev.map(l => l.id === editingId ? { ...l, name, icon, color } : l));
    } else {
      setProjects(prev => [...prev, {
        id: Date.now().toString(),
        name,
        icon,
        color
      }]);
    }
    resetForm();
  };

  const startEdit = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setName(project.name);
    setIcon(project.icon);
    setColor(project.color);
    setEditingId(project.id);
    setIsCreating(true);
  };

  const deleteProject = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('¿Estás seguro de eliminar este proyecto? Las tareas asociadas podrían perderse.')) {
      setProjects(prev => prev.filter(l => l.id !== id));
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in-up pb-24 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mis Proyectos</h2>
          <p className="text-gray-500 text-sm">Organiza tus tareas por áreas de vida o trabajo</p>
        </div>
        {!isCreating && (
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus size={18} /> Nuevo Proyecto
          </button>
        )}
      </div>

      {isCreating && (
        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-lg mb-8 animate-fade-in-up">
          <h3 className="font-bold text-gray-900 mb-4">{editingId ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Nombre</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Lanzamiento Web, Viaje a Japón..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Icono</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map(i => (
                    <button
                      key={i}
                      onClick={() => setIcon(i)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${icon === i ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'bg-gray-50 hover:bg-gray-100'}`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setColor(c.value)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${color === c.value ? 'border-gray-900 scale-110' : 'border-transparent hover:scale-105'}`}
                    >
                      <div className={`w-full h-full rounded-full ${c.value.replace('text-', 'bg-')}`}></div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
              <button onClick={resetForm} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button onClick={handleSubmit} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                {editingId ? 'Guardar Cambios' : 'Crear Proyecto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {projects.length === 0 && !isCreating && (
         <div className="text-center py-20 opacity-50">
            <FolderKanban size={64} className="mx-auto mb-4 text-gray-300" />
            <p>No tienes proyectos creados</p>
         </div>
      )}

      <div className="space-y-3">
        {projects.map((project) => (
          <div 
            key={project.id} 
            onClick={() => onOpenProject(project.id)}
            className="group flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer relative"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-gray-50 ${project.color}`}>
              {project.icon}
            </div>
            
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">{project.name}</h3>
              <p className="text-xs text-gray-400">Ver tareas</p>
            </div>

            <div className="flex gap-2">
               {/* Arrow indicating navigation */}
               <div className="p-2 text-gray-300 group-hover:text-indigo-600 transition-colors">
                  <ArrowRight size={20} />
               </div>

              {/* Edit Actions only visible on hover or if managing */}
              <div className="flex gap-1 border-l pl-2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => startEdit(e, project)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                    <Edit2 size={16} />
                </button>
                {projects.length > 1 && (
                    <button onClick={(e) => deleteProject(e, project.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 size={16} />
                    </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectsView;