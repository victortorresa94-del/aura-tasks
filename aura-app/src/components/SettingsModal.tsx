import React, { useState } from 'react';
import { X, User, Mail, Image as ImageIcon, Check, Save, Flag, Plus, Trash2, GripVertical, Database, Download, Upload, AlertCircle, LogOut } from 'lucide-react';
import { storage as storageUtils } from '../utils/storage';
import { logout } from '../firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { User as UserType, TaskStatus } from '../types';

interface SettingsModalProps {
  user: UserType;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (user: UserType) => void;
  statuses?: TaskStatus[];
  // setStatuses?: ... REMOVED
  onCreateStatus?: (status: TaskStatus) => void;
  onUpdateStatus?: (id: string, updates: Partial<TaskStatus>) => void;
  onDeleteStatus?: (id: string) => void;
}

const COLORS = [
  'bg-gray-400', 'bg-red-500', 'bg-orange-500', 'bg-amber-400',
  'bg-green-500', 'bg-emerald-400', 'bg-teal-500', 'bg-cyan-500',
  'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500'
];

const SettingsModal: React.FC<SettingsModalProps> = ({ user, isOpen, onClose, onUpdateUser, statuses, onCreateStatus, onUpdateStatus, onDeleteStatus }) => {
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'statuses' | 'data'>('profile');
  const [formData, setFormData] = useState<UserType>(user);
  const [avatarType, setAvatarType] = useState<'emoji' | 'url'>((user.avatar.startsWith('http') || user.avatar.includes('/')) ? 'url' : 'emoji');
  const [loggingOut, setLoggingOut] = useState(false);

  // Status editing state
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [tempStatusName, setTempStatusName] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleLogout = async () => {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      setLoggingOut(true);
      console.log('🚪 Attempting to log out...');
      try {
        await logout();
        console.log('✅ Logout successful from Firebase');
        onClose();
        // React AuthContext should automatically switch to LoginView now
      } catch (error) {
        console.error('❌ Logout error:', error);
        alert('Error al cerrar sesión. Revisa la consola.');
      } finally {
        setLoggingOut(false);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authUser) return;

    try {
      setUploading(true);

      // 1. Upload to Firebase Storage
      const storageRef = ref(storage, `users/${authUser.uid}/avatar_${Date.now()}.jpg`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // 2. Update Firebase Auth Profile
      await updateProfile(authUser, { photoURL: downloadURL });

      // 3. Update Local State
      setFormData(prev => ({ ...prev, avatar: downloadURL }));
      onUpdateUser({ ...user, avatar: downloadURL });

      setAvatarType('url');

    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error al subir la imagen");
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      if (authUser && formData.name !== authUser.displayName) {
        await updateProfile(authUser, { displayName: formData.name });
      }
      onUpdateUser(formData);
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error al actualizar perfil");
    }
  };

  const handleAddStatus = () => {
    if (!onCreateStatus || !statuses) return;
    const newStatus: TaskStatus = {
      id: Date.now().toString(),
      name: 'Nuevo Estado',
      color: 'bg-gray-400',
      isCompleted: false,
      ownerId: user.id || 'guest', createdAt: Date.now(), updatedAt: Date.now() // Repo handles this but we provide full object
    };
    onCreateStatus(newStatus);
  };

  const handleDeleteStatus = (id: string) => {
    if (!onDeleteStatus || !statuses) return;
    if (statuses.length <= 1) return alert("Debes tener al menos un estado.");
    if (confirm("¿Eliminar estado? Las tareas en este estado podrían quedar huérfanas.")) {
      onDeleteStatus(id);
    }
  };

  const updateStatus = (id: string, updates: Partial<TaskStatus>) => {
    if (!onUpdateStatus) return;
    onUpdateStatus(id, updates);
  };

  const handleExport = () => {
    const data = storage.exportAll();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aura_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("ADVERTENCIA: Esto sobrescribirá todos tus datos actuales con los del archivo de respaldo. ¿Estás seguro?")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (storage.importAll(content)) {
        alert("Datos importados correctamente. La página se recargará.");
        window.location.reload();
      } else {
        alert("Error al importar el archivo. Verifica que sea un archivo de respaldo válido.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in-up">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with Tabs */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">Configuración</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex bg-gray-200/50 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'profile' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Perfil
            </button>
            <button
              onClick={() => setActiveTab('statuses')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'statuses' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Estados
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'data' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Datos
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">

          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center text-4xl relative group">
                  {avatarType === 'url' ? (
                    <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" onError={(e) => e.currentTarget.src = 'https://ui-avatars.com/api/?name=User'} />
                  ) : (
                    <span>{formData.avatar}</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <label className={`
                      flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all
                      ${uploading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}
                   `}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    <Upload size={14} />
                    {uploading ? 'Subiendo...' : 'Subir Foto'}
                  </label>

                  <button
                    onClick={() => { setAvatarType('emoji'); setFormData({ ...formData, avatar: '😎' }); }}
                    className="px-4 py-2 text-xs font-bold rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all"
                  >
                    Usar Emoji
                  </button>
                </div>

                <div className="w-full">
                  {avatarType === 'url' ? (
                    <div className="relative">
                      <ImageIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={formData.avatar}
                        onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                        placeholder="https://ejemplo.com/foto.jpg"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  ) : (
                    <div className="flex justify-center gap-2">
                      {['👨‍💻', '👩‍💻', '🚀', '⚡', '🐱', '🐶', '🦄'].map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => setFormData({ ...formData, avatar: emoji })}
                          className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center hover:bg-gray-100 transition-colors ${formData.avatar === emoji ? 'bg-indigo-50 ring-2 ring-indigo-200' : ''}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Nombre de Usuario</label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Correo Electrónico</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Logout Section */}
                {authUser && (
                  <div className="pt-4 border-t border-gray-100">
                    <div className="mb-3">
                      <p className="text-xs font-bold text-gray-500 uppercase">Cuenta</p>
                      <p className="text-sm text-gray-600 mt-1">{authUser.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <LogOut size={18} />
                      {loggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'statuses' && statuses && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">Define el flujo de trabajo de tus tareas.</p>
                <button onClick={handleAddStatus} className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-100 flex items-center gap-1">
                  <Plus size={12} /> Nuevo
                </button>
              </div>

              <div className="space-y-2">
                {statuses.map((status, idx) => (
                  <div key={status.id} className="flex items-center gap-2 p-2 border border-gray-100 rounded-xl hover:shadow-sm bg-white group">
                    <GripVertical size={16} className="text-gray-300 cursor-grab" />

                    {/* Color Picker Popover (Simplified) */}
                    <div className="relative group/color">
                      <div className={`w-6 h-6 rounded-full cursor-pointer ${status.color} border-2 border-white shadow-sm`}></div>
                      <div className="absolute top-full left-0 mt-2 bg-white shadow-xl rounded-lg p-2 grid grid-cols-4 gap-1 w-32 z-50 hidden group-hover/color:grid border border-gray-100">
                        {COLORS.map(c => (
                          <button key={c} onClick={() => updateStatus(status.id, { color: c })} className={`w-6 h-6 rounded-full ${c} hover:scale-110 transition-transform`}></button>
                        ))}
                      </div>
                    </div>

                    {/* Name Input */}
                    <input
                      value={status.name}
                      onChange={(e) => updateStatus(status.id, { name: e.target.value })}
                      className="flex-1 text-sm font-medium border-none focus:ring-0 bg-transparent px-2"
                    />

                    {/* Complete Checkbox */}
                    <label className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={status.isCompleted || false}
                        onChange={(e) => updateStatus(status.id, { isCompleted: e.target.checked })}
                        className="rounded border-gray-300 text-green-500 focus:ring-green-500"
                      />
                      Fin
                    </label>

                    <button onClick={() => handleDeleteStatus(status.id)} className="text-gray-300 hover:text-red-500 p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 text-blue-800">
                <Database className="shrink-0" size={24} />
                <div className="space-y-1">
                  <h3 className="font-bold text-sm">Sincronización manual</h3>
                  <p className="text-xs opacity-90 leading-relaxed">
                    Tus tareas se guardan en este dispositivo. Para moverlas, exporta el archivo y súbelo en tu otro dispositivo.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* EXPORT */}
                <button
                  onClick={handleExport}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-gray-100 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 transition-all group group"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                    <Download size={24} />
                  </div>
                  <div className="text-center">
                    <span className="block font-bold text-sm">Exportar Datos</span>
                    <span className="text-[10px] text-gray-400">Descargar copia de seguridad JSON</span>
                  </div>
                </button>

                {/* IMPORT */}
                <label
                  className="relative flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-dashed border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 transition-all cursor-pointer group"
                >
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                    <Upload size={24} />
                  </div>
                  <div className="text-center">
                    <span className="block font-bold text-sm">Importar Datos</span>
                    <span className="text-[10px] text-gray-400">Restaurar copia de seguridad JSON</span>
                  </div>
                </label>
              </div>

              <div className="flex bg-yellow-50 p-3 rounded-lg border border-yellow-100 items-start gap-2">
                <AlertCircle size={16} className="text-yellow-600 mt-0.5 shrink-0" />
                <p className="text-xs text-yellow-800">
                  <strong>Nota:</strong> Al importar, perderás los datos actuales de este dispositivo y se reemplazarán por los del archivo.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex gap-3 justify-end bg-gray-50/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Save size={16} />
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;