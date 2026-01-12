import React from 'react';
import { CheckSquare, StickyNote, Users, BarChart3, Image as ImageIcon } from 'lucide-react';

interface BottomNavbarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const BottomNavbar: React.FC<BottomNavbarProps> = ({ activeSection, setActiveSection }) => {
  const navItems = [
    { id: 'tasks', label: 'Tareas', icon: <CheckSquare size={20} /> },
    { id: 'notes', label: 'Notas', icon: <StickyNote size={20} /> },
    { id: 'crm', label: 'CRM', icon: <Users size={20} /> },
    { id: 'planning', label: 'Plan', icon: <BarChart3 size={20} /> },
    { id: 'gallery', label: 'Archivos', icon: <ImageIcon size={20} /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0f1c23]/95 backdrop-blur-xl border-t border-white/10 px-2 pb-safe pt-1 z-50 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.5)] h-[70px] md:hidden">
      {navItems.map((item) => {
        const isActive = activeSection === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`relative flex flex-col items-center justify-center w-full h-full transition-all duration-300 group`}
          >
            <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-aura-accent text-aura-black' : 'text-gray-400 group-hover:text-white'}`}>
              {item.icon}
            </div>

            <span className={`text-[10px] font-medium mt-1 transition-all duration-300 ${isActive ? 'text-aura-accent translate-y-0 opacity-100' : 'text-gray-500 translate-y-1 opacity-0 hidden'}`}>
              {item.label}
            </span>

            {isActive && (
              <div className="absolute top-0 w-8 h-0.5 bg-aura-accent rounded-b-full shadow-[0_0_10px_rgba(212,225,87,0.5)]" />
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNavbar;