/**
 * File utilities for processing attachments in chat
 */

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const SUPPORTED_DOC_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'text/plain'
];

export const SUPPORTED_FILE_TYPES = [...SUPPORTED_IMAGE_TYPES, ...SUPPORTED_DOC_TYPES];

export interface ProcessedFile {
    id: string;
    name: string;
    size: number;
    type: 'image' | 'document';
    mimeType: string;
    data: string; // base64
    extractedText?: string;
}

/**
 * Validate file type and size
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
    if (file.size > MAX_FILE_SIZE) {
        return { valid: false, error: 'El archivo supera el límite de 50MB' };
    }

    if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
        return { valid: false, error: 'Tipo de archivo no soportado' };
    }

    return { valid: true };
}

/**
 * Convert file to base64
 */
export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix to get pure base64
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Extract text from PDF using pdf.js
 */
export async function extractTextFromPDF(file: File): Promise<string> {
    try {
        // Dynamic import to avoid bundling issues
        const pdfjsLib = await import('pdfjs-dist');

        // Set worker path
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n\n';
        }

        return fullText.trim();
    } catch (error) {
        console.error('Error extracting PDF text:', error);
        return '[Error al extraer texto del PDF]';
    }
}

/**
 * Extract text from Word document using mammoth
 */
export async function extractTextFromWord(file: File): Promise<string> {
    try {
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    } catch (error) {
        console.error('Error extracting Word text:', error);
        return '[Error al extraer texto del documento Word]';
    }
}

/**
 * Extract text from Excel using xlsx
 */
export async function extractTextFromExcel(file: File): Promise<string> {
    try {
        const XLSX = await import('xlsx');
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        let fullText = '';
        workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            const sheetText = XLSX.utils.sheet_to_txt(sheet);
            fullText += `=== ${sheetName} ===\n${sheetText}\n\n`;
        });

        return fullText.trim();
    } catch (error) {
        console.error('Error extracting Excel text:', error);
        return '[Error al extraer texto del archivo Excel]';
    }
}

/**
 * Extract text from plain text file
 */
export async function extractTextFromTxt(file: File): Promise<string> {
    return await file.text();
}

/**
 * Process uploaded file
 */
export async function processFile(file: File): Promise<ProcessedFile> {
    const validation = validateFile(file);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const base64Data = await fileToBase64(file);

    const isImage = SUPPORTED_IMAGE_TYPES.includes(file.type);

    let extractedText: string | undefined;

    if (!isImage) {
        // Extract text from document
        if (file.type === 'application/pdf') {
            extractedText = await extractTextFromPDF(file);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            extractedText = await extractTextFromWord(file);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            extractedText = await extractTextFromExcel(file);
        } else if (file.type === 'text/plain') {
            extractedText = await extractTextFromTxt(file);
        }
    }

    return {
        id,
        name: file.name,
        size: file.size,
        type: isImage ? 'image' : 'document',
        mimeType: file.type,
        data: base64Data,
        extractedText
    };
}
