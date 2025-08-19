import { useState, useCallback } from "react";
import type { TranscriptionState, LiveTranscriptionState } from "../types/audio";

export const useTranscriptionState = () => {
  const [transcriptionState, setTranscriptionState] = useState<TranscriptionState>({
    status: "idle",
    transcript: "",
    error: null,
  });

  const [liveTranscriptionState, setLiveTranscriptionState] = useState<LiveTranscriptionState>({
    status: "idle",
    transcript: "",
    isListening: false,
    error: null,
  });

  const updateTranscriptionStatus = useCallback((status: TranscriptionState["status"]) => {
    setTranscriptionState((prev) => ({ ...prev, status }));
  }, []);

  const setTranscriptionTranscript = useCallback((transcript: string) => {
    setTranscriptionState((prev) => ({ ...prev, transcript }));
  }, []);

  const setTranscriptionError = useCallback((error: string | null) => {
    setTranscriptionState((prev) => ({ ...prev, error }));
  }, []);

  const updateLiveTranscriptionStatus = useCallback((status: LiveTranscriptionState["status"]) => {
    setLiveTranscriptionState((prev) => ({ ...prev, status }));
  }, []);

  const setLiveTranscriptionTranscript = useCallback((transcript: string) => {
    setLiveTranscriptionState((prev) => ({ ...prev, transcript }));
  }, []);

  const setLiveTranscriptionListening = useCallback((isListening: boolean) => {
    setLiveTranscriptionState((prev) => ({ ...prev, isListening }));
  }, []);

  const setLiveTranscriptionError = useCallback((error: string | null) => {
    setLiveTranscriptionState((prev) => ({ ...prev, error }));
  }, []);

  const clearLiveTranscription = useCallback(() => {
    setLiveTranscriptionState({
      status: "idle",
      transcript: "",
      isListening: false,
      error: null,
    });
  }, []);

  const resetTranscriptionState = useCallback(() => {
    setTranscriptionState({
      status: "idle",
      transcript: "",
      error: null,
    });
  }, []);

  return {
    transcriptionState,
    liveTranscriptionState,
    setTranscriptionState,
    setLiveTranscriptionState,
    updateTranscriptionStatus,
    setTranscriptionTranscript,
    setTranscriptionError,
    updateLiveTranscriptionStatus,
    setLiveTranscriptionTranscript,
    setLiveTranscriptionListening,
    setLiveTranscriptionError,
    clearLiveTranscription,
    resetTranscriptionState,
  };
};
