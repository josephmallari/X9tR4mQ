import { useRef, useCallback, useEffect } from "react";
import { useRecordingState } from "./useRecordingState";
import { usePlaybackState } from "./usePlaybackState";
import { useTranscriptionState } from "./useTranscriptionState";
import { useAudioPlayback } from "./useAudioPlayback";
import { useLiveTranscription } from "./useLiveTranscription";
import { useMediaRecorder } from "./useMediaRecorder";

export const useAudioRecorder = () => {
  // Use the smaller, focused hooks
  const {
    recordingState,
    setRecordingState,
    updateRecordingStatus,
    updateRecordingDuration,
    addAudioChunk,
    resetRecordingState,
    setRecordingStartTime,
    setPausedTime,
  } = useRecordingState();

  const { playbackState, setPlaybackState, updateDuration, resetPlaybackState } = usePlaybackState();

  const {
    transcriptionState,
    liveTranscriptionState,
    setTranscriptionState,
    setLiveTranscriptionState,
    updateTranscriptionStatus,

    clearLiveTranscription,
    resetTranscriptionState,
  } = useTranscriptionState();

  // Waveform function refs (will be set by WaveformVisualizer)
  const initializeAudioContextRef = useRef<(() => void) | null>(null);
  const startWaveformRef = useRef<((stream: MediaStream) => void) | null>(null);
  const stopWaveformRef = useRef<(() => void) | null>(null);

  // Use the audio playback hook
  const {
    audioElementRef,
    playRecording,
    pausePlayback,
    stopPlayback,
    seekTo,
    handleAudioLoad,
    handleAudioPlay,
    handleAudioPause,
    handleAudioTimeUpdate,
    handleAudioEnded,
    handleAudioError,
  } = useAudioPlayback(playbackState, setPlaybackState, recordingState.audioChunks);

  // Use the live transcription hook
  const { startLiveTranscription, stopLiveTranscription, resetLastTranscript } =
    useLiveTranscription(setLiveTranscriptionState);

  // Use the media recorder hook
  const { startRecording, stopRecording, pauseRecording, resumeRecording } = useMediaRecorder(
    recordingState,
    setRecordingState,
    addAudioChunk,
    updateRecordingStatus,
    updateRecordingDuration,
    setRecordingStartTime,
    setPausedTime,
    startLiveTranscription,
    stopLiveTranscription,
    clearLiveTranscription,
    resetLastTranscript,
    setPlaybackState,
    updateDuration,
    initializeAudioContextRef,
    startWaveformRef,
    stopWaveformRef
  );

  // Transcribe recording
  const transcribeRecording = useCallback(async () => {
    if (recordingState.audioChunks.length === 0) {
      console.log("No audio to transcribe");
      return;
    }

    console.log("Saving live transcription...");
    updateTranscriptionStatus("transcribing");

    try {
      // Use the live transcription that was captured during recording
      const liveTranscript = liveTranscriptionState.transcript;

      if (liveTranscript) {
        console.log("Live transcription saved:", liveTranscript);
        setTranscriptionState({
          status: "completed",
          transcript: liveTranscript,
          error: null,
        });
      } else {
        console.log("No live transcription available");
        setTranscriptionState({
          status: "error",
          transcript: "",
          error:
            "No live transcription was captured during recording. Please ensure microphone access is granted and try recording again.",
        });
      }
    } catch (error) {
      console.error("Error saving transcription:", error);
      setTranscriptionState({
        status: "error",
        transcript: "",
        error: error instanceof Error ? error.message : "Failed to save transcription",
      });
    }
  }, [
    recordingState.audioChunks.length,
    liveTranscriptionState.transcript,
    updateTranscriptionStatus,
    setTranscriptionState,
  ]);

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
  const resetRecordingComplete = useCallback(() => {
    console.log("Resetting recording...");

    // Stop any ongoing recording
    if (recordingState.status === "recording" || recordingState.status === "paused") {
      stopRecording();
    }

    // Reset all state
    resetRecordingState();
    resetPlaybackState();
    resetTranscriptionState();

    // Clear audio element
    if (audioElementRef.current) {
      audioElementRef.current.src = "";
    }

    console.log("Recording reset complete");
  }, [recordingState.status, stopRecording, resetRecordingState, resetPlaybackState, resetTranscriptionState]);

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
      // Revoke audio URL
      setPlaybackState((prev) => {
        if (prev.audioUrl) {
          URL.revokeObjectURL(prev.audioUrl);
        }
        return prev;
      });
    };
  }, [setPlaybackState]);

  return {
    // State
    recordingState,
    playbackState,
    transcriptionState,
    liveTranscriptionState,
    audioElementRef,

    // Recording functions
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording: resetRecordingComplete,
    downloadRecording,

    // Playback functions
    playRecording,
    pausePlayback,
    stopPlayback,
    seekTo,

    // Transcription functions
    transcribeRecording,

    // Live transcription functions
    startLiveTranscription,
    stopLiveTranscription,
    clearLiveTranscription,

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
