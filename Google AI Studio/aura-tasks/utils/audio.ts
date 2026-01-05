export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function pcm16ToFloat32(pcmData: Int16Array): Float32Array {
  const float32 = new Float32Array(pcmData.length);
  for (let i = 0; i < pcmData.length; i++) {
    float32[i] = pcmData[i] / 32768;
  }
  return float32;
}

export function float32ToPcm16(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16;
}

// Convert audio buffer to the correct format for the model (PCM 16kHz)
export function createPcmBlob(data: Float32Array): { data: string; mimeType: string } {
  const pcm16 = float32ToPcm16(data);
  // Manual base64 encoding for the Uint8Array buffer
  let binary = '';
  const bytes = new Uint8Array(pcm16.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  
  return {
    data: base64,
    mimeType: 'audio/pcm;rate=16000',
  };
}

export async function decodeAudioData(
  base64: string,
  ctx: AudioContext
): Promise<AudioBuffer> {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Raw PCM data handling
  const dataInt16 = new Int16Array(bytes.buffer);
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(1, frameCount, 24000); // Model output is usually 24kHz
  const channelData = buffer.getChannelData(0);
  
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  
  return buffer;
}