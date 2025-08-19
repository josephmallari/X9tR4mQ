import React, { useRef, useCallback, useEffect, useImperativeHandle, forwardRef } from "react";
import "./WaveformVisualizer.css";

export interface WaveformVisualizerRef {
  initializeAudioContext: () => void;
  startWaveform: (stream: MediaStream) => void;
  stopWaveform: () => void;
}

const WaveformVisualizer = forwardRef<WaveformVisualizerRef>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

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
    ctx.strokeStyle = "rgb(0, 0, 255)"; // Blue stroke color
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

  const initializeAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
    }
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

  // Expose functions to parent component
  useImperativeHandle(ref, () => ({
    initializeAudioContext,
    startWaveform,
    stopWaveform,
  }));

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWaveform();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopWaveform]);

  return (
    <div className="waveform-container">
      <canvas ref={canvasRef} width={600} height={100} className="waveform-canvas" />
    </div>
  );
});

WaveformVisualizer.displayName = "WaveformVisualizer";

export default WaveformVisualizer;
