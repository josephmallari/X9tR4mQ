import React from "react";
import type { TranscriptionState } from "../types/audio";

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
      <h3>Transcription</h3>

      <div className="transcription-controls">
        <button
          onClick={onTranscribe}
          disabled={transcriptionState.status === "transcribing"}
          className="transcribe-btn"
        >
          {transcriptionState.status === "transcribing" ? "Transcribing..." : "Transcribe Audio"}
        </button>
      </div>

      {transcriptionState.status === "transcribing" && (
        <div className="transcription-status">
          <p>Transcribing your audio... Please wait.</p>
        </div>
      )}

      {transcriptionState.status === "completed" && transcriptionState.transcript && (
        <div className="transcription-result">
          <h4>Transcription Result:</h4>
          <div className="transcript-text">{transcriptionState.transcript}</div>
        </div>
      )}

      {transcriptionState.status === "error" && transcriptionState.error && (
        <div className="transcription-error">
          <p>Error: {transcriptionState.error}</p>
          <p>Note: Speech recognition requires microphone access and works best with clear audio.</p>
        </div>
      )}
    </div>
  );
};

export default TranscriptionDisplay;
