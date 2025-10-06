import { useState, useCallback, useRef } from 'react';

interface SystemAudioCaptureState {
  isCapturing: boolean;
  isPaused: boolean;
  duration: number;
  error: string | null;
  audioChunks: Blob[];
  recordingBlob: Blob | null;
}

interface SystemAudioCaptureResult {
  // State
  isCapturing: boolean;
  isPaused: boolean;
  duration: number;
  error: string | null;
  audioChunks: Blob[];
  recordingBlob: Blob | null;
  
  // Functions
  startCapture: () => Promise<void>;
  stopCapture: () => void;
  pauseCapture: () => void;
  resumeCapture: () => void;
  resetCapture: () => void;
  downloadRecording: () => void;
}

export function useSystemAudioCapture(): SystemAudioCaptureResult {
  const [state, setState] = useState<SystemAudioCaptureState>({
    isCapturing: false,
    isPaused: false,
    duration: 0,
    error: null,
    audioChunks: [],
    recordingBlob: null
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateDuration = useCallback(() => {
    if (state.isCapturing && !state.isPaused) {
      setState(prev => ({
        ...prev,
        duration: Date.now() - startTimeRef.current
      }));
    }
  }, [state.isCapturing, state.isPaused]);

  const startDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    durationIntervalRef.current = setInterval(updateDuration, 100);
  }, [updateDuration]);

  const stopDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  const startCapture = useCallback(async () => {
    if (!window.electronAPI) {
      setState(prev => ({ ...prev, error: 'Electron API not available' }));
      return;
    }

    try {
      console.log('Starting system audio capture...');
      setState(prev => ({ ...prev, error: null, isCapturing: false }));

      const { stream, mediaRecorder } = await window.electronAPI.startSystemAudioCapture();
      
      streamRef.current = stream;
      mediaRecorderRef.current = mediaRecorder;

      // Set up MediaRecorder event handlers
      mediaRecorder.ondataavailable = (event) => {
        console.log('Audio data available:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          setState(prev => ({
            ...prev,
            audioChunks: [...prev.audioChunks, event.data]
          }));
        }
      };

      mediaRecorder.onstart = () => {
        console.log('System audio recording started');
        startTimeRef.current = Date.now();
        setState(prev => ({
          ...prev,
          isCapturing: true,
          isPaused: false,
          duration: 0,
          audioChunks: []
        }));
        startDurationTimer();
      };

      mediaRecorder.onstop = () => {
        console.log('System audio recording stopped');
        stopDurationTimer();
        
        const audioBlob = new Blob(state.audioChunks, { 
          type: 'audio/webm;codecs=opus' 
        });
        
        setState(prev => ({
          ...prev,
          isCapturing: false,
          isPaused: false,
          recordingBlob: audioBlob
        }));
        
        console.log('System audio recording blob created:', audioBlob.size, 'bytes');
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setState(prev => ({
          ...prev,
          error: 'Recording error occurred',
          isCapturing: false,
          isPaused: false
        }));
        stopDurationTimer();
      };

      mediaRecorder.onpause = () => {
        console.log('System audio recording paused');
        setState(prev => ({ ...prev, isPaused: true }));
        stopDurationTimer();
      };

      mediaRecorder.onresume = () => {
        console.log('System audio recording resumed');
        setState(prev => ({ ...prev, isPaused: false }));
        startDurationTimer();
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to start system audio capture:', error);
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isCapturing: false,
        isPaused: false
      }));
    }
  }, [state.audioChunks, startDurationTimer, stopDurationTimer]);

  const stopCapture = useCallback(() => {
    try {
      console.log('Stopping system audio capture...');
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      
      if (streamRef.current) {
        window.electronAPI?.stopSystemAudioCapture(streamRef.current, mediaRecorderRef.current!);
        streamRef.current = null;
      }
      
      mediaRecorderRef.current = null;
      stopDurationTimer();
      
    } catch (error) {
      console.error('Error stopping system audio capture:', error);
      setState(prev => ({ ...prev, error: 'Error stopping capture' }));
    }
  }, [stopDurationTimer]);

  const pauseCapture = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
    }
  }, []);

  const resumeCapture = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
    }
  }, []);

  const resetCapture = useCallback(() => {
    stopCapture();
    setState({
      isCapturing: false,
      isPaused: false,
      duration: 0,
      error: null,
      audioChunks: [],
      recordingBlob: null
    });
    startTimeRef.current = 0;
  }, [stopCapture]);

  const downloadRecording = useCallback(() => {
    if (state.recordingBlob) {
      const url = URL.createObjectURL(state.recordingBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-audio-${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('System audio recording downloaded');
    }
  }, [state.recordingBlob]);

  return {
    ...state,
    startCapture,
    stopCapture,
    pauseCapture,
    resumeCapture,
    resetCapture,
    downloadRecording
  };
}
