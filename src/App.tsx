import { useState, useRef, useCallback, useEffect } from "react";
import "./App.css";

// Types for recording state
type RecordingStatus = "idle" | "recording" | "paused" | "processing";

interface RecordingState {
  status: RecordingStatus;
  duration: number;
  startTime: number | null;
  pausedTime: number;
  audioChunks: Blob[];
}

interface PlaybackState {
  status: "idle" | "playing" | "paused";
  currentTime: number;
  duration: number;
  audioUrl: string | null;
}

function App() {
  // Recording state
  const [recordingState, setRecordingState] = useState<RecordingState>({
    status: "idle",
    duration: 0,
    startTime: null,
    pausedTime: 0,
    audioChunks: [],
  });

  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    status: "idle",
    currentTime: 0,
    duration: 0,
    audioUrl: null,
  });

  // Refs for audio handling
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<number | null>(null);

  // Waveform refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Audio element ref for playback
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Format duration for display
  const formatDuration = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Waveform functions
  const initializeAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
    }
  }, []);

  const drawWaveform = useCallback(() => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#007bff";
    ctx.lineWidth = 2;

    const sliceWidth = canvas.width / bufferLength;
    let x = 0;

    ctx.beginPath();
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    // Continue animation
    animationFrameRef.current = requestAnimationFrame(drawWaveform);
  }, []);

  const startWaveform = useCallback(
    (stream: MediaStream) => {
      if (!audioContextRef.current || !analyserRef.current) return;

      // Create source from stream
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);

      // Start drawing
      drawWaveform();
    },
    [drawWaveform]
  );

  const stopWaveform = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
  }, []);

  // Playback functions
  const createAudioUrl = useCallback(
    (audioChunks: Blob[]) => {
      if (audioChunks.length === 0) return null;

      // Revoke previous URL to prevent memory leaks
      if (playbackState.audioUrl) {
        URL.revokeObjectURL(playbackState.audioUrl);
      }

      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      return URL.createObjectURL(audioBlob);
    },
    [playbackState.audioUrl]
  );

  const playRecording = useCallback(() => {
    if (recordingState.audioChunks.length === 0) {
      alert("No audio to play");
      return;
    }

    const audioUrl = createAudioUrl(recordingState.audioChunks);
    if (!audioUrl) return;

    setPlaybackState((prev) => ({
      ...prev,
      status: "playing",
      audioUrl,
      currentTime: 0,
    }));

    // Set the audio source and play
    if (audioElementRef.current) {
      audioElementRef.current.src = audioUrl;
      audioElementRef.current.currentTime = 0;
      audioElementRef.current.play().catch((error) => {
        console.error("Error playing audio:", error);
        setPlaybackState((prev) => ({ ...prev, status: "idle" }));
      });
    }
  }, [recordingState.audioChunks, createAudioUrl]);

  const pausePlayback = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
    setPlaybackState((prev) => ({ ...prev, status: "paused" }));
  }, []);

  const stopPlayback = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
    }
    setPlaybackState((prev) => ({
      ...prev,
      status: "idle",
      currentTime: 0,
    }));
  }, []);

  const seekTo = useCallback((time: number) => {
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = time;
    }
  }, []);

  // Audio element event handlers
  const handleAudioLoad = useCallback(() => {
    if (audioElementRef.current) {
      setPlaybackState((prev) => ({
        ...prev,
        duration: audioElementRef.current!.duration * 1000, // Convert to milliseconds
      }));
    }
  }, []);

  const handleAudioPlay = useCallback(() => {
    setPlaybackState((prev) => ({ ...prev, status: "playing" }));
  }, []);

  const handleAudioPause = useCallback(() => {
    setPlaybackState((prev) => ({ ...prev, status: "paused" }));
  }, []);

  const handleAudioTimeUpdate = useCallback(() => {
    if (audioElementRef.current) {
      setPlaybackState((prev) => ({
        ...prev,
        currentTime: audioElementRef.current!.currentTime * 1000, // Convert to milliseconds
      }));
    }
  }, []);

  const handleAudioEnded = useCallback(() => {
    setPlaybackState((prev) => ({
      ...prev,
      status: "idle",
      currentTime: 0,
    }));
  }, []);

  const handleAudioError = useCallback(() => {
    console.error("Audio playback error");
    setPlaybackState((prev) => ({ ...prev, status: "idle" }));
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      console.log("Starting recording...");

      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        throw new Error("MediaRecorder is not supported in this browser");
      }

      // Initialize audio context
      initializeAudioContext();

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      console.log("Microphone access granted");
      audioStreamRef.current = stream;

      // Start waveform visualization
      startWaveform(stream);

      // Find supported MIME type
      const supportedTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];

      let mimeType = "audio/webm;codecs=opus";
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          console.log("Using MIME type:", mimeType);
          break;
        }
      }

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
      });

      mediaRecorderRef.current = mediaRecorder;

      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        console.log("Data available:", event.data.size, "bytes");
        if (event.data.size > 0) {
          setRecordingState((prev) => ({
            ...prev,
            audioChunks: [...prev.audioChunks, event.data],
          }));
        }
      };

      mediaRecorder.onstart = () => {
        console.log("Recording started");
        const startTime = Date.now();
        setRecordingState((prev) => ({
          ...prev,
          status: "recording",
          startTime,
          duration: 0,
          audioChunks: [], // Reset chunks for new recording
        }));

        // Start duration timer
        durationIntervalRef.current = window.setInterval(() => {
          setRecordingState((prev) => ({
            ...prev,
            duration: Date.now() - startTime,
          }));
        }, 100);
      };

      mediaRecorder.onstop = () => {
        console.log("Recording stopped");
        setRecordingState((prev) => ({
          ...prev,
          status: "idle",
        }));

        // Create audio URL for playback
        if (recordingState.audioChunks.length > 0) {
          const audioUrl = createAudioUrl(recordingState.audioChunks);
          setPlaybackState((prev) => ({
            ...prev,
            audioUrl,
            duration: 0, // Will be set when audio loads
          }));
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        alert("Recording error occurred. Please try again.");
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      console.log("MediaRecorder started");
    } catch (error) {
      console.error("Error starting recording:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      alert(`Could not access microphone: ${errorMessage}`);
    }
  }, [initializeAudioContext, startWaveform, recordingState.audioChunks, createAudioUrl]);

  // Stop recording
  const stopRecording = useCallback(() => {
    console.log("Stop recording called");
    if (mediaRecorderRef.current && recordingState.status === "recording") {
      console.log("Stopping MediaRecorder...");
      mediaRecorderRef.current.stop();

      // Stop waveform
      stopWaveform();

      // Clear interval
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      // Stop all tracks
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
      }
    } else {
      console.log("Cannot stop - not currently recording");
    }
  }, [recordingState.status, stopWaveform]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    console.log("Pause recording called");
    if (mediaRecorderRef.current && recordingState.status === "recording") {
      mediaRecorderRef.current.pause();

      // Stop waveform
      stopWaveform();

      // Clear interval
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      setRecordingState((prev) => ({
        ...prev,
        status: "paused",
        pausedTime: prev.duration,
      }));
    }
  }, [recordingState.status, stopWaveform]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    console.log("Resume recording called");
    if (mediaRecorderRef.current && recordingState.status === "paused" && audioStreamRef.current) {
      mediaRecorderRef.current.resume();

      // Restart waveform
      startWaveform(audioStreamRef.current);

      const startTime = Date.now() - recordingState.pausedTime;

      // Restart duration timer
      durationIntervalRef.current = window.setInterval(() => {
        setRecordingState((prev) => ({
          ...prev,
          duration: Date.now() - startTime,
        }));
      }, 100);

      setRecordingState((prev) => ({
        ...prev,
        status: "recording",
      }));
    }
  }, [recordingState.status, recordingState.pausedTime, startWaveform, audioStreamRef.current]);

  // Download recorded audio
  const downloadRecording = useCallback(() => {
    if (recordingState.audioChunks.length === 0) {
      alert("No recording to download");
      return;
    }

    console.log("Downloading recording...");
    const audioBlob = new Blob(recordingState.audioChunks, { type: "audio/webm" });
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recording-${new Date().toISOString().slice(0, 19)}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log("Download completed");
  }, [recordingState.audioChunks]);

  // Reset recording
  const resetRecording = useCallback(() => {
    console.log("Reset recording called");

    // Stop any ongoing recording
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    // Stop waveform
    stopWaveform();

    // Clear interval
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    // Stop all tracks
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    // Reset recording state
    setRecordingState({
      status: "idle",
      startTime: 0,
      duration: 0,
      pausedTime: 0,
      audioChunks: [],
    });

    // Reset playback state
    if (playbackState.audioUrl) {
      URL.revokeObjectURL(playbackState.audioUrl);
    }
    setPlaybackState({
      status: "idle",
      currentTime: 0,
      duration: 0,
      audioUrl: null,
    });
  }, [stopWaveform, playbackState.audioUrl]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Stop any ongoing recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }

      // Stop waveform
      stopWaveform();

      // Clear interval
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }

      // Stop all tracks
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      // Revoke audio URL
      if (playbackState.audioUrl) {
        URL.revokeObjectURL(playbackState.audioUrl);
      }
    };
  }, [stopWaveform, playbackState.audioUrl]);

  return (
    <>
      <h1>React Audio Recorder</h1>
      <div className="waveform-container">
        <canvas ref={canvasRef} width={600} height={100} className="waveform-canvas" />
      </div>
      <div className="audio-container">
        <div className="recording-status">
          <p>Status: {recordingState.status}</p>
          <p>Duration: {formatDuration(recordingState.duration)}</p>
          <p>Chunks: {recordingState.audioChunks.length}</p>
        </div>

        <div className="audio-controls">
          {recordingState.status === "idle" && recordingState.audioChunks.length === 0 && (
            <button onClick={startRecording} className="record-btn">
              Record
            </button>
          )}

          {recordingState.status === "recording" && (
            <>
              <button onClick={pauseRecording} className="pause-btn">
                Pause
              </button>
              <button onClick={stopRecording} className="stop-btn">
                Stop
              </button>
            </>
          )}

          {recordingState.status === "paused" && (
            <>
              <button onClick={resumeRecording} className="resume-btn">
                Resume
              </button>
              <button onClick={stopRecording} className="stop-btn">
                Stop
              </button>
            </>
          )}

          {recordingState.status === "idle" && recordingState.audioChunks.length > 0 && (
            <>
              <button onClick={startRecording} className="record-btn">
                New Recording
              </button>
              <button onClick={downloadRecording} className="download-btn">
                Download
              </button>
              <button onClick={resetRecording} className="reset-btn">
                Reset
              </button>
            </>
          )}
        </div>

        {/* Playback Section */}
        {recordingState.audioChunks.length > 0 && (
          <div className="playback-section">
            <h3>Playback</h3>
            <div className="playback-controls">
              {playbackState.status === "playing" ? (
                <button onClick={pausePlayback} className="pause-playback-btn">
                  Pause
                </button>
              ) : (
                <button onClick={playRecording} className="play-btn">
                  Play
                </button>
              )}
              <button onClick={stopPlayback} className="stop-playback-btn">
                Stop
              </button>
            </div>

            {/* Progress Bar */}
            {playbackState.duration > 0 && (
              <div className="progress-container">
                <div
                  className="progress-bar clickable-progress"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const percentage = clickX / rect.width;
                    const newTime = percentage * playbackState.duration;
                    seekTo(newTime / 1000); // Convert back to seconds
                  }}
                >
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(playbackState.currentTime / playbackState.duration) * 100}%`,
                    }}
                  />
                </div>
                <div className="time-display">
                  {formatDuration(playbackState.currentTime)} / {formatDuration(playbackState.duration)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Download Button */}
        {recordingState.audioChunks.length > 0 && (
          <div className="recording-info">
            <p>Recording completed! You can download the audio file.</p>
            <p>File size: {recordingState.audioChunks.reduce((total, chunk) => total + chunk.size, 0)} bytes</p>
          </div>
        )}
      </div>

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
