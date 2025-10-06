import React, { useEffect } from 'react';
import { useSystemAudioDetection } from '../../hooks/useSystemAudioDetection';
import './SystemAudioDetection.css';

export const SystemAudioDetection: React.FC = () => {
  const {
    isAvailable,
    isDetected,
    isDetecting,
    error,
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