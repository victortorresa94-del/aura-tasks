# Configuración de Google Cloud para Aura

Para que Aura pueda acceder a Google Drive, Gmail y Calendar, necesitas configurar un proyecto en Google Cloud Platform (GCP). Sigue estos pasos:

## 1. Crear un Proyecto en Google Cloud
1.  Ve a [Google Cloud Console](https://console.cloud.google.com/).
2.  Haz clic en el selector de proyectos en la parte superior izquierda y selecciona "Nuevo proyecto".
3.  Ponle un nombre (ej. "Aura App") y haz clic en "Crear".

## 2. Habilitar APIs
Necesitamos habilitar las APIs de los servicios que vamos a usar.
1.  En el menú lateral, ve a **APIs y servicios > Biblioteca**.
2.  Busca y habilita las siguientes APIs (una por una):
    *   **Google Drive API**
    *   **Gmail API**
    *   **Google Calendar API**

## 3. Configurar Pantalla de Consentimiento OAuth
1.  Ve a **APIs y servicios > Pantalla de consentimiento de OAuth**.
2.  Selecciona **External** (Externo) y haz clic en "Crear".
3.  **Información de la aplicación**:
    *   Nombre de la app: Aura
    *   Correo de asistencia: Tu correo.
4.  **Información de contacto del desarrollador**: Tu correo.
5.  Haz clic en "Guardar y continuar".
6.  **Permisos (Scopes)**:
    *   Haz clic en "Agregar o quitar permisos".
    *   Busca y selecciona los siguientes:
        *   `.../auth/drive.readonly` (Ver archivos de Drive)
        *   `.../auth/gmail.readonly` (Ver correos)
        *   `.../auth/gmail.send` (Enviar correos)
        *   `.../auth/calendar` (Ver y editar calendarios)
    *   Haz clic en "Actualizar" y luego en "Guardar y continuar".
7.  **Usuarios de prueba**:
    *   Haz clic en "Add Users" e introduce tu propia dirección de correo (la que usarás para probar la app).
    *   Haz clic en "Guardar y continuar".

## 4. Crear Credenciales
1.  Ve a **APIs y servicios > Credenciales**.
2.  Haz clic en **+ CREAR CREDENCIALES** > **ID de cliente de OAuth**.
3.  **Tipo de aplicación**: Aplicación de página única (SPA).
4.  **Nombre**: "Cliente Aura Web".
5.  **Orígenes autorizados de JavaScript**:
    *   Agrega `http://localhost:5173`.
6.  **URI de redireccionamiento autorizados**:
    *   Agrega `http://localhost:5173`.
7.  Haz clic en "Crear".
8.  **¡IMPORTANTE!** Copia el **ID de cliente** (Client ID).

## 5. Crear API Key
1.  En la misma pantalla de Credenciales, haz clic en **+ CREAR CREDENCIALES** > **Clave de API**.
2.  Copia la clave generada.

## 6. Configurar Aura
Abre el archivo `.env.local` y añade:

```env
VITE_GOOGLE_CLIENT_ID=TU_CLIENT_ID_AQUI
VITE_GOOGLE_API_KEY=TU_API_KEY_AQUI
```

> [!NOTE]
> Reinicia el servidor (`npm run dev`) tras guardar el archivo.
