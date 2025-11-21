
export const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const createWavHeader = (dataLength: number, sampleRate: number, numChannels: number, bitsPerSample: number): Uint8Array => {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // RIFF chunk length
  view.setUint32(4, 36 + dataLength, true);
  // WAVE identifier
  writeString(view, 8, 'WAVE');
  // fmt chunk identifier
  writeString(view, 12, 'fmt ');
  // fmt chunk length
  view.setUint32(16, 16, true);
  // Sample format (1 is PCM)
  view.setUint16(20, 1, true);
  // Channel count
  view.setUint16(22, numChannels, true);
  // Sample rate
  view.setUint32(24, sampleRate, true);
  // Byte rate (SampleRate * BlockAlign)
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
  // Block align (ChannelCount * BitsPerSample / 8)
  view.setUint16(32, numChannels * (bitsPerSample / 8), true);
  // Bits per sample
  view.setUint16(34, bitsPerSample, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, dataLength, true);

  return new Uint8Array(header);
};

const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

export const pcmToWavBlob = (base64Data: string, sampleRate: number = 24000): Blob => {
  const pcmData = base64ToUint8Array(base64Data);
  const header = createWavHeader(pcmData.length, sampleRate, 1, 16); // 1 channel, 16-bit
  return new Blob([header, pcmData], { type: 'audio/wav' });
};
