import type { ChatMessage } from '../types';

/**
 * Process text chat with attachment support
 * Uses Gemini for image analysis, DeepSeek for text
 */
export async function processTextChatWithAttachments(
    input: string,
    history: ChatMessage[],
    context: string,
    deepseekKey: string,
    geminiKey: string
): Promise<string> {
    if (!deepseekKey) return "Error: API Key no configurada.";

    // Get the last user message (which may have attachments)
    const lastMessage = history[history.length - 1];
    const hasAttachments = lastMessage?.attachments && lastMessage.attachments.length > 0;

    // If there are image attachments, use Gemini Vision API
    if (hasAttachments) {
        const imageAttachments = lastMessage.attachments?.filter(a => a.type === 'image') || [];
        const documentAttachments = lastMessage.attachments?.filter(a => a.type === 'document') || [];

        if (imageAttachments.length > 0) {
            // Use Gemini for vision
            try {
                if (!geminiKey) {
                    return "Error: Gemini API Key no configurada para análisis de imágenes.";
                }

                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;

                // Build parts array with text and images
                const parts: any[] = [];

                // Add text prompt
                let promptText = input || "Analiza esta imagen";

                // Add extracted text from documents if any
                if (documentAttachments.length > 0) {
                    const docTexts = documentAttachments
                        .map(doc => `[Documento: ${doc.name}]\n${doc.extractedText}`)
                        .join('\n\n');
                    promptText += `\n\nDocumentos adjuntos:\n${docTexts}`;
                }

                parts.push({ text: promptText });

                // Add images
                imageAttachments.forEach(img => {
                    parts.push({
                        inline_data: {
                            mime_type: img.mimeType,
                            data: img.data
                        }
                    });
                });

                const payload = {
                    contents: [{
                        parts
                    }]
                };

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`Gemini Vision Error: ${response.status} ${errText}`);
                }

                const data = await response.json();
                return data.candidates?.[0]?.content?.parts?.[0]?.text || "No pude analizar la imagen.";

            } catch (error) {
                console.error("Gemini Vision Error", error);
                return `Error al procesar imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`;
            }
        }

        // If only documents, add extracted text to the prompt
        if (documentAttachments.length > 0) {
            const docTexts = documentAttachments
                .map(doc => `[Documento: ${doc.name}]\n${doc.extractedText}`)
                .join('\n\n');
            input = `${input}\n\nDocumentos adjuntos:\n${docTexts}`;
        }
    }

    // Use DeepSeek for text/documents
    const url = 'https://api.deepseek.com/chat/completions';

    // Format history for DeepSeek (last 10 messages max to save tokens)
    const recentHistory = history.slice(-10);
    const pastMessages = recentHistory.map(msg => ({
        role: msg.role === 'aura' ? 'assistant' : 'user',
        content: msg.text
    }));

    const payload = {
        model: "deepseek-chat",
        messages: [
            { role: "system", content: "Eres Aura, un asistente personal ejecutivo, eficiente y directo. Tus respuestas son breves y útiles. Actuas como el cerebro digital del usuario." },
            { role: "user", content: context },
            { role: "assistant", content: "Entendido. Soy Aura. ¿En qué puedo ayudarte hoy?" },
            ...pastMessages.slice(0, -1), // Exclude last message as we'll add it with attachments info
            { role: "user", content: input }
        ],
        temperature: 0.7
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${deepseekKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`DeepSeek Error: ${response.status} ${errText}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "No response details.";
    } catch (error) {
        console.error("DeepSeek Chat Error", error);
        return `Error: ${error instanceof Error ? error.message : 'Desconocido'}`;
    }
}
