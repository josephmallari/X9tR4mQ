import React, { useState } from 'react';
import { useSystemAudioCapture } from '../../hooks/useSystemAudioCapture';
import { SourcePicker } from '../SourcePicker/SourcePicker';
import './SystemAudioCapture.css';

export const SystemAudioCapture: React.FC = () => {
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  
  const {
    isCapturing,
    isPaused,
    duration,
    error,
    audioChunks,
    recordingBlob,
    recordingFormat,
    startCapture,
    stopCapture,
    pauseCapture,
    resumeCapture,
    resetCapture,
    downloadRecording
  } = useSystemAudioCapture();

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleStartCapture = async () => {
    // Show source picker first
    setShowSourcePicker(true);
  };

  const handleSourceSelected = async (sourceId: string) => {
    setSelectedSourceId(sourceId);
    setShowSourcePicker(false);
    console.log('Starting capture with selected source:', sourceId);
    await startCapture();
  };

  const handleSourcePickerCancel = () => {
    setShowSourcePicker(false);
  };

  const handleStopCapture = () => {
    stopCapture();
  };

  const handlePauseCapture = () => {
    if (isPaused) {
      resumeCapture();
    } else {
      pauseCapture();
    }
  };

  return (
    <div className="system-audio-capture">
      <h3>System Audio Capture</h3>
      
      {/* Status Display */}
      <div className="capture-status">
        <div className="status-indicator">
          <div className={`status-light ${isCapturing ? (isPaused ? 'paused' : 'recording') : 'stopped'}`}></div>
          <span className="status-text">
            {isCapturing ? (isPaused ? 'Paused' : 'Recording System Audio') : 'Ready to Capture'}
          </span>
        </div>
        
        {isCapturing && (
          <div className="duration-display">
            <strong>Duration:</strong> {formatDuration(duration)}
          </div>
        )}
      </div>

      {/* Recording Info */}
      {(audioChunks.length > 0 || recordingBlob) && (
        <div className="recording-info">
          <div className="info-item">
            <strong>Chunks:</strong> {audioChunks.length}
          </div>
          <div className="info-item">
            <strong>Format:</strong> {recordingFormat.toUpperCase()}
          </div>
          {recordingBlob && (
            <div className="info-item">
              <strong>Size:</strong> {formatFileSize(recordingBlob.size)}
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="capture-controls">
        {!isCapturing ? (
          <button 
            className="control-button start-button"
            onClick={handleStartCapture}
            disabled={!window.electronAPI}
          >
            🎤 Start System Audio Capture
          </button>
        ) : (
          <div className="recording-controls">
            <button 
              className="control-button pause-button"
              onClick={handlePauseCapture}
            >
              {isPaused ? '▶️ Resume' : '⏸️ Pause'}
            </button>
            <button 
              className="control-button stop-button"
              onClick={handleStopCapture}
            >
              ⏹️ Stop Capture
            </button>
          </div>
        )}

        {(recordingBlob || audioChunks.length > 0) && (
          <div className="post-capture-controls">
            <button 
              className="control-button download-button"
              onClick={downloadRecording}
              disabled={!recordingBlob}
            >
              💾 Download Recording ({recordingFormat.toUpperCase()})
            </button>
            <button 
              className="control-button reset-button"
              onClick={resetCapture}
            >
              🔄 Reset
            </button>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Instructions */}
      <div className="instructions">
        <h4>Instructions for Google Meet Recording:</h4>
        <ul>
          <li><strong>🎯 Step 1:</strong> Join your Google Meet first</li>
          <li><strong>📱 Step 2:</strong> Click "Start System Audio Capture" - a source picker will appear</li>
          <li><strong>🖥️ Step 3:</strong> In the picker, select either:
            <ul>
              <li><strong>Entire Screen:</strong> Captures all audio from your computer</li>
              <li><strong>Chrome/Edge Window:</strong> Captures only from the browser with Google Meet</li>
            </ul>
          </li>
          <li><strong>🔊 Audio Capture:</strong> This will record ALL system audio including Google Meet participants AND your own voice</li>
          <li><strong>⏸️ Controls:</strong> Use Pause/Resume during the meeting without losing the recording</li>
          <li><strong>⏹️ Stop:</strong> Click "Stop Capture" when the meeting ends</li>
          <li><strong>💾 Download:</strong> Get your recording in WebM format (works in VLC, Chrome, Firefox)</li>
          <li><strong>🖥️ Best Results:</strong> Works best on Windows - captures both incoming and outgoing audio</li>
        </ul>
      </div>

      {/* Source Picker Modal */}
      <SourcePicker
        isVisible={showSourcePicker}
        onSourceSelected={handleSourceSelected}
        onCancel={handleSourcePickerCancel}
      />
    </div>
  );
};
