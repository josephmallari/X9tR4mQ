import React from "react";
import type { LiveTranscriptionState } from "../../types/audio";
import "./LiveTranscriptionDisplay.css";

interface LiveTranscriptionDisplayProps {
  liveTranscriptionState: LiveTranscriptionState;
  onClearTranscription: () => void;
  isRecording: boolean;
}

const LiveTranscriptionDisplay: React.FC<LiveTranscriptionDisplayProps> = ({
  liveTranscriptionState,
  onClearTranscription,
  isRecording,
}) => {
  if (!isRecording) {
    return null;
  }

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

      {!liveTranscriptionState.transcript && liveTranscriptionState.status === "listening" && (
        <div className="live-transcription-placeholder">
          <p>Start speaking to see live transcription...</p>
        </div>
      )}
    </div>
  );
};

export default LiveTranscriptionDisplay;
