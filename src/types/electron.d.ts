export interface ElectronAPI {
  getPlatform: () => string;
  isSystemAudioAvailable: () => Promise<boolean>;
  detectSystemAudio: () => Promise<boolean>;
  getSystemAudioStream: () => Promise<MediaStream>;
  stopSystemAudioCapture: (stream: MediaStream, mediaRecorder: MediaRecorder) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
