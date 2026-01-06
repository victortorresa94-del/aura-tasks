import React from 'react';
import { CheckSquare, StickyNote, Users, BarChart3, Image as ImageIcon } from 'lucide-react';

interface BottomNavbarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const BottomNavbar: React.FC<BottomNavbarProps> = ({ activeSection, setActiveSection }) => {
  const navItems = [
    { id: 'tasks', label: 'Tareas', icon: <CheckSquare size={24} /> },
    { id: 'notes', label: 'Notas', icon: <StickyNote size={24} /> },
    { id: 'crm', label: 'CRM', icon: <Users size={24} /> },
    { id: 'planning', label: 'Plan', icon: <BarChart3 size={24} /> },
    { id: 'gallery', label: 'Archivos', icon: <ImageIcon size={24} /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 px-4 pb-safe pt-1 z-50 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.03)] h-16 md:hidden">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveSection(item.id)}
          className="relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300 group min-w-[44px] min-h-[44px]"
        >
          <div className={`
             absolute inset-0 rounded-2xl transition-all duration-300
             ${activeSection === item.id ? 'bg-indigo-50 scale-100' : 'bg-transparent scale-0 group-hover:scale-75 group-hover:bg-gray-50'}
          `}></div>

          <div className={`relative z-10 transition-colors duration-300 ${activeSection === item.id ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
            {item.icon}
          </div>

          {activeSection === item.id && (
            <div className="absolute -bottom-1 w-1 h-1 bg-indigo-600 rounded-full animate-fade-in-up" />
          )}
        </button>
      ))}
    </nav>
  );
};

export default BottomNavbar;