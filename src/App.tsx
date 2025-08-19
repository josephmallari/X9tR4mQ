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

function App() {
  // Recording state
  const [recordingState, setRecordingState] = useState<RecordingState>({
    status: "idle",
    duration: 0,
    startTime: null,
    pausedTime: 0,
    audioChunks: [],
  });

  // Refs for audio handling
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<number | null>(null);

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

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      console.log("Starting recording...");

      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        throw new Error("MediaRecorder is not supported in this browser");
      }

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
  }, []);

  // Stop recording
  const stopRecording = useCallback(() => {
    console.log("Stop recording called");
    if (mediaRecorderRef.current && recordingState.status === "recording") {
      console.log("Stopping MediaRecorder...");
      mediaRecorderRef.current.stop();

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
  }, [recordingState.status]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    console.log("Pause recording called");
    if (mediaRecorderRef.current && recordingState.status === "recording") {
      mediaRecorderRef.current.pause();

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
  }, [recordingState.status]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    console.log("Resume recording called");
    if (mediaRecorderRef.current && recordingState.status === "paused") {
      mediaRecorderRef.current.resume();

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
  }, [recordingState.status, recordingState.pausedTime]);

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

    // Reset state
    setRecordingState({
      status: "idle",
      duration: 0,
      startTime: null,
      pausedTime: 0,
      audioChunks: [],
    });
  }, []);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Stop any ongoing recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }

      // Clear interval
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }

      // Stop all tracks
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <>
      <h1>React Audio Recorder</h1>
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

        {recordingState.audioChunks.length > 0 && (
          <div className="recording-info">
            <p>Recording completed! You can download the audio file.</p>
            <p>File size: {recordingState.audioChunks.reduce((total, chunk) => total + chunk.size, 0)} bytes</p>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
