
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
