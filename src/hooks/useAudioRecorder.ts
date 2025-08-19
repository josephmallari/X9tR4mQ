import { useState, useRef, useCallback, useEffect } from "react";
import type { RecordingState, PlaybackState } from "../types/audio";

export const useAudioRecorder = () => {
  // Recording state
  const [recordingState, setRecordingState] = useState<RecordingState>({
    status: "idle",
    duration: 0,
    startTime: null,
    pausedTime: 0,
    audioChunks: [],
  });

  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    status: "idle",
    currentTime: 0,
    duration: 0,
    audioUrl: null,
  });

  // Refs for audio handling
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Waveform function refs (will be set by WaveformVisualizer)
  const initializeAudioContextRef = useRef<(() => void) | null>(null);
  const startWaveformRef = useRef<((stream: MediaStream) => void) | null>(null);
  const stopWaveformRef = useRef<(() => void) | null>(null);

  // Playback functions
  const createAudioUrl = useCallback((audioChunks: Blob[]) => {
    if (audioChunks.length === 0) return null;

    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
    return URL.createObjectURL(audioBlob);
  }, []);

  const playRecording = useCallback(() => {
    if (recordingState.audioChunks.length === 0) {
      alert("No audio to play");
      return;
    }

    // Revoke previous URL to prevent memory leaks
    if (playbackState.audioUrl) {
      URL.revokeObjectURL(playbackState.audioUrl);
    }

    const audioUrl = createAudioUrl(recordingState.audioChunks);
    if (!audioUrl) return;

    setPlaybackState((prev) => ({
      ...prev,
      status: "playing",
      audioUrl,
      currentTime: 0,
      // Preserve the duration we calculated
    }));

    // Set the audio source and play
    if (audioElementRef.current) {
      audioElementRef.current.src = audioUrl;
      audioElementRef.current.currentTime = 0;
      audioElementRef.current.play().catch((error) => {
        console.error("Error playing audio:", error);
        setPlaybackState((prev) => ({ ...prev, status: "idle" }));
      });
    }
  }, [recordingState.audioChunks, createAudioUrl, playbackState.audioUrl]);

  const pausePlayback = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
    setPlaybackState((prev) => ({ ...prev, status: "paused" }));
  }, []);

  const stopPlayback = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
    }
    setPlaybackState((prev) => ({
      ...prev,
      status: "idle",
      currentTime: 0,
    }));
  }, []);

  const seekTo = useCallback((time: number) => {
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = time;
    }
  }, []);

  // Audio element event handlers
  const handleAudioLoad = useCallback(() => {
    if (audioElementRef.current) {
      console.log("Audio loaded, duration from element:", audioElementRef.current.duration);
      // Only set duration if it's not already set (to avoid overriding our calculated duration)
      setPlaybackState((prev) => {
        console.log("Current playback duration:", prev.duration);
        if (prev.duration === 0) {
          return {
            ...prev,
            duration: audioElementRef.current!.duration * 1000, // Convert to milliseconds
          };
        }
        return prev;
      });
    }
  }, []);

  const handleAudioPlay = useCallback(() => {
    setPlaybackState((prev) => ({ ...prev, status: "playing" }));
  }, []);

  const handleAudioPause = useCallback(() => {
    setPlaybackState((prev) => ({ ...prev, status: "paused" }));
  }, []);

  const handleAudioTimeUpdate = useCallback(() => {
    if (audioElementRef.current) {
      setPlaybackState((prev) => ({
        ...prev,
        currentTime: audioElementRef.current!.currentTime * 1000, // Convert to milliseconds
      }));
    }
  }, []);

  const handleAudioEnded = useCallback(() => {
    setPlaybackState((prev) => ({
      ...prev,
      status: "idle",
      currentTime: 0,
    }));
  }, []);

  const handleAudioError = useCallback(() => {
    console.error("Audio playback error");
    setPlaybackState((prev) => ({ ...prev, status: "idle" }));
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      console.log("Starting recording...");

      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        throw new Error("MediaRecorder is not supported in this browser");
      }

      // Initialize audio context
      if (initializeAudioContextRef.current) {
        initializeAudioContextRef.current();
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      console.log("Microphone access granted");
      audioStreamRef.current = stream;

      // Start waveform visualization
      if (startWaveformRef.current) {
        startWaveformRef.current(stream);
      }

      // Find supported MIME type
      const supportedTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];

      let mimeType = "audio/webm;codecs=opus";
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          console.log("Using MIME type:", mimeType);
          break;
        }
      }

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
      });

      mediaRecorderRef.current = mediaRecorder;

      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        console.log("Data available:", event.data.size, "bytes");
        if (event.data.size > 0) {
          setRecordingState((prev) => ({
            ...prev,
            audioChunks: [...prev.audioChunks, event.data],
          }));
        }
      };

      mediaRecorder.onstart = () => {
        console.log("Recording started");
        const startTime = Date.now();
        setRecordingState((prev) => ({
          ...prev,
          status: "recording",
          startTime,
          duration: 0,
          audioChunks: [], // Reset chunks for new recording
        }));

        // Start duration timer
        durationIntervalRef.current = window.setInterval(() => {
          setRecordingState((prev) => ({
            ...prev,
            duration: Date.now() - startTime,
          }));
        }, 100);
      };

      mediaRecorder.onstop = () => {
        console.log("Recording stopped");
        setRecordingState((prev) => {
          const newState = {
            ...prev,
            status: "processing" as const,
          };

          // Create audio URL for playback if we have chunks
          if (prev.audioChunks.length > 0) {
            // Use setTimeout to avoid blocking the UI
            setTimeout(() => {
              const audioUrl = createAudioUrl(prev.audioChunks);

              // Use the recording duration directly from the state
              const recordingDuration = prev.duration;
              console.log("Setting playback duration:", recordingDuration);

              setPlaybackState((playbackPrev) => ({
                ...playbackPrev,
                audioUrl,
                duration: recordingDuration, // Set the duration immediately from recording
              }));

              // Now set status to idle after processing is complete
              setRecordingState((currentPrev) => ({
                ...currentPrev,
                status: "idle" as const,
              }));
            }, 0);
          } else {
            // If no chunks, immediately set to idle
            setTimeout(() => {
              setRecordingState((currentPrev) => ({
                ...currentPrev,
                status: "idle" as const,
              }));
            }, 0);
          }

          return newState;
        });
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        alert("Recording error occurred. Please try again.");
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      console.log("MediaRecorder started");
    } catch (error) {
      console.error("Error starting recording:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      alert(`Could not access microphone: ${errorMessage}`);
    }
  }, [createAudioUrl]);

  // Stop recording
  const stopRecording = useCallback(() => {
    console.log("Stop recording called");
    if (mediaRecorderRef.current && (recordingState.status === "recording" || recordingState.status === "paused")) {
      console.log("Stopping MediaRecorder...");
      mediaRecorderRef.current.stop();

      // Stop waveform
      if (stopWaveformRef.current) {
        stopWaveformRef.current();
      }

      // Clear interval
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      // Stop all tracks
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
      }
    } else {
      console.log("Cannot stop - not currently recording or paused");
    }
  }, [recordingState.status]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    console.log("Pause recording called");
    if (mediaRecorderRef.current && recordingState.status === "recording") {
      mediaRecorderRef.current.pause();

      // Stop waveform
      if (stopWaveformRef.current) {
        stopWaveformRef.current();
      }

      // Clear interval
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      setRecordingState((prev) => ({
        ...prev,
        status: "paused",
        pausedTime: prev.duration,
      }));
    }
  }, [recordingState.status]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    console.log("Resume recording called");
    if (mediaRecorderRef.current && recordingState.status === "paused" && audioStreamRef.current) {
      mediaRecorderRef.current.resume();

      // Restart waveform
      if (startWaveformRef.current) {
        startWaveformRef.current(audioStreamRef.current);
      }

      const startTime = Date.now() - recordingState.pausedTime;

      // Restart duration timer
      durationIntervalRef.current = window.setInterval(() => {
        setRecordingState((prev) => ({
          ...prev,
          duration: Date.now() - startTime,
        }));
      }, 100);

      setRecordingState((prev) => ({
        ...prev,
        status: "recording",
      }));
    }
  }, [recordingState.status, recordingState.pausedTime]);

  // Download recorded audio
  const downloadRecording = useCallback(() => {
    if (recordingState.audioChunks.length === 0) {
      alert("No audio to download");
      return;
    }

    const audioBlob = new Blob(recordingState.audioChunks, { type: "audio/webm" });
    const audioUrl = URL.createObjectURL(audioBlob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = audioUrl;
    a.download = `recording-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.webm`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(audioUrl);
    document.body.removeChild(a);
  }, [recordingState.audioChunks]);

  // Reset recording
  const resetRecording = useCallback(() => {
    console.log("Reset recording called");

    // Stop any ongoing recording
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    // Stop waveform
    if (stopWaveformRef.current) {
      stopWaveformRef.current();
    }

    // Clear interval
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    // Stop audio tracks
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    // Reset recording state
    setRecordingState({
      status: "idle",
      startTime: 0,
      duration: 0,
      pausedTime: 0,
      audioChunks: [],
    });

    // Reset playback state and cleanup URL
    setPlaybackState((prev) => {
      if (prev.audioUrl) {
        URL.revokeObjectURL(prev.audioUrl);
      }
      return {
        status: "idle",
        currentTime: 0,
        duration: 0,
        audioUrl: null,
      };
    });
  }, []);

  // Set waveform function refs
  const setWaveformFunctions = useCallback(
    (initializeAudioContext: () => void, startWaveform: (stream: MediaStream) => void, stopWaveform: () => void) => {
      initializeAudioContextRef.current = initializeAudioContext;
      startWaveformRef.current = startWaveform;
      stopWaveformRef.current = stopWaveform;
    },
    []
  );

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Stop any ongoing recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }

      // Stop waveform
      if (stopWaveformRef.current) {
        stopWaveformRef.current();
      }

      // Clear interval
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }

      // Stop audio tracks
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Revoke audio URL
      setPlaybackState((prev) => {
        if (prev.audioUrl) {
          URL.revokeObjectURL(prev.audioUrl);
        }
        return prev;
      });
    };
  }, []);

  return {
    // State
    recordingState,
    playbackState,
    audioElementRef,

    // Recording functions
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    downloadRecording,

    // Playback functions
    playRecording,
    pausePlayback,
    stopPlayback,
    seekTo,

    // Audio event handlers
    handleAudioLoad,
    handleAudioPlay,
    handleAudioPause,
    handleAudioTimeUpdate,
    handleAudioEnded,
    handleAudioError,

    // Waveform functions
    setWaveformFunctions,
  };
};
