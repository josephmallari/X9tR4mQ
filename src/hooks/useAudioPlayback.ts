import { useRef, useCallback } from "react";
import type { PlaybackState } from "../types/audio";

export const useAudioPlayback = (
  playbackState: PlaybackState,
  setPlaybackState: React.Dispatch<React.SetStateAction<PlaybackState>>,
  audioChunks: Blob[]
) => {
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const createAudioUrl = useCallback((chunks: Blob[]) => {
    if (chunks.length === 0) return null;
    const audioBlob = new Blob(chunks, { type: "audio/webm" });
    return URL.createObjectURL(audioBlob);
  }, []);

  const playRecording = useCallback(() => {
    if (audioChunks.length === 0) {
      alert("No audio to play");
      return;
    }

    // Revoke previous URL to prevent memory leaks
    if (playbackState.audioUrl) {
      URL.revokeObjectURL(playbackState.audioUrl);
    }

    const audioUrl = createAudioUrl(audioChunks);
    if (!audioUrl) return;

    setPlaybackState((prev) => ({
      ...prev,
      status: "playing",
      audioUrl,
      currentTime: 0,
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
  }, [audioChunks, createAudioUrl, playbackState.audioUrl, setPlaybackState]);

  const pausePlayback = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
    setPlaybackState((prev) => ({ ...prev, status: "paused" }));
  }, [setPlaybackState]);

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
  }, [setPlaybackState]);

  const seekTo = useCallback((time: number) => {
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = time;
    }
  }, []);

  const handleAudioLoad = useCallback(() => {
    if (audioElementRef.current) {
      console.log("Audio loaded, duration from element:", audioElementRef.current.duration);
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
  }, [setPlaybackState]);

  const handleAudioPlay = useCallback(() => {
    setPlaybackState((prev) => ({ ...prev, status: "playing" }));
  }, [setPlaybackState]);

  const handleAudioPause = useCallback(() => {
    setPlaybackState((prev) => ({ ...prev, status: "paused" }));
  }, [setPlaybackState]);

  const handleAudioTimeUpdate = useCallback(() => {
    if (audioElementRef.current) {
      setPlaybackState((prev) => ({
        ...prev,
        currentTime: audioElementRef.current!.currentTime * 1000, // Convert to milliseconds
      }));
    }
  }, [setPlaybackState]);

  const handleAudioEnded = useCallback(() => {
    setPlaybackState((prev) => ({
      ...prev,
      status: "idle",
      currentTime: 0,
    }));
  }, [setPlaybackState]);

  const handleAudioError = useCallback(() => {
    console.error("Audio playback error");
    setPlaybackState((prev) => ({ ...prev, status: "idle" }));
  }, [setPlaybackState]);

  return {
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
  };
};
