import React, { useState, useRef } from 'react';
import { Camera, X, Check, Loader2, ScanLine, Smartphone, AlertCircle } from 'lucide-react';
import { Product } from '../../../types/nutrition';
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
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Compress/Resize logic could go here to avoid payload limits
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
                setError(null);
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
            setError(err.message || "No se pudo analizar la imagen. Intenta de nuevo.");
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-md flex flex-col animate-fade-in">
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
            <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
                {error && (
                    <div className="absolute top-4 left-4 right-4 bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-2 text-red-200 z-20">
                        <AlertCircle size={20} />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                {image ? (
                    <div className="relative w-full max-w-sm aspect-[3/4] bg-black rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
                        <img src={image} alt="Preview" className="w-full h-full object-cover" />

                        {/* Scanning Overlay */}
                        {isScanning && (
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-aura-accent/20 blur-xl rounded-full animate-pulse"></div>
                                    <ScanLine size={48} className="text-aura-accent animate-spin-slow relative z-10" />
                                </div>
                                <p className="text-aura-accent font-bold mt-4 animate-pulse">Analizando con Gemini AI...</p>
                            </div>
                        )}

                        {/* Scan Line Animation */}
                        {isScanning && (
                            <div className="absolute top-0 left-0 w-full h-1 bg-aura-accent/80 shadow-[0_0_15px_rgba(212,225,87,0.8)] animate-scan-down"></div>
                        )}
                    </div>
                ) : (
                    <div className="text-center space-y-6 max-w-xs">
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-white/20 relative">
                            <Camera size={40} className="text-gray-500" />
                            <div className="absolute -bottom-2 -right-2 bg-aura-accent text-black p-2 rounded-full">
                                <Smartphone size={16} />
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-white mb-2">
                                {mode === 'product' ? 'Escanea un producto' : 'Escanea una receta'}
                            </h4>
                            <p className="text-sm text-gray-400">
                                {mode === 'product'
                                    ? 'Foto a la etiqueta, código o ticket.'
                                    : 'Foto al plato o texto de la receta.'}
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
            <div className="p-6 border-t border-white/10 bg-[#121212] shrink-0 pb-safe">
                {!image ? (
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="col-span-2 py-4 bg-aura-accent text-black font-bold rounded-2xl hover:opacity-90 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,225,87,0.2)]"
                        >
                            <Camera size={20} /> Abrir Cámara
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-4">
                        <button
                            onClick={() => { setImage(null); setError(null); }}
                            className="flex-1 py-4 text-gray-400 font-bold hover:bg-white/5 rounded-2xl"
                            disabled={isScanning}
                        >
                            Reintentar
                        </button>
                        <button
                            onClick={processImage}
                            className="flex-1 py-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-200 flex items-center justify-center gap-2"
                            disabled={isScanning}
                        >
                            {isScanning ? <Loader2 className="animate-spin" /> : <><Check size={18} /> Procesar</>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
