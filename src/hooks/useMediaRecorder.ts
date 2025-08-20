import { useRef, useCallback, useEffect } from "react";
import type { RecordingState } from "../types/audio";

export const useMediaRecorder = (
  recordingState: RecordingState,
  _setRecordingState: React.Dispatch<React.SetStateAction<RecordingState>>,
  addAudioChunk: (chunk: Blob) => void,
  updateRecordingStatus: (status: RecordingState["status"]) => void,
  updateRecordingDuration: (duration: number) => void,
  setRecordingStartTime: (startTime: number) => void,
  setPausedTime: (pausedTime: number) => void,
  startLiveTranscription: () => void,
  stopLiveTranscription: () => void,
  clearLiveTranscription: () => void,
  resetLastTranscript: () => void,
  setPlaybackState: React.Dispatch<React.SetStateAction<any>>,
  updateDuration: (duration: number) => void,
  initializeAudioContextRef: React.MutableRefObject<(() => void) | null>,
  startWaveformRef: React.MutableRefObject<((stream: MediaStream) => void) | null>,
  stopWaveformRef: React.MutableRefObject<(() => void) | null>
) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const transcriptionStreamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<number | null>(null);
  const currentDurationRef = useRef<number>(0);

  const startRecording = useCallback(async () => {
    try {
      console.log("Starting recording...");

      // Check if already recording
      if (mediaRecorderRef.current) {
        console.log("MediaRecorder already exists, stopping first");
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }

      // Get microphone access for recording with echo cancellation
      const recordingStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1, // Mono to reduce complexity
        },
        video: false,
      });

      // Get separate microphone access for transcription with different settings
      const transcriptionStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false, // Disable auto gain for transcription
          sampleRate: 16000, // Lower sample rate for transcription
          channelCount: 1,
        },
        video: false,
      });

      audioStreamRef.current = recordingStream;
      transcriptionStreamRef.current = transcriptionStream;

      // Initialize audio context for waveform
      if (initializeAudioContextRef.current) {
        initializeAudioContextRef.current();
      }

      // Start waveform visualization with recording stream
      if (startWaveformRef.current) {
        startWaveformRef.current(recordingStream);
      }

      // Create MediaRecorder with recording stream
      const mediaRecorder = new MediaRecorder(recordingStream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm",
      });

      mediaRecorderRef.current = mediaRecorder;

      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        console.log("MediaRecorder data available, chunk size:", event.data.size);
        if (event.data.size > 0) {
          addAudioChunk(event.data);
        }
      };

      mediaRecorder.onstart = () => {
        console.log("Recording started");
        const startTime = Date.now();
        setRecordingStartTime(startTime);
        updateRecordingStatus("recording");

        // Clear any previous live transcription
        clearLiveTranscription();
        resetLastTranscript();

        // Start live transcription with a small delay to ensure audio stream is established
        setTimeout(() => {
          startLiveTranscription();
        }, 500);

        // Start duration timer
        durationIntervalRef.current = window.setInterval(() => {
          const newDuration = Date.now() - startTime;

          // Check 4-hour limit (4 hours = 14,400,000 milliseconds)
          if (newDuration >= 14400000) {
            console.log("4-hour recording limit reached");
            stopRecording();
            return;
          }

          currentDurationRef.current = newDuration;
          updateRecordingDuration(newDuration);
        }, 100);
      };

      mediaRecorder.onstop = () => {
        console.log("MediaRecorder stopped");
        const finalDuration = currentDurationRef.current;
        console.log("Final recording duration:", finalDuration);

        // Create audio URL after a short delay to ensure all chunks are processed
        setTimeout(() => {
          updateDuration(finalDuration);
          updateRecordingStatus("idle");
        }, 100);

        updateRecordingStatus("processing");
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        alert("Recording error occurred. Please try again.");
      };

      // Start recording with a longer timeslice to reduce frequent chunks
      mediaRecorder.start(1000); // 1 second chunks instead of default
      console.log("MediaRecorder started");
    } catch (error) {
      console.error("Error starting recording:", error);
      let errorMessage = "Unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      alert(`Could not access microphone: ${errorMessage}`);
    }
  }, [
    addAudioChunk,
    updateRecordingStatus,
    updateRecordingDuration,
    setRecordingStartTime,
    startLiveTranscription,
    clearLiveTranscription,
    resetLastTranscript,
    setPlaybackState,
    updateDuration,
    startWaveformRef,
  ]);

  const stopRecording = useCallback(() => {
    console.log("Stop recording called");
    if (mediaRecorderRef.current && (recordingState.status === "recording" || recordingState.status === "paused")) {
      console.log("Stopping MediaRecorder...");
      mediaRecorderRef.current.stop();

      // Stop live transcription
      stopLiveTranscription();

      // Stop waveform
      if (stopWaveformRef.current) {
        stopWaveformRef.current();
      }

      // Clear interval
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      // Stop all tracks from both streams
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
      }

      if (transcriptionStreamRef.current) {
        transcriptionStreamRef.current.getTracks().forEach((track) => track.stop());
        transcriptionStreamRef.current = null;
      }
    } else {
      console.log("Cannot stop - not currently recording or paused");
    }
  }, [recordingState.status, stopLiveTranscription, stopWaveformRef]);

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

      setPausedTime(recordingState.duration);
      updateRecordingStatus("paused");
    }
  }, [recordingState.status, recordingState.duration, setPausedTime, updateRecordingStatus, stopWaveformRef]);

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
        const newDuration = Date.now() - startTime;
        updateRecordingDuration(newDuration);
      }, 100);

      updateRecordingStatus("recording");
    }
  }, [
    recordingState.status,
    recordingState.pausedTime,
    updateRecordingDuration,
    updateRecordingStatus,
    startWaveformRef,
  ]);

  const resetRecording = useCallback(() => {
    console.log("Resetting recording...");

    // Stop any ongoing recording
    if (mediaRecorderRef.current && (recordingState.status === "recording" || recordingState.status === "paused")) {
      mediaRecorderRef.current.stop();
    }

    // Stop live transcription
    stopLiveTranscription();

    // Stop waveform
    if (stopWaveformRef.current) {
      stopWaveformRef.current();
    }

    // Clear intervals
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    // Stop all tracks
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    if (transcriptionStreamRef.current) {
      transcriptionStreamRef.current.getTracks().forEach((track) => track.stop());
      transcriptionStreamRef.current = null;
    }

    console.log("Recording reset complete");
  }, [recordingState.status, stopLiveTranscription, stopWaveformRef]);

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
    };
  }, [stopWaveformRef]);

  return {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
  };
};
