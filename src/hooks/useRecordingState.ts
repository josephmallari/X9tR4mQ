import { useState, useCallback } from "react";
import type { RecordingState } from "../types/audio";

export const useRecordingState = () => {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    status: "idle",
    duration: 0,
    startTime: null,
    pausedTime: 0,
    audioChunks: [],
  });

  const updateRecordingStatus = useCallback((status: RecordingState["status"]) => {
    setRecordingState((prev) => ({ ...prev, status }));
  }, []);

  const updateRecordingDuration = useCallback((duration: number) => {
    setRecordingState((prev) => ({ ...prev, duration }));
  }, []);

  const addAudioChunk = useCallback((chunk: Blob) => {
    setRecordingState((prev) => ({
      ...prev,
      audioChunks: [...prev.audioChunks, chunk],
    }));
  }, []);

  const resetRecordingState = useCallback(() => {
    setRecordingState({
      status: "idle",
      duration: 0,
      startTime: null,
      pausedTime: 0,
      audioChunks: [],
    });
  }, []);

  const setRecordingStartTime = useCallback((startTime: number) => {
    setRecordingState((prev) => ({ ...prev, startTime }));
  }, []);

  const setPausedTime = useCallback((pausedTime: number) => {
    setRecordingState((prev) => ({ ...prev, pausedTime }));
  }, []);

  const clearAudioChunks = useCallback(() => {
    setRecordingState((prev) => ({ ...prev, audioChunks: [] }));
  }, []);

  return {
    recordingState,
    setRecordingState,
    updateRecordingStatus,
    updateRecordingDuration,
    addAudioChunk,
    resetRecordingState,
    setRecordingStartTime,
    setPausedTime,
    clearAudioChunks,
  };
};
