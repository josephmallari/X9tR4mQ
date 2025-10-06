import { useState, useCallback } from 'react';

interface SystemAudioDetectionResult {
  platform: string;
  isAvailable: boolean;
  isDetected: boolean;
  isDetecting: boolean;
  error: string | null;
  isWindows: boolean;
}

export function useSystemAudioDetection() {
  const [result, setResult] = useState<SystemAudioDetectionResult>({
    platform: 'unknown',
    isAvailable: false,
    isDetected: false,
    isDetecting: false,
    error: null,
    isWindows: false
  });

  const checkAvailability = useCallback(async () => {
    if (!window.electronAPI) {
      setResult(prev => ({ ...prev, error: 'Electron API not available' }));
      return false;
    }

    try {
      // Get platform information first
      const platform = window.electronAPI.getPlatform();
      const isWindows = platform === 'win32';
      
      const available = await window.electronAPI.isSystemAudioAvailable();
      setResult(prev => ({ 
        ...prev, 
        platform,
        isWindows,
        isAvailable: available, 
        error: null 
      }));
      
      console.log('Platform:', platform, 'Windows:', isWindows, 'System audio available:', available);
      return available;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResult(prev => ({ ...prev, error: errorMessage }));
      console.error('Error checking system audio availability:', error);
      return false;
    }
  }, []);

  const detectSystemAudio = useCallback(async () => {
    if (!window.electronAPI) {
      setResult(prev => ({ ...prev, error: 'Electron API not available' }));
      return false;
    }

    setResult(prev => ({ ...prev, isDetecting: true, error: null }));

    try {
      const detected = await window.electronAPI.detectSystemAudio();
      setResult(prev => ({ 
        ...prev, 
        isDetected: detected, 
        isDetecting: false,
        error: null 
      }));
      console.log('System audio detection result:', detected);
      return detected;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResult(prev => ({ 
        ...prev, 
        isDetected: false, 
        isDetecting: false,
        error: errorMessage 
      }));
      console.error('Error detecting system audio:', error);
      return false;
    }
  }, []);

  return {
    ...result,
    checkAvailability,
    detectSystemAudio
  };
}