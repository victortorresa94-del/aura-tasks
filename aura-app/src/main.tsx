import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// ⚠️ NO importamos AppWithAuth aquí estáticamente
// porque si falla su inicialización (ej: firebase config),
// crashea toda la app antes de que podamos mostrar el error.

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const init = async () => {
  try {
    console.log('🚀 Starting dynamic load...');

    // Importamos dinámicamente para atrapar errores de carga
    const { default: AppWithAuth } = await import('./AppWithAuth');

    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <AppWithAuth />
      </React.StrictMode>
    );
    console.log('✅ App loaded successfully');

  } catch (err: any) {
    console.error('💥 CRITICAL INIT ERROR:', err);

    // Pinta el error en la pantalla para que el usuario lo vea
    rootElement.innerHTML = `
            <div style="
                font-family: system-ui, -apple-system, sans-serif;
                height: 100vh;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                background: #fff5f5;
                color: #c53030;
                padding: 20px;
                text-align: center;
            ">
                <h1 style="margin-bottom: 20px;">⚠️ Error Crítico de Inicio</h1>
                <div style="
                    background: white;
                    padding: 20px;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    max-width: 600px;
                    width: 100%;
                    overflow: auto;
                    text-align: left;
                    border: 1px solid #fed7d7;
                ">
                    <p style="font-weight: bold; margin-bottom: 10px;">${err?.message || 'Error desconocido'}</p>
                    <pre style="
                        font-family: monospace;
                        font-size: 12px;
                        background: #f7fafc;
                        padding: 10px;
                        border-radius: 6px;
                    ">${err?.stack || ''}</pre>
                </div>
                <p style="margin-top: 20px; color: #4a5568;">
                   Revisa la consola del navegador (F12) para más detalles.
                </p>
                <button onclick="window.location.reload()" style="
                    margin-top: 20px;
                    padding: 10px 20px;
                    background: #c53030;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                ">
                    Reintentar
                </button>
            </div>
        `;
  }
};

init();