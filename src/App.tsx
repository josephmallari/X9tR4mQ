import { useRef, useEffect } from "react";
import RecordingControls from "./components/RecordingControls/RecordingControls";
import PlaybackControls from "./components/PlaybackControls/PlaybackControls";
import WaveformVisualizer from "./components/WaveformVisualizer/WaveformVisualizer";
import type { WaveformVisualizerRef } from "./components/WaveformVisualizer/WaveformVisualizer";
import LiveTranscriptionDisplay from "./components/LiveTranscriptionDisplay/LiveTranscriptionDisplay";
import TranscriptionDisplay from "./components/TranscriptionDisplay/TranscriptionDisplay";
import { useAudioRecorder } from "./hooks/useAudioRecorder";
import "./App.css";

function App() {
  const waveformRef = useRef<WaveformVisualizerRef>(null);

  const {
    // states
    recordingState,
    playbackState,
    audioElementRef,
    transcriptionState,
    liveTranscriptionState,

    // recording functions
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    downloadRecording,

    // playback functions
    playRecording,
    pausePlayback,
    stopPlayback,
    seekTo,

    transcribeRecording,

    clearLiveTranscription,

    // audio event handlers
    handleAudioLoad,
    handleAudioPlay,
    handleAudioPause,
    handleAudioTimeUpdate,
    handleAudioEnded,
    handleAudioError,

    // waveform functions
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
        recordingState={recordingState}
        onClearTranscription={clearLiveTranscription}
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
