import React from "react";

// Example of using individual hooks
import { useRecordingState, usePlaybackState } from "../hooks";

const ExampleUsage: React.FC = () => {
  // Use only the recording state hook
  const { recordingState, startRecording, stopRecording } = useRecordingState();

  // Use only the playback state hook
  const { playbackState, playRecording } = usePlaybackState();

  return (
    <div>
      <h3>Example: Using Individual Hooks</h3>

      <div>
        <h4>Recording State</h4>
        <p>Status: {recordingState.status}</p>
        <p>Duration: {recordingState.duration}ms</p>
        <button onClick={startRecording}>Start Recording</button>
        <button onClick={stopRecording}>Stop Recording</button>
      </div>

      <div>
        <h4>Playback State</h4>
        <p>Status: {playbackState.status}</p>
        <p>Current Time: {playbackState.currentTime}ms</p>
        <button onClick={playRecording}>Play</button>
      </div>
    </div>
  );
};

export default ExampleUsage;
