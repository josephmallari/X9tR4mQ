import { useState, useCallback, useRef } from 'react';

interface SystemAudioCaptureState {
  isCapturing: boolean;
  isPaused: boolean;
  duration: number;
  error: string | null;
  audioChunks: Blob[];
  recordingBlob: Blob | null;
  recordingFormat: string;
  systemAudioLevel: number;
  microphoneLevel: number;
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
  systemAudioLevel: number;
  microphoneLevel: number;

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
    recordingFormat: 'webm',
    systemAudioLevel: 0,
    microphoneLevel: 0
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const systemAudioStreamRef = useRef<MediaStream | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
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
    try {
      console.log('Starting system audio + microphone capture with native ScreenCaptureKit...');
      setState(prev => ({ ...prev, error: null, isCapturing: false }));

      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('getDisplayMedia not available - please use a modern browser or Electron');
      }

      // Get system audio stream using getDisplayMedia with ScreenCaptureKit (macOS 12.3+)
      console.log('Requesting system audio stream via getDisplayMedia...');
      console.log('A system picker dialog should appear - select a window/screen and check "Share audio"');

      let systemAudioStream: MediaStream;
      try {
        systemAudioStream = await navigator.mediaDevices.getDisplayMedia({
          audio: true,
          video: true
        });

        console.log('User selected a source');
        console.log('Stream tracks - Video:', systemAudioStream.getVideoTracks().length, 'Audio:', systemAudioStream.getAudioTracks().length);

        // Remove video track immediately (we only need audio)
        const videoTracks = systemAudioStream.getVideoTracks();
        videoTracks.forEach(track => {
          console.log('Stopping video track:', track.label);
          track.stop();
          systemAudioStream.removeTrack(track);
        });

        console.log('System audio stream obtained successfully');
        console.log('System audio tracks:', systemAudioStream.getAudioTracks().length);

        if (systemAudioStream.getAudioTracks().length === 0) {
          console.warn('No audio tracks in system stream - user may not have checked "Share audio"');
        }
      } catch (error) {
        console.error('Failed to get system audio stream:', error);
        console.log('User may have cancelled or "Share audio" was not selected');
        console.log('Continuing with microphone-only recording');
        systemAudioStream = new MediaStream();
      }

