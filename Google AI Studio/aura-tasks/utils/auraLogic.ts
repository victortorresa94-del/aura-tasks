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
  if (/\bmañana\b/.test(lower)) {
    targetDate = new Date(today);
    targetDate.setDate(today.getDate() + 1);
    cleanTitle = input.replace(/\b(para|el|de)?\s*mañana\b/gi, '');
  }
  // 2. "Hoy"
  else if (/\bhoy\b/.test(lower)) {
    targetDate = new Date(today);
    cleanTitle = input.replace(/\b(para|el|de)?\s*hoy\b/gi, '');
  }
  // 3. Weekdays (e.g. "el lunes", "martes", "para el viernes")
  else {
    const days = ['domingo', 'lunes', 'martes', 'miercoles', 'miércoles', 'jueves', 'viernes', 'sabado', 'sábado'];
    // Changed regex to make preposition optional: matches "el lunes" or just "lunes"
    const dayRegex = new RegExp(`\\b(?:(el|para el|para)\\s+)?(${days.join('|')})\\b`, 'i');
    const match = lower.match(dayRegex);

    if (match) {
      // match[2] is the day name group
      const dayName = match[2].replace('á','a').replace('é','e');
      const dayIndex = days.indexOf(dayName); // 0 = sunday
      
      if (dayIndex !== -1) {
        const currentDay = today.getDay();
        let diff = dayIndex - currentDay;
        if (diff <= 0) diff += 7; // Next occurrence
        
        targetDate = new Date(today);
        targetDate.setDate(today.getDate() + diff);
        cleanTitle = input.replace(match[0], ''); // Remove the matched string from title
      }
    } 
    // 4. Specific dates (e.g. "el 20 de octubre", "30 junio", "30/06")
    else {
      // Matches: 20 de octubre, 20 octubre, 20/10
      const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      const dateRegex = new RegExp(`\\b(\\d{1,2})\\s*(?:de|\\/)?\\s*(${months.join('|')}|\\d{1,2})\\b`, 'i');
      const dateMatch = lower.match(dateRegex);

      if (dateMatch) {
        const day = parseInt(dateMatch[1]);
        let month = -1;

        // Check if month is number or text
        if (!isNaN(parseInt(dateMatch[2]))) {
           month = parseInt(dateMatch[2]) - 1; // 0-indexed
        } else {
           month = months.indexOf(dateMatch[2].toLowerCase());
        }

        if (month !== -1) {
          targetDate = new Date(today.getFullYear(), month, day);
          // If date passed, assume next year
          if (targetDate < today) {
            targetDate.setFullYear(today.getFullYear() + 1);
          }
          cleanTitle = input.replace(new RegExp(`\\b(el|para el|para)?\\s*${dateMatch[0]}\\b`, 'gi'), '');
        }
      }
    }
  }

  // Cleanup extra spaces and prepositions at end of string
  cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();
  // Remove trailing " el " or " para " if left hanging
  cleanTitle = cleanTitle.replace(/\s(el|para|en)$/i, '');

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
      
      // Basic type detection based on keywords
      let type: TaskType = 'normal';
      const lower = title.toLowerCase();
      
      if (lower.includes('llamar') || lower.includes('teléfono')) type = 'call';
      else if (lower.includes('comprar') || lower.includes('ir a ')) type = 'shopping';
      else if (lower.includes('pagar') || lower.includes('factura')) type = 'payment';
      else if (lower.includes('email') || lower.includes('correo')) type = 'email';
      else if (lower.includes('concierto') || lower.includes('fiesta') || lower.includes('boda')) type = 'event';

      tasks.push({ 
        title: title, 
        status: 'pendiente', 
        date: date || new Date().toISOString().split('T')[0], // Default to today if no date found
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
  const pending = tasks.filter(t => t.status !== 'completada' && t.date === today);
  
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

export const getAuraResponse = (input: string, count: number) => "Hecho. Todo bajo control.";