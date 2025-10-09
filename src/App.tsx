import { useRef, useEffect } from "react";
import PlaybackControls from "./components/PlaybackControls/PlaybackControls";
import WaveformVisualizer from "./components/WaveformVisualizer/WaveformVisualizer";
import type { WaveformVisualizerRef } from "./components/WaveformVisualizer/WaveformVisualizer";
import LiveTranscriptionDisplay from "./components/LiveTranscriptionDisplay/LiveTranscriptionDisplay";
import TranscriptionDisplay from "./components/TranscriptionDisplay/TranscriptionDisplay";
import { SystemAudioDetection } from "./components/SystemAudioDetection/SystemAudioDetection";
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

      <SystemAudioDetection />


      <WaveformVisualizer ref={waveformRef} />

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
