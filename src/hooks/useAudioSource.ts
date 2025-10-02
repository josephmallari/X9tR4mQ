import { useState, useCallback } from 'react';
import type { AudioSourceState } from '../types/audio';

export const useAudioSource = () => {
  const [audioSource, setAudioSource] = useState<AudioSourceState>({
    type: 'microphone'
  });

  const updateAudioSource = useCallback((newSource: AudioSourceState) => {
    setAudioSource(newSource);
  }, []);

  const switchToMicrophone = useCallback(() => {
    setAudioSource({ type: 'microphone' });
  }, []);

  const switchToDesktop = useCallback((selectedDesktopSource?: any) => {
    setAudioSource({ 
      type: 'desktop',
      selectedDesktopSource 
    });
  }, []);

  return {
    audioSource,
    updateAudioSource,
    switchToMicrophone,
    switchToDesktop,
  };
};
