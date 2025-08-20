import React from "react";
import type { LiveTranscriptionState, RecordingState } from "../../types/audio";
import "./LiveTranscriptionDisplay.css";

interface LiveTranscriptionDisplayProps {
  liveTranscriptionState: LiveTranscriptionState;
  recordingState: RecordingState;
  onClearTranscription: () => void;
}

const LiveTranscriptionDisplay: React.FC<LiveTranscriptionDisplayProps> = ({
  liveTranscriptionState,
  recordingState,
  onClearTranscription,
}) => {
  // Hide component when recording is not active (idle or processing)
  if (recordingState.status === "idle" || recordingState.status === "processing") return null;
  return (
    <div className="live-transcription-section">
      <h3>Live Transcription</h3>

      <div className="live-transcription-status">
        {liveTranscriptionState.status === "listening" && (
          <div className="listening-indicator">
            <span className="listening-dot"></span>
            Listening...
          </div>
        )}

        {liveTranscriptionState.status === "error" && (
          <div className="live-transcription-error">
            <p>Error: {liveTranscriptionState.error}</p>
            <p>Live transcription may not be available in this browser.</p>
          </div>
        )}
      </div>

      {liveTranscriptionState.transcript && (
        <div className="live-transcription-result">
          <div className="live-transcript-text">{liveTranscriptionState.transcript}</div>

          <button onClick={onClearTranscription} className="clear-transcription-btn">
            Clear Transcription
          </button>
        </div>
      )}

      {!liveTranscriptionState.transcript && (
        <div className="live-transcription-placeholder">
          <p>Start speaking to see live transcription...</p>
        </div>
      )}
    </div>
  );
};

export default LiveTranscriptionDisplay;
