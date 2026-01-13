import React, { useState, useRef } from 'react';
import { Camera, X, Check, Loader2, ScanLine, Smartphone, AlertCircle } from 'lucide-react';
import { analyzeImageWithGemini } from '../../../services/aiService';

interface OCRScannerProps {
    onClose: () => void;
    onScanComplete: (data: any) => void;
    mode: 'product' | 'recipe';
}

export const OCRScanner: React.FC<OCRScannerProps> = ({ onClose, onScanComplete, mode }) => {
    const [image, setImage] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoadingImage, setIsLoadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsLoadingImage(true);
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setImage(reader.result);
                } else {
                    setError("Error de formato de imagen.");
                }
                setError(null);
                setIsLoadingImage(false);
            };
            reader.onerror = () => {
                setError("Error al leer la imagen. Intenta de nuevo.");
                setIsLoadingImage(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const processImage = async () => {
        if (!image) return;
        setIsScanning(true);
        setError(null);

        try {
            const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
            if (!apiKey) throw new Error("API Key de Google no configurada (.env.local)");

            const result = await analyzeImageWithGemini(image, mode, apiKey);
            onScanComplete(result);
            onClose();
        } catch (err: any) {
            console.error("Scan Error:", err);
            setError(err.message || "No se pudo analizar la imagen.");
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] bg-black text-white flex flex-col animate-fade-in touch-none">
            {/* Header */}
            <div className="p-4 flex justify-between items-center bg-white/5 border-b border-white/10 shrink-0">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <ScanLine className="text-aura-accent" /> Escáner AI ({mode === 'product' ? 'Producto' : 'Receta'})
                </h3>
                <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-gray-400 hover:text-white">
                    <X size={20} />
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                {error && (
                    <div className="absolute top-4 left-4 right-4 bg-red-500/20 border border-red-500/50 p-4 rounded-xl flex items-center gap-2 text-red-200 z-30 font-medium animate-fade-in">
                        <AlertCircle size={20} className="shrink-0" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                {isLoadingImage ? (
                    <div className="flex flex-col items-center justify-center gap-4 animate-fade-in">
                        <Loader2 size={48} className="text-aura-accent animate-spin" />
                        <p className="text-gray-400 font-medium">Procesando imagen...</p>
                    </div>
                ) : image ? (
                    <div className="relative w-full max-w-sm aspect-[3/4] bg-black rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl animate-fade-in">
                        <img src={image} alt="Preview" className="w-full h-full object-cover" />

                        {/* Scanning Overlay */}
                        {isScanning && (
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-aura-accent/20 blur-xl rounded-full animate-pulse"></div>
                                    <ScanLine size={48} className="text-aura-accent animate-spin-slow relative z-10" />
                                </div>
                                <p className="text-aura-accent font-bold mt-4 animate-pulse text-lg tracking-wide">Analizando con Gemini AI...</p>
                            </div>
                        )}

                        {/* Scan Line Animation */}
                        {isScanning && (
                            <div className="absolute top-0 left-0 w-full h-1 bg-aura-accent/80 shadow-[0_0_15px_rgba(212,225,87,0.8)] animate-scan-down z-10"></div>
                        )}
                    </div>
                ) : (
                    <div className="text-center space-y-6 max-w-xs animate-fade-in">
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-white/20 relative animate-pulse">
                            <Camera size={40} className="text-gray-500" />
                            <div className="absolute -bottom-2 -right-2 bg-aura-accent text-black p-2 rounded-full shadow-lg">
                                <Smartphone size={16} />
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-2">
                                {mode === 'product' ? 'Escanea un producto' : 'Escanea una receta'}
                            </h4>
                            <p className="text-sm text-gray-400 leading-relaxed">
                                {mode === 'product'
                                    ? 'Apunta a la etiqueta, código de barras o ticket de compra.'
                                    : 'Apunta al plato, menú o texto de la receta.'}
                            </p>
                        </div>
                    </div>
                )}

                <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    capture="environment"
                    onChange={handleFileChange}
                />
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-white/10 bg-[#121212] shrink-0 pb-safe z-40">
                {!image && !isLoadingImage ? (
                    <div className="grid grid-cols-1">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoadingImage}
                            className="py-4 bg-aura-accent text-black font-bold rounded-2xl hover:opacity-90 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(212,225,87,0.2)] text-lg transition-transform active:scale-95"
                        >
                            <Camera size={24} /> Abrir Cámara
                        </button>
                    </div>
                ) : image ? (
                    <div className="flex gap-4">
                        <button
                            onClick={() => { setImage(null); setError(null); }}
                            className="flex-1 py-4 text-gray-400 font-bold hover:bg-white/10 rounded-2xl transition-colors border border-white/10"
                            disabled={isScanning}
                        >
                            Reintentar
                        </button>
                        <button
                            onClick={processImage}
                            className="flex-[2] py-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-200 flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 disabled:opacity-70 disabled:scale-100"
                            disabled={isScanning}
                        >
                            {isScanning ? <Loader2 className="animate-spin" /> : <><Check size={20} /> Procesar</>}
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    );
};
