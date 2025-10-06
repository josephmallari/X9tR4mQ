import React, { useEffect } from 'react';
import { useSystemAudioDetection } from '../../hooks/useSystemAudioDetection';

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
    <div style={{ 
      padding: '10px', 
      border: '1px solid #ccc', 
      borderRadius: '5px', 
      margin: '10px 0',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>System Audio Detection</h3>
      <div>
        <p><strong>Available:</strong> {isAvailable ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Detected:</strong> {isDetected ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Detecting:</strong> {isDetecting ? '🔄 Yes' : '⏸️ No'}</p>
        {error && <p><strong>Error:</strong> <span style={{ color: 'red' }}>{error}</span></p>}
      </div>
      <button 
        onClick={handleDetectAudio}
        disabled={!isAvailable || isDetecting}
        style={{
          padding: '8px 16px',
          backgroundColor: isAvailable ? '#007bff' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isAvailable ? 'pointer' : 'not-allowed'
        }}
      >
        {isDetecting ? 'Detecting...' : 'Detect System Audio'}
      </button>
    </div>
  );
};
