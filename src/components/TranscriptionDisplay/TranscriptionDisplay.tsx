import React from "react";
import type { TranscriptionState } from "../../types/audio";
import "./TranscriptionDisplay.css";

interface TranscriptionDisplayProps {
  transcriptionState: TranscriptionState;
  onTranscribe: () => void;
  hasAudioChunks: boolean;
}

const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({
  transcriptionState,
  onTranscribe,
  hasAudioChunks,
}) => {
  if (!hasAudioChunks) {
    return null;
  }

  return (
    <div className="transcription-section">
      <h3>Save Transcription</h3>

      <div className="transcription-controls">
        <button
          onClick={onTranscribe}
          disabled={transcriptionState.status === "transcribing"}
          className="transcribe-btn"
        >
          {transcriptionState.status === "transcribing" ? "Saving..." : "Save Live Transcription"}
        </button>
      </div>

      {transcriptionState.status === "transcribing" && (
        <div className="transcription-status">
          <p>Saving your live transcription... Please wait.</p>
        </div>
      )}

      {transcriptionState.status === "completed" && transcriptionState.transcript && (
        <div className="transcription-result">
          <h4>Saved Transcription:</h4>
          <div className="transcript-text">{transcriptionState.transcript}</div>
        </div>
      )}

      {transcriptionState.status === "error" && transcriptionState.error && (
        <div className="transcription-error">
          <p>Error: {transcriptionState.error}</p>
          <p>Note: Live transcription requires microphone access and works best with clear audio.</p>
        </div>
      )}
    </div>
  );
};

export default TranscriptionDisplay;
