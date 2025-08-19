import React from "react";
import type { RecordingState } from "../types/audio";
import { formatDuration } from "../types/audio";
import { Play, Square, Pause } from "lucide-react";

interface RecordingControlsProps {
  recordingState: RecordingState;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onResetRecording: () => void;
  onDownloadRecording: () => void;
}

const RecordingControls: React.FC<RecordingControlsProps> = ({
  recordingState,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
  onResetRecording,
  onDownloadRecording,
}) => {
  const formattedRecordingDuration = React.useMemo(
    () => formatDuration(recordingState.duration),
    [recordingState.duration]
  );

  const audioChunksCount = React.useMemo(() => recordingState.audioChunks.length, [recordingState.audioChunks.length]);
  console.log(audioChunksCount);

  return (
    <div className="audio-container">
      <div className="recording-status">
        <p>Status: {recordingState.status}</p>
        <p>Duration: {formattedRecordingDuration}</p>
      </div>

      <div className="audio-controls">
        {recordingState.status === "idle" && recordingState.audioChunks.length === 0 && (
          <button onClick={onStartRecording} className="record-btn">
            Start Recording
          </button>
        )}

        {recordingState.status === "recording" && (
          <>
            <button onClick={onPauseRecording} className="pause-btn">
              <Pause />
            </button>
            <button onClick={onStopRecording} className="stop-btn">
              End
            </button>
          </>
        )}

        {recordingState.status === "paused" && (
          <>
            <button onClick={onResumeRecording} className="resume-btn">
              <Play />
            </button>
            <button onClick={onStopRecording} className="stop-btn">
              End
            </button>
          </>
        )}

        {recordingState.status === "idle" && recordingState.audioChunks.length > 0 && (
          <>
            <button onClick={onStartRecording}>New Recording</button>
            <button onClick={onResetRecording} className="reset-btn">
              Reset
            </button>
          </>
        )}
      </div>

      {/* Download Button */}
      {recordingState.status === "idle" && recordingState.audioChunks.length > 0 && (
        <button onClick={onDownloadRecording} className="recording-info">
          <p>Download audio file</p>
          <p>File size: {recordingState.audioChunks.reduce((total, chunk) => total + chunk.size, 0)} bytes</p>
        </button>
      )}

      {/* Processing Message */}
      {recordingState.status === "processing" && (
        <div className="recording-info">
          <p>Processing recording...</p>
        </div>
      )}
    </div>
  );
};

export default RecordingControls;
