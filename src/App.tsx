import { useRef, useEffect } from "react";
import "./App.css";
import RecordingControls from "./components/RecordingControls";
import PlaybackControls from "./components/PlaybackControls";
import WaveformVisualizer from "./components/WaveformVisualizer";
import type { WaveformVisualizerRef } from "./components/WaveformVisualizer";
import { useAudioRecorder } from "./hooks/useAudioRecorder";
import LiveTranscriptionDisplay from "./components/LiveTranscriptionDisplay";
import TranscriptionDisplay from "./components/TranscriptionDisplay";

function App() {
  const waveformRef = useRef<WaveformVisualizerRef>(null);

  const {
    // State
    recordingState,
    playbackState,
    audioElementRef,
    transcriptionState, // ← Add this
    liveTranscriptionState,

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

    transcribeRecording, // ← Add this

    // Live transcription functions
    startLiveTranscription, // ← Add this
    stopLiveTranscription, // ← Add this
    clearLiveTranscription,

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
  useEffect(() => {
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

      <LiveTranscriptionDisplay
        liveTranscriptionState={liveTranscriptionState}
        onClearTranscription={clearLiveTranscription}
        isRecording={recordingState.status === "recording"}
      />

      <TranscriptionDisplay
        transcriptionState={transcriptionState}
        onTranscribe={transcribeRecording}
        hasAudioChunks={recordingState.status === "idle" && recordingState.audioChunks.length > 0}
      />

      <PlaybackControls
        playbackState={playbackState}
        onPlayRecording={playRecording}
        onPausePlayback={pausePlayback}
        onStopPlayback={stopPlayback}
        onSeekTo={seekTo}
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
