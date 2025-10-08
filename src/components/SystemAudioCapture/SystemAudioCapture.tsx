import React from 'react';
import { useSystemAudioCapture } from '../../hooks/useSystemAudioCapture';
import './SystemAudioCapture.css';

export const SystemAudioCapture: React.FC = () => {
  const {
    isCapturing,
    isPaused,
    duration,
    error,
    audioChunks,
    recordingBlob,
    recordingFormat,
    systemAudioLevel,
    microphoneLevel,
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
    await startCapture();
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
            {isCapturing ? (isPaused ? 'Paused' : 'Recording System Audio + Microphone') : 'Ready to Capture'}
          </span>
        </div>

        {isCapturing && (
          <div className="duration-display">
            <strong>Duration:</strong> {formatDuration(duration)}
          </div>
        )}
      </div>

      {/* Audio Level Meters */}
      {isCapturing && (
        <div className="audio-meters">
          <div className="audio-meter">
            <label>🔊 System Audio:</label>
            <div className="meter-bar">
              <div
                className="meter-fill system-meter"
                style={{ width: `${Math.min(100, (systemAudioLevel / 128) * 100)}%` }}
              />
            </div>
            <span className="meter-value">{systemAudioLevel.toFixed(0)}</span>
          </div>
          <div className="audio-meter">
            <label>🎤 Microphone:</label>
            <div className="meter-bar">
              <div
                className="meter-fill mic-meter"
                style={{ width: `${Math.min(100, (microphoneLevel / 128) * 100)}%` }}
              />
            </div>
            <span className="meter-value">{microphoneLevel.toFixed(0)}</span>
          </div>
        </div>
      )}

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
            🎤 Start Audio Capture (System + Microphone)
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

      {/* Audio Playback */}
      {recordingBlob && (
        <div className="audio-playback">
          <h4>🎧 Test Playback (verify both system audio + microphone are present):</h4>
          <audio
            controls
            src={URL.createObjectURL(recordingBlob)}
            style={{ width: '100%', marginTop: '10px' }}
          />
          <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>
            ⚠️ Listen carefully: You should hear BOTH other participants AND your own voice
          </p>
        </div>
      )}

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
          <li><strong>📱 Step 2:</strong> Click "Start System Audio Capture" - it will automatically find Google Meet!</li>
          <li><strong>🎤 Dual Audio Capture:</strong> Records BOTH system audio (participants) AND your microphone (your voice)</li>
          <li><strong>🔊 System Audio:</strong> Captures all Google Meet participants' voices from your speakers</li>
          <li><strong>🎙️ Microphone:</strong> Captures your own voice directly from your microphone</li>
          <li><strong>⏸️ Controls:</strong> Use Pause/Resume during the meeting without losing the recording</li>
          <li><strong>⏹️ Stop:</strong> Click "Stop Capture" when the meeting ends</li>
          <li><strong>💾 Download:</strong> Get your recording in WebM format (works in VLC, Chrome, Firefox)</li>
          <li><strong>🖥️ Best Results:</strong> Works best on Windows - captures both incoming and outgoing audio</li>
          <li><strong>✨ Smart Selection:</strong> Automatically finds Google Meet, browser windows, or falls back to screen capture</li>
        </ul>
      </div>
    </div>
  );
};
