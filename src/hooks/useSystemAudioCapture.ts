import { useState, useCallback, useRef } from 'react';

interface SystemAudioCaptureState {
  isCapturing: boolean;
  isPaused: boolean;
  duration: number;
  error: string | null;
  audioChunks: Blob[];
  recordingBlob: Blob | null;
  recordingFormat: string;
}

interface SystemAudioCaptureResult {
  // State
  isCapturing: boolean;
  isPaused: boolean;
  duration: number;
  error: string | null;
  audioChunks: Blob[];
  recordingBlob: Blob | null;
  recordingFormat: string;
  
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
    recordingBlob: null,
    recordingFormat: 'wav'
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

      // Get system audio stream directly in renderer to avoid serialization issues
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('getDisplayMedia not available in this context');
      }

      console.log('Requesting system audio stream for capture...');
      
      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100,
          channelCount: 2,
        },
        video: false
      });
      
      console.log('System audio stream obtained for capture');
      console.log('Audio tracks:', stream.getAudioTracks().length);
      
      // Log audio track details
      stream.getAudioTracks().forEach((track, index) => {
        console.log(`Audio track ${index}:`, {
          label: track.label,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
          settings: track.getSettings(),
          constraints: track.getConstraints()
        });
      });
      
      // Log all supported MediaRecorder formats
      console.log('Checking MediaRecorder format support:');
      const formatsToCheck = [
        'audio/wav',
        'audio/mp4',
        'audio/mpeg',
        'audio/webm;codecs=opus',
        'audio/webm;codecs=vp8',
        'audio/ogg;codecs=opus',
        'audio/ogg;codecs=vorbis'
      ];
      
      formatsToCheck.forEach(format => {
        const isSupported = MediaRecorder.isTypeSupported(format);
        console.log(`${format}: ${isSupported ? '✅ Supported' : '❌ Not supported'}`);
      });
      
      streamRef.current = stream;
      
      // Create MediaRecorder with Windows Media Player compatible format
      let mimeType = 'audio/wav';
      let fileExtension = 'wav';
      
      // Try different formats in order of Windows Media Player compatibility
      if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav';
        fileExtension = 'wav';
        console.log('Using WAV format (best Windows Media Player support)');
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
        fileExtension = 'mp4';
        console.log('Using MP4 format (good Windows support)');
      } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
        fileExtension = 'webm';
        console.log('Using WebM format (limited Windows support)');
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus';
        fileExtension = 'ogg';
        console.log('Using OGG format (limited Windows support)');
      } else {
        // Fallback to default
        mimeType = 'audio/webm';
        fileExtension = 'webm';
        console.log('Using default WebM format');
      }
      
      console.log('Final format selection:', mimeType, 'File extension:', fileExtension);
      
      // Store format information
      setState(prev => ({ ...prev, recordingFormat: fileExtension }));
      
      const mediaRecorderOptions: MediaRecorderOptions = {
        mimeType: mimeType
      };
      
      // Set audio quality based on format
      if (mimeType === 'audio/wav') {
        // WAV doesn't support audioBitsPerSecond, use default quality
        console.log('WAV format selected - using default quality');
      } else {
        // For compressed formats, use moderate quality for better compatibility
        mediaRecorderOptions.audioBitsPerSecond = 128000;
        console.log('Compressed format - using 128kbps bitrate');
      }
      
      const mediaRecorder = new MediaRecorder(stream, mediaRecorderOptions);
      
      mediaRecorderRef.current = mediaRecorder;
      
      console.log('MediaRecorder created in renderer process');
      console.log('MediaRecorder state:', mediaRecorder.state);
      console.log('Supported MIME types:', MediaRecorder.isTypeSupported('audio/webm;codecs=opus'));

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
        
        // Create audio blob with detected format
        const audioBlob = new Blob(state.audioChunks, { 
          type: mimeType
        });
        
        setState(prev => ({
          ...prev,
          isCapturing: false,
          isPaused: false,
          recordingBlob: audioBlob
        }));
        
        console.log('System audio recording blob created:', audioBlob.size, 'bytes');
        console.log('Recording format:', fileExtension);
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
      recordingBlob: null,
      recordingFormat: 'wav'
    });
    startTimeRef.current = 0;
  }, [stopCapture]);

  const downloadRecording = useCallback(() => {
    if (state.recordingBlob) {
      const url = URL.createObjectURL(state.recordingBlob);
      const a = document.createElement('a');
      a.href = url;
      
      // Use the stored recording format for file extension
      const extension = state.recordingFormat;
      
      a.download = `system-audio-${new Date().toISOString().replace(/[:.]/g, '-')}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log(`System audio recording downloaded as .${extension}`);
    }
  }, [state.recordingBlob, state.recordingFormat]);

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
