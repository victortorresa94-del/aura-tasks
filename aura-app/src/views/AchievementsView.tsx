import React from 'react';
import { Trophy, Star, Zap, Target } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const data = [
  { name: 'L', tareas: 4 },
  { name: 'M', tareas: 7 },
  { name: 'X', tareas: 5 },
  { name: 'J', tareas: 8 },
  { name: 'V', tareas: 6 },
  { name: 'S', tareas: 3 },
  { name: 'D', tareas: 2 },
];

const AchievementsView = () => {
  return (
    <div className="p-6 space-y-6 animate-fade-in-up">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-indigo-100 font-medium mb-1">Nivel actual</p>
            <h2 className="text-3xl font-bold">Maestro Productivo</h2>
            <p className="text-sm text-indigo-100 mt-2 opacity-80">Has completado el 85% de tus tareas esta semana.</p>
          </div>
          <div className="bg-white/20 p-4 rounded-full backdrop-blur-md">
            <Trophy size={32} className="text-yellow-300" />
          </div>
        </div>
        <div className="mt-6">
          <div className="flex justify-between text-xs font-semibold uppercase tracking-wider mb-2 opacity-80">
            <span>Progreso al siguiente nivel</span>
            <span>850 / 1000 XP</span>
          </div>
          <div className="w-full bg-black/20 rounded-full h-2">
            <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '85%' }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Zap size={18} className="text-indigo-500" />
            Actividad Semanal
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="name" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: '#f3f4f6'}} 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="tareas" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Star size={18} className="text-yellow-500" />
            Insignias Recientes
          </h3>
          {[
            { title: 'Racha de 7 días', desc: 'Completaste tareas cada día', icon: '🔥', color: 'bg-orange-100 text-orange-600' },
            { title: 'Madrugador', desc: '5 tareas completadas antes de las 9AM', icon: '☀️', color: 'bg-yellow-100 text-yellow-600' },
            { title: 'Zen Master', desc: 'Buzón a cero el viernes', icon: '🧘', color: 'bg-emerald-100 text-emerald-600' }
          ].map((badge, idx) => (
            <div key={idx} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${badge.color}`}>
                {badge.icon}
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-sm">{badge.title}</h4>
                <p className="text-xs text-gray-500">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AchievementsView;
