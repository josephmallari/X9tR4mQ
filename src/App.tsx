import React, { useCallback, useRef } from "react";
import "./App.css";
import RecordingControls from "./components/RecordingControls";
import PlaybackControls from "./components/PlaybackControls";
import WaveformVisualizer from "./components/WaveformVisualizer";
import TranscriptionDisplay from "./components/TranscriptionDisplay";
import type { WaveformVisualizerRef } from "./components/WaveformVisualizer";
import { useAudioRecorder } from "./hooks/useAudioRecorder";

function App() {
  const waveformRef = useRef<WaveformVisualizerRef>(null);

  const {
    // State
    recordingState,
    playbackState,
    transcriptionState,
    audioElementRef,

    // Recording functions
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    downloadRecording,

    // Playback functions
    playRecording,
    pausePlayback,
    stopPlayback,
    seekTo,

    // Transcription functions
    transcribeRecording,

    // Audio event handlers
    handleAudioLoad,
    handleAudioPlay,
    handleAudioPause,
    handleAudioTimeUpdate,
    handleAudioEnded,
    handleAudioError,

    // Waveform functions
    setWaveformFunctions,
  } = useAudioRecorder();

  // Set up waveform functions when component mounts
  React.useEffect(() => {
    if (waveformRef.current) {
      setWaveformFunctions(
        waveformRef.current.initializeAudioContext,
        waveformRef.current.startWaveform,
        waveformRef.current.stopWaveform
      );
    }
  }, [setWaveformFunctions]);

  return (
    <>
      <h1>React Audio Recorder</h1>

      <WaveformVisualizer ref={waveformRef} />

      <RecordingControls
        recordingState={recordingState}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onPauseRecording={pauseRecording}
        onResumeRecording={resumeRecording}
        onResetRecording={resetRecording}
        onDownloadRecording={downloadRecording}
      />

      <PlaybackControls
        playbackState={playbackState}
        onPlayRecording={playRecording}
        onPausePlayback={pausePlayback}
        onStopPlayback={stopPlayback}
        onSeekTo={seekTo}
        hasAudioChunks={recordingState.status === "idle" && recordingState.audioChunks.length > 0}
      />

      <TranscriptionDisplay
        transcriptionState={transcriptionState}
        onTranscribe={transcribeRecording}
        hasAudioChunks={recordingState.status === "idle" && recordingState.audioChunks.length > 0}
      />

      {/* Hidden audio element for playback */}
      <audio
        ref={audioElementRef}
        onLoadedMetadata={handleAudioLoad}
        onPlay={handleAudioPlay}
        onPause={handleAudioPause}
        onTimeUpdate={handleAudioTimeUpdate}
        onEnded={handleAudioEnded}
        onError={handleAudioError}
        style={{ display: "none" }}
      />
    </>
  );
}

export default App;
