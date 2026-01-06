# Aura App

## Descripción
Aplicación de gestión de tareas y organización personal con capacidades de IA (Aura).

## Requisitos
- Node.js (v18 o superior recomendado)
- npm

## Instalación
1. Clona este repositorio o navega a la carpeta.
2. Instala las dependencias:
   ```bash
   npm install
   ```

## Ejecución en Desarrollo
Para iniciar el servidor de desarrollo local:
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:3000` (o el puerto que indique Vite).

## Construcción para Producción
Para compilar la aplicación para producción:
```bash
npm run build
```
Para previsualizar la build:
```bash
npm run preview
```

## Configuración de Entorno (IA)
Para habilitar las funciones de voz con Aura (Gemini Live), crea un archivo `.env.local` en la raíz del proyecto y añade tu API Key de Google Gemini:

```env
GEMINI_API_KEY=tu_api_key_aqui
```
Si no proporcionas una API Key, la aplicación funcionará en modo texto (IA simulada) y gestión de tareas, pero el modo de voz no estará disponible.

## Persistencia de Datos
Los datos se guardan automáticamente en el `localStorage` del navegador.
- Claves versionadas: `aura.tasks.v1`, `aura.notes.v1`, etc.
- Se incluye migración automática de estados de tareas anteriores.

## Estructura del Proyecto
- `/src`: Código fuente
  - `/components`: Componentes React reutilizables
  - `/views`: Vistas principales de la aplicación
  - `/utils`: Utilidades y lógica de negocio (almacenamiento, IA, NLP)
  - `/hooks`: Hooks personalizados (persistencia)
  - `/types`: Definiciones de tipos TypeScript
