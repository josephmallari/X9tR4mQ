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
    setResult(prev => ({ ...prev, isDetecting: true, error: null }));

    try {
      console.log('Attempting to detect system audio...');

      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('getDisplayMedia not available - please use a modern browser or Electron');
      }

      // Request display media with video to trigger the native macOS/Windows picker
      // Video is required to show the picker, but we can stop it immediately
      console.log('A system picker dialog should appear - select a window/screen and check "Share audio"');

      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: true
      });

      const audioTracks = stream.getAudioTracks();
      const videoTracks = stream.getVideoTracks();
      console.log('System audio detected:', audioTracks.length > 0);
      console.log('Video tracks (will be stopped):', videoTracks.length);

      if (audioTracks.length > 0) {
        const track = audioTracks[0];
        console.log('Audio track details:', {
          label: track.label,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
          settings: track.getSettings(),
          constraints: track.getConstraints()
        });
      }

      // Stop all tracks immediately since we're just detecting
      stream.getTracks().forEach(track => track.stop());

      const detected = audioTracks.length > 0;
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
      console.error('Failed to detect system audio:', error);
      return false;
    }
  }, []);

  return {
    ...result,
    checkAvailability,
    detectSystemAudio
  };
}