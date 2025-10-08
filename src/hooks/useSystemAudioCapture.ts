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
    recordingFormat: 'webm'
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const systemAudioStreamRef = useRef<MediaStream | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const updateDuration = useCallback(() => {
    setState(prev => {
      if (prev.isCapturing && !prev.isPaused) {
        return {
          ...prev,
          duration: Date.now() - startTimeRef.current
        };
      }
      return prev;
    });
  }, []);

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
      console.log('Starting system audio + microphone capture...');
      setState(prev => ({ ...prev, error: null, isCapturing: false }));

      // Get both system audio and microphone streams
      if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
        throw new Error('Media devices not available in this context');
      }

      console.log('Requesting system audio stream for capture...');
      
      // Get system audio stream (Google Meet participants, etc.)
      const systemAudioStream = await navigator.mediaDevices.getDisplayMedia({
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
      console.log('System audio tracks:', systemAudioStream.getAudioTracks().length);
      
      // Get microphone stream (your own voice)
      console.log('Requesting microphone stream for capture...');
      const microphoneStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100,
          channelCount: 1, // Mono for microphone
        },
        video: false
      });
      
      console.log('Microphone stream obtained for capture');
      console.log('Microphone tracks:', microphoneStream.getAudioTracks().length);
      
      // Combine both streams into one
      const combinedStream = new MediaStream();
      
      // Add system audio tracks
      systemAudioStream.getAudioTracks().forEach(track => {
        console.log('Adding system audio track:', track.label);
        combinedStream.addTrack(track);
      });
      
      // Add microphone track
      microphoneStream.getAudioTracks().forEach(track => {
        console.log('Adding microphone track:', track.label);
        combinedStream.addTrack(track);
      });
      
      console.log('Combined stream created with', combinedStream.getAudioTracks().length, 'audio tracks');
      
      // Store individual streams for cleanup
      systemAudioStreamRef.current = systemAudioStream;
      microphoneStreamRef.current = microphoneStream;
      
      // Log audio track details
      combinedStream.getAudioTracks().forEach((track, index) => {
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
      
      // Create MediaRecorder with reliable format (WebM is most widely supported)
      let mimeType = 'audio/webm;codecs=opus';
      let fileExtension = 'webm';
      
      // Try different formats, prioritizing reliability over Windows Media Player
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
        fileExtension = 'webm';
        console.log('Using WebM Opus format (reliable cross-platform support)');
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
        fileExtension = 'webm';
        console.log('Using basic WebM format');
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
        fileExtension = 'mp4';
        console.log('Using MP4 format');
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus';
        fileExtension = 'ogg';
        console.log('Using OGG Opus format');
      } else {
        // Fallback to basic webm
        mimeType = 'audio/webm';
        fileExtension = 'webm';
        console.log('Using fallback WebM format');
      }
      
      console.log('Final format selection:', mimeType, 'File extension:', fileExtension);
      
      // Store format information
      setState(prev => ({ ...prev, recordingFormat: fileExtension }));
      
      // Create MediaRecorder with optimized settings using the combined stream
      const mediaRecorderOptions: MediaRecorderOptions = {
        mimeType: mimeType,
        audioBitsPerSecond: 128000
      };
      
      console.log('MediaRecorder options:', mediaRecorderOptions);
      
      const mediaRecorder = new MediaRecorder(combinedStream, mediaRecorderOptions);
      
      mediaRecorderRef.current = mediaRecorder;
      
      console.log('MediaRecorder created in renderer process');
      console.log('MediaRecorder state:', mediaRecorder.state);
      console.log('Supported MIME types:', MediaRecorder.isTypeSupported('audio/webm;codecs=opus'));

      // Set up MediaRecorder event handlers
      mediaRecorder.ondataavailable = (event) => {
        console.log('Audio data available:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          setState(prev => ({
            ...prev,
            audioChunks: [...audioChunksRef.current]
          }));
        }
      };

      mediaRecorder.onstart = () => {
        console.log('System audio recording started');
        startTimeRef.current = Date.now();
        audioChunksRef.current = [];
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

        // Create audio blob with detected format using ref (not stale state)
        const audioBlob = new Blob(audioChunksRef.current, {
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
        console.log('Total chunks used:', audioChunksRef.current.length);
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
      
      // Stop the MediaRecorder in the renderer process with additional safety checks
      if (mediaRecorderRef.current) {
        console.log('MediaRecorder state:', mediaRecorderRef.current.state);
        
        // Only call stop if the recorder is in a valid state
        if (mediaRecorderRef.current.state === 'recording' || mediaRecorderRef.current.state === 'paused') {
          console.log('Calling MediaRecorder.stop()');
          mediaRecorderRef.current.stop();
        } else {
          console.log('MediaRecorder not in recording/paused state, skipping stop()');
        }
      }
      
      // Stop both system audio and microphone streams
      if (systemAudioStreamRef.current) {
        console.log('Stopping system audio tracks...');
        systemAudioStreamRef.current.getTracks().forEach(track => {
          if (track.readyState === 'live') {
            track.stop();
            console.log('Stopped system audio track:', track.label);
          }
        });
        systemAudioStreamRef.current = null;
      }
      
      if (microphoneStreamRef.current) {
        console.log('Stopping microphone tracks...');
        microphoneStreamRef.current.getTracks().forEach(track => {
          if (track.readyState === 'live') {
            track.stop();
            console.log('Stopped microphone track:', track.label);
          }
        });
        microphoneStreamRef.current = null;
      }
      
      // Reset references and state
      mediaRecorderRef.current = null;
      stopDurationTimer();
      
      // Update state to reflect stopping
      setState(prev => ({
        ...prev,
        isCapturing: false,
        isPaused: false
      }));
      
      console.log('System audio capture stopped successfully');
      
    } catch (error) {
      console.error('Error stopping system audio capture:', error);
      setState(prev => ({ 
        ...prev, 
        error: `Error stopping capture: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isCapturing: false,
        isPaused: false
      }));
      
      // Force cleanup even if there was an error
      mediaRecorderRef.current = null;
      if (systemAudioStreamRef.current) {
        systemAudioStreamRef.current.getTracks().forEach(track => track.stop());
        systemAudioStreamRef.current = null;
      }
      if (microphoneStreamRef.current) {
        microphoneStreamRef.current.getTracks().forEach(track => track.stop());
        microphoneStreamRef.current = null;
      }
      stopDurationTimer();
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
    audioChunksRef.current = [];
    setState({
      isCapturing: false,
      isPaused: false,
      duration: 0,
      error: null,
      audioChunks: [],
      recordingBlob: null,
      recordingFormat: 'webm'
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
