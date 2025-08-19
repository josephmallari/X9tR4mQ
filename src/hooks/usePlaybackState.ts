import { useState, useCallback } from "react";
import type { PlaybackState } from "../types/audio";

export const usePlaybackState = () => {
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    status: "idle",
    currentTime: 0,
    duration: 0,
    audioUrl: null,
  });

  const updatePlaybackStatus = useCallback((status: PlaybackState["status"]) => {
    setPlaybackState((prev) => ({ ...prev, status }));
  }, []);

  const updateCurrentTime = useCallback((currentTime: number) => {
    setPlaybackState((prev) => ({ ...prev, currentTime }));
  }, []);

  const updateDuration = useCallback((duration: number) => {
    setPlaybackState((prev) => ({ ...prev, duration }));
  }, []);

  const setAudioUrl = useCallback((audioUrl: string | null) => {
    setPlaybackState((prev) => ({ ...prev, audioUrl }));
  }, []);

  const resetPlaybackState = useCallback(() => {
    setPlaybackState({
      status: "idle",
      currentTime: 0,
      duration: 0,
      audioUrl: null,
    });
  }, []);

  return {
    playbackState,
    setPlaybackState,
    updatePlaybackStatus,
    updateCurrentTime,
    updateDuration,
    setAudioUrl,
    resetPlaybackState,
  };
};
