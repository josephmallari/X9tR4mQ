// Types for recording state
export type RecordingStatus = "idle" | "recording" | "paused" | "processing";

export interface RecordingState {
  status: RecordingStatus;
  duration: number;
  startTime: number | null;
  pausedTime: number;
  audioChunks: Blob[];
}

export interface PlaybackState {
  status: "idle" | "playing" | "paused";
  currentTime: number;
  duration: number;
  audioUrl: string | null;
}

export interface TranscriptionState {
  status: "idle" | "transcribing" | "completed" | "error";
  transcript: string;
  error: string | null;
}

export interface LiveTranscriptionState {
  status: "idle" | "listening" | "error";
  transcript: string;
  isListening: boolean;
  error: string | null;
}

// Utility function for formatting duration
export const formatDuration = (milliseconds: number): string => {
  // Handle invalid inputs
  if (!isFinite(milliseconds) || milliseconds < 0) {
    return "00:00";
  }

  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};
