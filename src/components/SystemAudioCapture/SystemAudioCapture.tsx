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
    startCapture,
    stopCapture,
    pauseCapture,
    resumeCapture,
    resetCapture,
    downloadRecording,
    
    // Playback state
    isPlaying,
    playbackPosition,
    playbackDuration,
    audioUrl,
    
    // Playback functions
    playRecording,
    pausePlayback,
    stopPlayback,
    seekTo,
    audioElementRef,
    handleAudioLoad,
    handleAudioTimeUpdate,
    handleAudioEnded,
    handleAudioError
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
            {/* Playback Controls */}
            <div className="playback-controls">
              <h4>Playback</h4>
              <div className="playback-buttons">
                <button 
                  className="control-button play-button"
                  onClick={isPlaying ? pausePlayback : playRecording}
                  disabled={!audioUrl}
                >
                  {isPlaying ? '⏸️ Pause' : '▶️ Play'}
                </button>
                <button 
                  className="control-button stop-playback-button"
                  onClick={stopPlayback}
                  disabled={!audioUrl}
                >
                  ⏹️ Stop
                </button>
              </div>
              
              {/* Progress Bar */}
              {audioUrl && playbackDuration > 0 && (
                <div className="playback-progress">
                  <div className="progress-info">
                    <span>{formatDuration(playbackPosition)} / {formatDuration(playbackDuration)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={playbackDuration}
                    value={playbackPosition}
                    onChange={(e) => seekTo(Number(e.target.value))}
                    className="progress-slider"
                  />
                </div>
              )}
            </div>

            {/* Download and Reset */}
            <div className="file-controls">
              <button 
                className="control-button download-button"
                onClick={downloadRecording}
                disabled={!recordingBlob}
              >
                💾 Download Recording
              </button>
              <button 
                className="control-button reset-button"
                onClick={resetCapture}
              >
                🔄 Reset
              </button>
            </div>
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
        <h4>Instructions:</h4>
        <ul>
          <li>Click "Start System Audio Capture" to begin recording system audio</li>
          <li>You'll be prompted to select audio sources (screens, applications)</li>
          <li>Use Pause/Resume to control recording without stopping</li>
          <li>Click "Stop Capture" when finished recording</li>
          <li><strong>Playback:</strong> Use the playback controls to hear your recording</li>
          <li>Seek through the audio using the progress slider</li>
          <li>Download the recording in Windows-compatible format (MP4/WebM/OGG)</li>
          <li><strong>Note:</strong> Best results on Windows with full system audio support</li>
        </ul>
      </div>

      {/* Hidden audio element for playback */}
      {audioUrl && (
        <audio
          ref={audioElementRef}
          src={audioUrl}
          onLoadedMetadata={handleAudioLoad}
          onTimeUpdate={handleAudioTimeUpdate}
          onEnded={handleAudioEnded}
          onError={handleAudioError}
          style={{ display: 'none' }}
        />
      )}
    </div>
  );
};
