import React, { useEffect } from 'react';
import { useSystemAudioDetection } from '../../hooks/useSystemAudioDetection';
import './SystemAudioDetection.css';

export const SystemAudioDetection: React.FC = () => {
  const {
    platform,
    isAvailable,
    isDetected,
    isDetecting,
    error,
    isWindows,
    checkAvailability,
    detectSystemAudio
  } = useSystemAudioDetection();

  useEffect(() => {
    // Check availability when component mounts
    checkAvailability();
  }, [checkAvailability]);

  const handleDetectAudio = async () => {
    await detectSystemAudio();
  };

  return (
    <div className="system-audio-detection">
      <h3>System Audio Detection</h3>
      
      {/* Platform Information */}
      <div className="platform-info">
        <strong>Platform:</strong> {platform}
        {isWindows && <span className="windows-badge"> 🪟 Windows (Full Support)</span>}
        {!isWindows && <span className="limited-badge"> ⚠️ Limited Support</span>}
      </div>
      
      <div className="status-grid">
        <div className="status-item">
          <strong>Available:</strong> {isAvailable ? '✅ Yes' : '❌ No'}
        </div>
        <div className="status-item">
          <strong>Detected:</strong> {isDetected ? '✅ Yes' : '❌ No'}
        </div>
        <div className="status-item">
          <strong>Detecting:</strong> {isDetecting ? '🔄 Yes' : '⏸️ No'}
        </div>
      </div>

      {!isWindows && (
        <div className="platform-warning">
          <strong>Note:</strong> System audio capture has limitations on {platform}. 
          For best results, test on Windows where full system audio capture is supported.
        </div>
      )}

      <button 
        className="detect-button"
        onClick={handleDetectAudio}
        disabled={!isAvailable || isDetecting}
      >
        {isDetecting ? 'Detecting...' : 'Detect System Audio'}
      </button>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
};