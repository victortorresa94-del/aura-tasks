
import { GoogleGenAI, Type } from '@google/genai';
import { Note, AiJob } from '../types';
import { notesRepo, aiJobsRepo } from '../firebase/repositories';

// --- CONFIGURATION ---
const API_KEY = process.env.API_KEY || (import.meta as any).env?.VITE_GOOGLE_API_KEY || '';

// --- PROMPTS ---
const SYSTEM_PROMPT = `
Eres Aura, un asistente de organización personal.
Tu tarea es transformar información (transcripciones, notas o prompts) en documentos claros, accionables y bien estructurados.

Reglas:
- No inventes datos que no existan en el input.
- Si hay ambigüedad, elige la opción más neutral.
- Escribe en español neutro (salvo que el usuario pida otro idioma).
- Evita relleno, frases vacías o motivación falsa.
- Prioriza claridad, utilidad y estructura.
- Si el contenido es largo, organiza con headings y bullets.
- Si el usuario pide "bullet points", responde con bullets limpios y compactos.
- Incluye sección "Acciones sugeridas" solo si hay acciones reales en el texto.
- Incluye sección "Citas destacadas" solo si el input tiene frases citables.

Salida: siempre en Markdown limpio.
`;

const OUTPUT_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        summary: { type: Type.STRING },
        keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
        actions: { type: Type.ARRAY, items: { type: Type.STRING } },
        quotes: { type: Type.ARRAY, items: { type: Type.STRING } },
        documentMarkdown: { type: Type.STRING },
        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        confidenceScore: { type: Type.NUMBER }
    },
    required: ['title', 'summary', 'documentMarkdown', 'confidenceScore']
};

const TEMPLATES: Record<string, string> = {
    'Resumen ejecutivo': `Genera un resumen ejecutivo:
- 1 párrafo resumen
- 5-10 bullets clave
- 3 acciones máximas`,
    'Bullet points accionables': `Genera bullets directos y accionables. Sin texto de relleno. Separa ideas y acciones.`,
    'Notas tipo Notion': `Estructura como notas de Notion: Headings H2/H3, bullets por sección, tono neutro.`,
    'Checklist': `Genera una lista de tareas en formato checkbox markdown. Orden lógico. Agrupa por fases.`,
    'Guía paso a paso': `Genera pasos numerados, sub-bullets y ejemplos si existen en la fuente.`,
    'Q&A': `Genera 5-10 preguntas y respuestas cortas y claras basadas solo en la info del input.`
};

export interface AiGenerationResult {
    doc: any; // The JSON parsed result
    jobId: string;
}

export class AIService {
    private client: GoogleGenAI;
    private apiKey: string;

    constructor() {
        this.apiKey = API_KEY;
        if (!this.apiKey) console.warn("Google API Key missing in AIService");
        // Using Type Assertion to bypass strict check if needed, but standard init is new GoogleGenAI({ apiKey })
        this.client = new GoogleGenAI({ apiKey: this.apiKey });
    }

    // --- PUBLIC METHODS ---

    async createDocFromTopic(
        ownerId: string,
        topic: string,
        options: { template: string, length: string, prompt?: string }
    ): Promise<AiGenerationResult> {

        // 1. Create Job
        const job = await this.createJob(ownerId, 'topic_to_doc', {
            userPrompt: topic,
            template: options.template,
            length: options.length
        });

        try {
            // 2. Build Prompt
            const fullPrompt = `${SYSTEM_PROMPT}
            
            TEMA: "${topic}"
            PLANTILLA: ${TEMPLATES[options.template] || options.template}
            LONGITUD: ${options.length}
            EXTRAS: ${options.prompt || 'Sin instrucciones extra'}
            
            Genera el documento siguiendo el esquema JSON.`;

            // 3. Call AI
            const result = await this.generateContent(fullPrompt);

            // 4. Update Job & Result
            await this.completeJob(ownerId, job.id, result);
            return { doc: result, jobId: job.id };

        } catch (error: any) {
            await this.failJob(ownerId, job.id, error.message);
            throw error;
        }
    }

    async createDocFromVideo(
        ownerId: string,
        url: string,
        transcriptText: string,
        options: { template: string, length: string, prompt?: string, language?: string }
    ): Promise<AiGenerationResult> {

        // 1. Create Job
        const job = await this.createJob(ownerId, 'video_to_doc', {
            sourceUrl: url,
            template: options.template,
            length: options.length,
            userPrompt: options.prompt
        });

        try {
            // TODO: Chunking implementation for long transcripts would go here.

            const fullPrompt = `${SYSTEM_PROMPT}
            
            FUENTE: TRANSCRIPCIÓN DE VIDEO (${url})
            PLANTILLA: ${TEMPLATES[options.template] || options.template}
            LONGITUD: ${options.length}
            IDIOMA SALIDA: ${options.language || 'Auto'}
            EXTRAS: ${options.prompt || 'Sin instrucciones extra'}

            TRANSCRIPCIÓN:
            ${transcriptText.slice(0, 30000)} {/* Safety limit for V1 token context */}
            
            Genera el documento siguiendo el esquema JSON.`;

            const result = await this.generateContent(fullPrompt);
            await this.completeJob(ownerId, job.id, result);

            return { doc: result, jobId: job.id };

        } catch (error: any) {
            await this.failJob(ownerId, job.id, error.message);
            throw error;
        }
    }