      // Get microphone stream
      console.log('Requesting microphone stream...');
      const microphoneStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000,
          channelCount: 1, // Mono for microphone
        },
        video: false
      });

      console.log('Microphone stream obtained successfully');
      console.log('Microphone tracks:', microphoneStream.getAudioTracks().length);

      // Store streams for cleanup
      systemAudioStreamRef.current = systemAudioStream;
      microphoneStreamRef.current = microphoneStream;

      // Create AudioContext to mix both streams
      console.log('Creating Web Audio API mixer...');
      const audioContext = new AudioContext({ sampleRate: 48000 });
      audioContextRef.current = audioContext;

      // Create sources
      const micSource = audioContext.createMediaStreamSource(microphoneStream);

      // Create gain nodes
      const micGain = audioContext.createGain();
      micGain.gain.value = 1.5; // Boost mic slightly

      // Create analyzer nodes for visual feedback
      const micAnalyser = audioContext.createAnalyser();
      micAnalyser.fftSize = 256;

      // Create destination stream
      const destination = audioContext.createMediaStreamDestination();

      // Connect microphone: source -> gain -> analyser -> destination
      micSource.connect(micGain);
      micGain.connect(micAnalyser);
      micAnalyser.connect(destination);

      // Handle system audio if available
      let systemSource = null;
      let systemGain = null;
      let systemAnalyser = null;

      if (systemAudioStream.getAudioTracks().length > 0) {
        console.log('System audio available, connecting to mixer');
        systemSource = audioContext.createMediaStreamSource(systemAudioStream);
        systemGain = audioContext.createGain();
        systemAnalyser = audioContext.createAnalyser();

        systemGain.gain.value = 1.0;
        systemAnalyser.fftSize = 256;

        // Connect system audio: source -> gain -> analyser -> destination
        systemSource.connect(systemGain);
        systemGain.connect(systemAnalyser);
        systemAnalyser.connect(destination);
      } else {
        console.log('No system audio, recording microphone only');
      }

      console.log('Audio graph connected successfully');

      // Monitor audio levels
      const checkAudioLevels = () => {
        const micDataArray = new Uint8Array(micAnalyser.frequencyBinCount);
        micAnalyser.getByteFrequencyData(micDataArray);
        const micLevel = micDataArray.reduce((a, b) => a + b, 0) / micDataArray.length;

        let systemLevel = 0;
        if (systemAnalyser) {
          const systemDataArray = new Uint8Array(systemAnalyser.frequencyBinCount);
          systemAnalyser.getByteFrequencyData(systemDataArray);
          systemLevel = systemDataArray.reduce((a, b) => a + b, 0) / systemDataArray.length;
        }

        setState(prev => ({
          ...prev,
          systemAudioLevel: systemLevel,
          microphoneLevel: micLevel
        }));
      };

      const levelCheckInterval = setInterval(checkAudioLevels, 100);
      (audioContext as any).levelCheckInterval = levelCheckInterval;

      // The mixed stream
      const mixedStream = destination.stream;
      console.log('Mixed stream tracks:', mixedStream.getAudioTracks().length);

      // Determine best format
      let mimeType = 'audio/webm;codecs=opus';
      let fileExtension = 'webm';

      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
        fileExtension = 'webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
        fileExtension = 'mp4';
      }

      console.log('Recording format:', mimeType);
      setState(prev => ({ ...prev, recordingFormat: fileExtension }));

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(mixedStream, {
        mimeType: mimeType,
        audioBitsPerSecond: 128000
      });

      mediaRecorderRef.current = mediaRecorder;

      // MediaRecorder event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          setState(prev => ({
            ...prev,
            audioChunks: [...audioChunksRef.current]
          }));
        }
      };

      mediaRecorder.onstart = () => {
        console.log('Recording started');
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
        console.log('Recording stopped');
        stopDurationTimer();

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setState(prev => ({
          ...prev,
          isCapturing: false,
          isPaused: false,
          recordingBlob: audioBlob
        }));

        console.log('Recording blob created:', audioBlob.size, 'bytes');
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
        console.log('Recording paused');
        setState(prev => ({ ...prev, isPaused: true }));
        stopDurationTimer();
      };

      mediaRecorder.onresume = () => {
        console.log('Recording resumed');
        setState(prev => ({ ...prev, isPaused: false }));
        startDurationTimer();
      };

      // Start recording
      mediaRecorder.start(1000);
      console.log('MediaRecorder started');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to start capture:', error);
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isCapturing: false,
        isPaused: false
      }));
    }
  }, [startDurationTimer, stopDurationTimer]);

  const stopCapture = useCallback(() => {
    try {
      console.log('Stopping capture...');

      if (mediaRecorderRef.current) {
        if (mediaRecorderRef.current.state === 'recording' || mediaRecorderRef.current.state === 'paused') {
          mediaRecorderRef.current.stop();
        }
      }

      if (audioContextRef.current) {
        if ((audioContextRef.current as any).levelCheckInterval) {
          clearInterval((audioContextRef.current as any).levelCheckInterval);
        }
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      if (systemAudioStreamRef.current) {
        systemAudioStreamRef.current.getTracks().forEach(track => track.stop());
        systemAudioStreamRef.current = null;
      }

      if (microphoneStreamRef.current) {
        microphoneStreamRef.current.getTracks().forEach(track => track.stop());
        microphoneStreamRef.current = null;
      }

      mediaRecorderRef.current = null;
      stopDurationTimer();

      setState(prev => ({
        ...prev,
        isCapturing: false,
        isPaused: false
      }));

      console.log('Capture stopped successfully');

    } catch (error) {
      console.error('Error stopping capture:', error);
      setState(prev => ({
        ...prev,
        error: `Error stopping capture: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isCapturing: false,
        isPaused: false
      }));
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
      recordingFormat: 'webm',
      systemAudioLevel: 0,
      microphoneLevel: 0
    });
    startTimeRef.current = 0;
  }, [stopCapture]);

  const downloadRecording = useCallback(() => {
    if (state.recordingBlob) {
      const url = URL.createObjectURL(state.recordingBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording-${new Date().toISOString().replace(/[:.]/g, '-')}.${state.recordingFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log(`Recording downloaded as .${state.recordingFormat}`);
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
