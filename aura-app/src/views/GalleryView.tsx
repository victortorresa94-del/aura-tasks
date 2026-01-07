import React, { useState, useMemo, useEffect } from 'react';
import {
  HardDrive, File as FileIcon, Folder, FolderPlus,
  Cloud, ArrowLeft, MoreVertical, LayoutGrid, List as ListIcon,
  Search, Upload, Image as ImageIcon, FileText, Video,
  ChevronRight, Home, CheckCircle2, AlertCircle, RefreshCw, ExternalLink
} from 'lucide-react';
import { FileItem } from '../types';
import { loadGoogleScripts, handleAuthClick, listDriveFiles, mapMimeTypeToAuraType } from '../utils/googleIntegration';

interface GalleryViewProps {
  files: FileItem[];
  onCreateFile?: (file: FileItem) => void;
  onDeleteFile?: (id: string) => void;
  onUpdateFile?: (id: string, updates: Partial<FileItem>) => void;
}

const GalleryView: React.FC<GalleryViewProps> = ({ files, onCreateFile, onDeleteFile, onUpdateFile }) => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<'local' | 'google_drive'>('local');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Drive State
  const [isDriveReady, setIsDriveReady] = useState(false); // Scripts loaded
  const [isDriveConnected, setIsDriveConnected] = useState(false); // User logged in
  const [driveFiles, setDriveFiles] = useState<FileItem[]>([]);
  const [driveFolderStack, setDriveFolderStack] = useState<{ id: string, name: string }[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);

  const [search, setSearch] = useState('');
  const [draggedFileId, setDraggedFileId] = useState<string | null>(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    // Initialize Google Scripts
    loadGoogleScripts(() => {
      setIsDriveReady(true);
    });
  }, []);

  // --- ACTIONS ---

  const addFolder = () => {
    if (activeSource === 'google_drive') {
      alert("La creación de carpetas en Google Drive desde Aura está en desarrollo. Por favor crea la carpeta en Drive.");
      return;
    }
    const name = prompt("Nombre de la carpeta:");
    if (!name) return;

    const newFolder: FileItem = {
      id: Date.now().toString(),
      parentId: currentFolderId,
      name,
      type: 'folder',
      source: 'local', // Or 'aura'
      updatedAt: Date.now(),
      createdAt: Date.now(),
      ownerId: '' // Repo sets this
    };
    if (onCreateFile) onCreateFile(newFolder);
  };

  const uploadFile = () => {
    if (activeSource === 'google_drive') {
      window.open('https://drive.google.com', '_blank');
      return;
    }
    // Mock upload for local
    const types: ('image' | 'pdf' | 'doc')[] = ['image', 'pdf', 'doc'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    const newFile: FileItem = {
      id: Date.now().toString(),
      parentId: currentFolderId,
      name: `Archivo ${Math.floor(Math.random() * 100)}.${randomType === 'image' ? 'png' : randomType}`,
      type: randomType,
      source: 'local',
      size: `${(Math.random() * 5).toFixed(1)} MB`,
      updatedAt: Date.now(),
      createdAt: Date.now(),
      ownerId: ''
    };
    if (onCreateFile) onCreateFile(newFile);
  };

  // --- DRIVE INTEGRATION ---

  const connectDrive = () => {
    /* 
       Note: The user should configure CLIENT_ID in utils/googleIntegration.ts 
       For now, we just warn/prompt.
    */
    handleAuthClick((response) => {
      setIsDriveConnected(true);
      fetchDriveFiles('root');
    });
  };

  const fetchDriveFiles = async (folderId: string) => {
    setIsLoadingDrive(true);
    const files = await listDriveFiles(folderId);

    const mappedFiles: FileItem[] = files.map((f: any) => ({
      id: f.id,
      parentId: folderId === 'root' ? null : folderId,
      name: f.name,
      type: mapMimeTypeToAuraType(f.mimeType),
      source: 'google_drive',
      size: f.size ? `${(parseInt(f.size) / 1024 / 1024).toFixed(2)} MB` : '-',
      url: f.webViewLink,
      thumbnail: f.thumbnailLink,
      updatedAt: Date.now()
    }));

    setDriveFiles(mappedFiles);
    setIsLoadingDrive(false);
  };

  const handleDriveFolderClick = (folderId: string, folderName: string) => {
    setDriveFolderStack(prev => [...prev, { id: folderId, name: folderName }]);
    fetchDriveFiles(folderId);
  };

  const handleDriveBack = () => {
    const newStack = [...driveFolderStack];
    newStack.pop();
    setDriveFolderStack(newStack);
    const parent = newStack.length > 0 ? newStack[newStack.length - 1].id : 'root';
    fetchDriveFiles(parent);
  };

  // --- DRAG AND DROP HANDLERS ---

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedFileId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    if (!draggedFileId) return;
    if (activeSource === 'google_drive') return; // Read only for now

    if (onUpdateFile) onUpdateFile(draggedFileId, { parentId: targetFolderId });
    setDraggedFileId(null);
  };

  // --- NAVIGATION HELPERS ---

  const currentFiles = useMemo(() => {
    if (activeSource === 'google_drive') {
      return driveFiles;
    }
    return files
      .filter(f => f.source === 'local')
      .filter(f => f.parentId === currentFolderId)
      .filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
      });
  }, [files, currentFolderId, activeSource, search, driveFiles]);

  const breadcrumbs = useMemo(() => {
    if (activeSource === 'google_drive') {
      return driveFolderStack;
    }
    const crumbs = [];
    let currId = currentFolderId;
    while (currId) {
      const folder = files.find(f => f.id === currId);
      if (folder) {
        crumbs.unshift(folder);
        currId = folder.parentId;
      } else {
        break;
      }
    }
    return crumbs;
  }, [currentFolderId, files, activeSource, driveFolderStack]);

  // --- RENDERERS ---

  const getIcon = (type: string, url?: string) => {
    switch (type) {
      case 'folder': return <Folder className="text-indigo-500 fill-indigo-100" size={activeSource === 'google_drive' ? 24 : 32} />;
      case 'image': return <ImageIcon className="text-purple-500" size={24} />;
      case 'pdf': return <FileText className="text-red-500" size={24} />;
      case 'doc': return <FileText className="text-blue-500" size={24} />;
      case 'sheet': return <FileText className="text-emerald-600" size={24} />;
      case 'slide': return <FileText className="text-orange-500" size={24} />;
      case 'video': return <Video className="text-pink-500" size={24} />;
      default: return <FileIcon className="text-gray-400" size={24} />;
    }
  };

  const hasClientId = () => {
    // Basic check if helper exists or just assume for UI logic if needed
    // Ideally import { hasGoogleConfig } from utils/googleIntegration
    // But for now let's simplify logic or assume true for UI demo
    return true;
  };

  return (
    <div className="flex h-full bg-aura-black relative overflow-hidden">

      {/* SIDEBAR */}
      <div className="w-20 md:w-64 bg-aura-black border-r border-white/5 flex flex-col shrink-0">
        <div className="p-4 md:p-6">
          <h2 className="hidden md:block text-xl font-bold text-aura-white mb-6">Archivos</h2>
          <div className="space-y-2">
            <button
              onClick={() => { setActiveSource('local'); setCurrentFolderId(null); }}
              className={`w-full flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-xl transition-all ${activeSource === 'local' ? 'bg-aura-accent text-aura-black shadow-md font-bold' : 'text-gray-400 hover:bg-white/5'}`}
            >
              <HardDrive size={20} />
              <span className="hidden md:inline">Mis Archivos</span>
            </button>

            <button
              onClick={() => { setActiveSource('google_drive'); }}
              className={`w-full flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-xl transition-all ${activeSource === 'google_drive' ? 'bg-blue-600 text-white shadow-md font-bold' : 'text-gray-400 hover:bg-white/5'}`}
            >
              <Cloud size={20} />
              <span className="hidden md:inline">Google Drive</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Drive Not Connected State */}
        {activeSource === 'google_drive' && !isDriveConnected ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in-up bg-aura-black">
            <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 border border-blue-500/20">
              <Cloud size={48} className="text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-aura-white mb-2">Conecta Google Drive</h3>
            <p className="text-gray-400 max-w-sm mb-8">
              {hasClientId()
                ? "Accede a tus documentos reales usando la API de Google Drive."
                : "⚠️ Configuración requerida: Necesitas un CLIENT_ID de Google Cloud."}
            </p>

            <button
              onClick={connectDrive}
              disabled={!isDriveReady}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" className="w-5 h-5 bg-white rounded-full p-0.5" alt="Drive" />
              {isDriveReady ? 'Vincular Cuenta' : 'Cargando API...'}
            </button>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-6 shrink-0 bg-aura-black/50 backdrop-blur-md">
              {/* Breadcrumbs */}
              <div className="flex items-center gap-1 text-sm text-gray-500 overflow-hidden">
                <button
                  onClick={() => {
                    if (activeSource === 'google_drive') {
                      // Reset drive stack
                      setDriveFolderStack([]);
                      fetchDriveFiles('root');
                    } else {
                      if (draggedFileId) handleDrop({ preventDefault: () => { } } as any, null);
                      setCurrentFolderId(null);
                    }
                  }}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, null)}
                  className="hover:bg-white/5 p-1.5 rounded-lg transition-colors flex items-center gap-1 text-gray-400 hover:text-aura-white"
                >
                  <Home size={16} />
                </button>

                {/* Dynamic Breadcrumbs */}
                {breadcrumbs.map((crumb: any, idx) => (
                  <div key={crumb.id} className="flex items-center gap-1">
                    <ChevronRight size={14} className="text-gray-300" />
                    <button
                      onClick={() => {
                        if (activeSource === 'google_drive') {
                          // Logic to jump back in stack
                          const newStack = driveFolderStack.slice(0, idx + 1);
                          setDriveFolderStack(newStack);
                          fetchDriveFiles(crumb.id);
                        } else {
                          setCurrentFolderId(crumb.id);
                        }
                      }}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, crumb.id)}
                      className={`hover:bg-white/10 px-2 py-1 rounded-lg transition-colors max-w-[100px] truncate ${idx === breadcrumbs.length - 1 ? 'font-bold text-aura-white' : 'text-gray-400'}`}
                    >
                      {crumb.name}
                    </button>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <div className="relative hidden md:block">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar..."
                    className="pl-9 pr-3 py-1.5 bg-aura-gray/20 border-white/5 border rounded-lg text-sm text-aura-white focus:ring-1 focus:ring-aura-accent w-40 transition-all focus:w-60 placeholder:text-gray-600"
                  />
                </div>
                <div className="h-6 w-px bg-white/10 mx-2"></div>
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-aura-accent/10 text-aura-accent' : 'text-gray-400 hover:text-aura-white'}`}>
                  <LayoutGrid size={18} />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-aura-accent/10 text-aura-accent' : 'text-gray-400 hover:text-aura-white'}`}>
                  <ListIcon size={18} />
                </button>
                <div className="h-6 w-px bg-gray-200 mx-2"></div>

                {activeSource === 'local' && (
                  <button onClick={addFolder} className="p-2 text-gray-400 hover:bg-white/10 rounded-lg hover:text-aura-white" title="Nueva Carpeta">
                    <FolderPlus size={20} />
                  </button>
                )}

                <button onClick={uploadFile} className="flex items-center gap-2 px-3 py-1.5 bg-aura-accent text-aura-black rounded-lg text-sm font-bold shadow-sm hover:bg-white transition-colors">
                  {activeSource === 'local' ? <Upload size={16} /> : <ExternalLink size={16} />}
                  <span className="hidden sm:inline">{activeSource === 'local' ? 'Subir' : 'Abrir Drive'}</span>
                </button>
              </div>
            </div>

            {/* File Area */}
            <div
              className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar relative bg-aura-black"
              onDragOver={handleDragOver}
              onDrop={(e) => {
                if (draggedFileId) {
                  const file = files.find(f => f.id === draggedFileId);
                  if (file && file.parentId !== currentFolderId && activeSource === 'local') {
                    handleDrop(e, currentFolderId);
                  }
                }
              }}
            >
              {isLoadingDrive && (
                <div className="absolute inset-0 bg-aura-black/80 z-10 flex items-center justify-center">
                  <RefreshCw className="animate-spin text-aura-accent" size={32} />
                </div>
              )}

              {currentFiles.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 pb-20">
                  <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-dashed border-white/10">
                    <Folder size={32} className="opacity-20" />
                  </div>
                  <p className="font-medium text-aura-white">Carpeta vacía</p>
                  <p className="text-xs mt-2 text-gray-500">
                    {activeSource === 'local' ? 'Arrastra archivos aquí' : 'No hay archivos en esta carpeta de Drive'}
                  </p>
                </div>
              ) : (
                <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4" : "space-y-2"}>
                  {currentFiles.map(file => (
                    <div
                      key={file.id}
                      draggable={activeSource === 'local'}
                      onDragStart={(e) => handleDragStart(e, file.id)}
                      onDragOver={(e) => file.type === 'folder' ? handleDragOver(e) : undefined}
                      onDrop={(e) => file.type === 'folder' ? handleDrop(e, file.id) : undefined}
                      onClick={() => {
                        if (file.type === 'folder') {
                          if (activeSource === 'google_drive') {
                            handleDriveFolderClick(file.id, file.name);
                          } else {
                            setCurrentFolderId(file.id);
                          }
                        } else if (file.url) {
                          window.open(file.url, '_blank');
                        }
                      }}
                      className={`
                          group relative border border-white/5 rounded-xl transition-all cursor-pointer select-none
                          ${viewMode === 'grid'
                          ? 'bg-aura-gray/20 p-4 hover:shadow-lg hover:border-aura-accent/30 flex flex-col aspect-[4/3] md:aspect-square'
                          : 'bg-aura-gray/10 px-4 py-3 flex items-center gap-4 hover:bg-white/5'
                        }
                          ${draggedFileId === file.id ? 'opacity-50 dashed border-2 border-aura-accent' : ''}
                        `}
                    >
                      {/* Grid View Content */}
                      {viewMode === 'grid' && (
                        <>
                          <div className="flex-1 flex items-center justify-center mb-2 relative">
                            {file.type === 'folder' && (
                              <div className={`absolute inset-0 bg-aura-accent/10 rounded-lg scale-0 group-hover:scale-110 transition-transform ${draggedFileId && draggedFileId !== file.id ? 'scale-110 bg-aura-accent/20 ring-2 ring-aura-accent/40' : ''}`}></div>
                            )}
                            <div className="relative z-10 transition-transform group-hover:scale-110">
                              {file.thumbnail ? (
                                <img src={file.thumbnail} className="w-full h-full object-contain rounded-md" alt="thumbnail" />
                              ) : getIcon(file.type)}
                            </div>
                          </div>
                          <div className="text-center relative z-10">
                            <p className="font-bold text-gray-300 text-sm truncate w-full group-hover:text-aura-white transition-colors">{file.name}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">{file.size || (file.type === 'folder' ? 'Carpeta' : '-')}</p>
                          </div>
                        </>
                      )}

                      {/* List View Content */}
                      {viewMode === 'list' && (
                        <>
                          <div className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-lg shrink-0">
                            {file.thumbnail ? (
                              <img src={file.thumbnail} className="w-full h-full object-cover rounded-md" alt="thumbnail" />
                            ) : getIcon(file.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-300 truncate group-hover:text-aura-white">{file.name}</p>
                          </div>
                          <div className="text-xs text-gray-500 w-24 text-right">
                            {file.size || '-'}
                          </div>
                        </>
                      )}

                      {/* Context Menu Trigger (Mock) */}
                      <button
                        onClick={(e) => { e.stopPropagation(); if (onDeleteFile) onDeleteFile(file.id); }}
                        className="absolute top-2 right-2 p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Eliminar"
                      >
                        <RefreshCw className="rotate-45" size={16} />{/* Using Refresh as X for now or just generic */}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GalleryView;