    async mergeNotes(
        ownerId: string,
        notes: Note[],
        options: { template: string, prompt?: string }
    ): Promise<AiGenerationResult> {

        const job = await this.createJob(ownerId, 'merge_notes', {
            sourceNoteIds: notes.map(n => n.id),
            template: options.template,
            userPrompt: options.prompt
        });

        try {
            const combinedContent = notes.map(n => `--- NOTA: ${n.title} ---\n${n.content}\n`).join('\n');

            const fullPrompt = `${SYSTEM_PROMPT}
            
            TAREA: FUSIONAR NOTAS
            PLANTILLA: ${TEMPLATES[options.template] || options.template}
            EXTRAS: ${options.prompt || 'Sin instrucciones extra'}
            
            CONTENIDO A FUSIONAR:
            ${combinedContent.slice(0, 30000)}

            Genera una sección consolidada en documentMarkdown.`;

            const result = await this.generateContent(fullPrompt);
            await this.completeJob(ownerId, job.id, result);

            return { doc: result, jobId: job.id };

        } catch (error: any) {
            await this.failJob(ownerId, job.id, error.message);
            throw error;
        }
    }

    // --- PRIVATE HELPERS ---

    private async generateContent(prompt: string): Promise<any> {
        // @google/genai API usage
        try {
            const response = await this.client.models.generateContent({
                model: "gemini-1.5-flash",
                contents: [{ parts: [{ text: prompt }] }],
                config: {
                    responseMimeType: "application/json",
                    responseSchema: OUTPUT_SCHEMA
                }
            });

            // Handle response
            const text = typeof response.text === 'string' ? response.text :
                response.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

            return JSON.parse(text);
        } catch (e) {
            console.error("Gemini Generation Error:", e);
            throw new Error("Failed to generate content");
        }
    }

    private async createJob(ownerId: string, type: AiJob['type'], input: any): Promise<AiJob> {
        const job: AiJob = {
            id: crypto.randomUUID(),
            ownerId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            type,
            status: 'processing',
            input
        };
        try {
            await aiJobsRepo.create(ownerId, job);
        } catch (e) {
            console.warn("Failed to persist AI Job start", e);
        }
        return job;
    }

    private async completeJob(ownerId: string, jobId: string, result: any) {
        try {
            await aiJobsRepo.update(ownerId, jobId, {
                status: 'done',
                updatedAt: Date.now(),
                output: {
                    previewText: result.summary,
                    tokensUsed: 0
                }
            });
        } catch (e) {
            console.warn("Failed to persist AI Job completion", e);
        }
    }

    private async failJob(ownerId: string, jobId: string, message: string) {
        try {
            await aiJobsRepo.update(ownerId, jobId, {
                status: 'error',
                updatedAt: Date.now(),
                error: { message }
            });
        } catch (e) {
            console.warn("Failed to persist AI Job failure", e);
        }
    }
}

export const aiService = new AIService();


// --- LEGACY (Preserved for compatibility) ---
// Used by Nutrition Module
export const analyzeImageWithGemini = async (base64Image: string, mode: 'product' | 'recipe', apiKey: string) => {
    // Remove header if present (data:image/jpeg;base64,)
    const base64Data = base64Image.split(',')[1] || base64Image;

    const model = "gemini-1.5-flash"; // Agile model for vision
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    let promptText = "";
    if (mode === 'product') {
        promptText = `
      Analiza esta imagen de un producto (etiqueta, ticket o el producto en sí).
      Extrae la siguiente información en formato JSON estricto (sin bloques de código markdown):
      {
        "name": "Nombre descriptivo del producto",
        "category": "Una de: Frutas, Verduras, Carne, Pescado, Lácteos, Despensa, Limpieza, Higiene, Bebidas, Snacks, Otros",
        "supermarket": "Nombre del supermercado si es visible o deducible (ej: Mercadona, Carrefour), o vacío si no",
        "price": 0.00 (número estimado o detectado, usa 0 si no hay precio),
        "quantity": "Cantidad/Peso detectado (ej: 500g, 1L, 6 uds)"
      }
      Si no puedes detectar algún campo, usa valores razonables o vacíos.
    `;
    } else {
        promptText = `
      Analiza esta imagen (plato de comida o texto de receta).
      Extrae la información en formato JSON estricto (sin bloques de código markdown):
      {
        "name": "Nombre de la receta",
        "ingredients": ["lista", "de", "ingredientes", "con cantidades"],
        "instructions": ["paso 1", "paso 2"],
        "calories": 0 (estimación de calorias por ración),
        "portions": 2 (número de raciones estimadas)
      }
    `;
    }

    const payload = {
        contents: [{
            parts: [
                { text: promptText },
                { inline_data: { mime_type: "image/jpeg", data: base64Data } }
            ]
        }]
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textResponse) throw new Error("No response from AI");

        // Clean markdown code blocks if present
        const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanJson);

    } catch (error) {
        console.error("AI Analysis Failed:", error);
        throw error;
    }
};
