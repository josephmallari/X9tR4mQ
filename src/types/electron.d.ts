export interface ElectronAPI {
  getPlatform: () => string;
  isSystemAudioAvailable: () => Promise<boolean>;
  detectSystemAudio: () => Promise<boolean>;
  getSystemAudioStream: () => Promise<MediaStream>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
