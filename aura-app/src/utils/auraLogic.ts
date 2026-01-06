import { Task, TaskType, Priority, Contact, Transaction, Note } from '../types';

// Helper cleanup
const clean = (text: string) => text.trim();

// --- NLP DATE PARSING ENGINE ---
export const parseDateFromText = (input: string): { title: string, date: string | null } => {
  const lower = input.toLowerCase();
  const today = new Date();
  let targetDate: Date | null = null;
  let cleanTitle = input;

  // 1. "Mañana"
  if (/\b(?:para|el|de)?\s*mañana\b/i.test(lower)) {
    targetDate = new Date(today);
    targetDate.setDate(today.getDate() + 1);
    cleanTitle = cleanTitle.replace(/\b(?:para|el|de)?\s*mañana\b/gi, '');
  }
  // 2. "Hoy"
  else if (/\b(?:para|el|de)?\s*hoy\b/i.test(lower)) {
    targetDate = new Date(today);
    cleanTitle = cleanTitle.replace(/\b(?:para|el|de)?\s*hoy\b/gi, '');
  }
  // 3. Weekdays (e.g. "el lunes", "martes", "para el viernes")
  else {
    const days = ['domingo', 'lunes', 'martes', 'miercoles', 'miércoles', 'jueves', 'viernes', 'sabado', 'sábado'];
    // Matches "el lunes", "para el lunes", "lunes", etc.
    const dayRegex = new RegExp(`\\b(?:(el|para el|para)\\s+)?(${days.join('|')})\\b`, 'i');
    const match = lower.match(dayRegex);

    if (match) {
      const dayName = match[2].replace('á', 'a').replace('é', 'e');
      const dayIndex = days.indexOf(dayName); // 0 = sunday

      if (dayIndex !== -1) {
        const currentDay = today.getDay();
        let diff = dayIndex - currentDay;
        if (diff <= 0) diff += 7; // Next occurrence

        targetDate = new Date(today);
        targetDate.setDate(today.getDate() + diff);
        cleanTitle = cleanTitle.replace(match[0], '');
      }
    }
    // 4. Specific dates (e.g. "el 20 de octubre", "30 junio", "30/06")
    else {
      const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      // Matches: 20 de octubre, 20 octubre, 20/10
      const dateRegex = new RegExp(`\\b(\\d{1,2})\\s*(?:de|\\/)?\\s*(${months.join('|')}|\\d{1,2})\\b`, 'i');
      const dateMatch = lower.match(dateRegex);

      if (dateMatch) {
        // Full phrase match including preposition if present before
        // We construct a regex to catch "el 25 de junio" because dateMatch might only be "25 de junio"
        const fullPhraseRegex = new RegExp(`\\b(?:el|para el|para)?\\s*${dateMatch[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        const fullMatch = lower.match(fullPhraseRegex);

        const day = parseInt(dateMatch[1]);
        let month = -1;

        if (!isNaN(parseInt(dateMatch[2]))) {
          month = parseInt(dateMatch[2]) - 1; // 0-indexed
        } else {
          month = months.indexOf(dateMatch[2].toLowerCase());
        }

        if (month !== -1) {
          targetDate = new Date(today.getFullYear(), month, day);

          if (targetDate < new Date(today.setHours(0, 0, 0, 0))) {
            targetDate.setFullYear(today.getFullYear() + 1);
          }

          if (fullMatch) {
            cleanTitle = cleanTitle.replace(fullMatch[0], '');
          } else {
            cleanTitle = cleanTitle.replace(dateMatch[0], '');
          }
        }
      }
    }
  }

  // Final Cleanup
  cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();
  // Remove trailing prepositions often left behind
  cleanTitle = cleanTitle.replace(/\s+(el|para|en)$/i, '');

  return {
    title: cleanTitle,
    date: targetDate ? targetDate.toISOString().split('T')[0] : null
  };
};

export const parseCommand = (input: string): Partial<Task>[] => {
  const tasks: Partial<Task>[] = [];

  const items = input.split(/;|\s\/\s/);

  items.forEach(rawItem => {
    const { title, date } = parseDateFromText(rawItem);

    let type: TaskType = 'normal';
    const lower = title.toLowerCase();

    if (lower.includes('llamar') || lower.includes('teléfono')) type = 'call';
    else if (lower.includes('comprar') || lower.includes('ir a ')) type = 'shopping';
    else if (lower.includes('pagar') || lower.includes('factura')) type = 'payment';
    else if (lower.includes('email') || lower.includes('correo')) type = 'email';
    else if (lower.includes('concierto') || lower.includes('fiesta') || lower.includes('boda')) type = 'event';

    tasks.push({
      title: title,
      status: 'todo',
      date: date || new Date().toISOString().split('T')[0],
      type: type
    });
  });

  return tasks;
};

export const getDailyQuote = () => {
  const quotes = [
    { text: "Enfócate en ser productivo, no en estar ocupado.", author: "Tim Ferriss" },
    { text: "Tus metas son solo sueños hasta que les pones una fecha.", author: "Anon" },
    { text: "Lo que se mide, se mejora.", author: "Peter Drucker" }
  ];
  return quotes[Math.floor(Math.random() * quotes.length)];
};

export const generateTaskContext = (tasks: Task[], userName: string): string => {
  const today = new Date().toISOString().split('T')[0];
  const pending = tasks.filter(t => t.status !== 'done' && t.date === today);

  return `
    Eres Aura, el cerebro digital de ${userName}.
    ESTADO ACTUAL:
    - Tareas para hoy: ${pending.length}
    - Usuario: ${userName}
    
    CAPACIDADES:
    - Puedes gestionar el CRM (añadir contactos).
    - Puedes gestionar Finanzas (registrar gastos/ingresos).
    - Puedes planificar hábitos y proyectos.
    - Puedes redactar emails profesionales.
    
    TONO: Ejecutiva de alto nivel, directa y visionaria.
  `;
};

// DeepSeek API Implementation with History
export const processTextChat = async (input: string, history: { role: string, text: string }[], context: string, apiKey: string): Promise<string> => {
  if (!apiKey) return "Error: API Key no configurada.";

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
      ...pastMessages,
      { role: "user", content: input }
    ],
    temperature: 0.7
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
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
    return "Lo siento, tuve un problema al conectar con mi cerebro de texto.";
  }
};

export const getAuraResponse = (input: string, count: number) => "Hecho. Todo bajo control."; // Deprecated but kept for safety