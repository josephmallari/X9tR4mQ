import React, { useState, useEffect } from 'react';
import type { AudioSourceType, AudioSourceState, DesktopSource } from '../../types/audio';
import './AudioSourceSelector.css';

interface AudioSourceSelectorProps {
  audioSource: AudioSourceState;
  onAudioSourceChange: (source: AudioSourceState) => void;
  disabled?: boolean;
}

export const AudioSourceSelector: React.FC<AudioSourceSelectorProps> = ({
  audioSource,
  onAudioSourceChange,
  disabled = false
}) => {
  const [desktopSources, setDesktopSources] = useState<DesktopSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if we're running in Electron
  const isElectron = typeof window !== 'undefined' && window.electronAPI;

  const loadDesktopSources = async () => {
    if (!isElectron) return;

    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading desktop sources...');
      const sources = await window.electronAPI!.getDesktopSources({ types: ['audio'] });
      console.log('Desktop sources loaded:', sources);
      setDesktopSources(sources);
      
      // If no sources found, try alternative method
      if (sources.length === 0 && window.electronAPI.getWindowsAudioSources) {
        console.log('No audio sources found, trying Windows alternative...');
        const altSources = await window.electronAPI.getWindowsAudioSources();
        console.log('Alternative sources:', altSources);
        setDesktopSources(altSources);
      }
    } catch (err) {
      console.error('Failed to load desktop sources:', err);
      setError('Failed to load system audio sources');
      setDesktopSources([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isElectron && audioSource.type === 'desktop') {
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        if (loading) {
          console.warn('Desktop sources loading timeout');
          setLoading(false);
          setError('Loading timeout - system audio may not be available');
        }
      }, 10000); // 10 second timeout
      
      loadDesktopSources();
      
      return () => clearTimeout(timeoutId);
    }
  }, [audioSource.type, isElectron, loading]);

  const handleSourceTypeChange = (type: AudioSourceType) => {
    if (type === 'microphone') {
      onAudioSourceChange({ type: 'microphone' });
    } else if (type === 'desktop') {
      onAudioSourceChange({ 
        type: 'desktop',
        selectedDesktopSource: desktopSources[0] || undefined
      });
    }
  };

  const handleDesktopSourceChange = (sourceId: string) => {
    const selectedSource = desktopSources.find(source => source.id === sourceId);
    if (selectedSource) {
      onAudioSourceChange({
        type: 'desktop',
        selectedDesktopSource: selectedSource
      });
    }
  };

  return (
    <div className="audio-source-selector">
      <div className="source-type-selector">
        <label className="source-type-option">
          <input
            type="radio"
            name="audioSource"
            value="microphone"
            checked={audioSource.type === 'microphone'}
            onChange={() => handleSourceTypeChange('microphone')}
            disabled={disabled}
          />
          <span className="source-icon">🎤</span>
          Microphone
        </label>

        {isElectron && (
          <label className="source-type-option">
            <input
              type="radio"
              name="audioSource"
              value="desktop"
              checked={audioSource.type === 'desktop'}
              onChange={() => handleSourceTypeChange('desktop')}
              disabled={disabled}
            />
            <span className="source-icon">🖥️</span>
            System Audio
          </label>
        )}
      </div>

      {isElectron && audioSource.type === 'desktop' && (
        <div className="desktop-source-selector">
          {loading && (
            <div className="loading-indicator">
              <span className="spinner"></span>
              Loading audio sources...
            </div>
          )}

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
              <div className="error-actions">
                <button 
                  className="retry-button"
                  onClick={loadDesktopSources}
                  disabled={loading}
                >
                  Retry
                </button>
                <button 
                  className="fallback-button"
                  onClick={() => {
                    console.log('Using fallback: switching to microphone');
                    onAudioSourceChange({ type: 'microphone' });
                  }}
                >
                  Use Microphone Instead
                </button>
              </div>
            </div>
          )}

          {!loading && !error && desktopSources.length > 0 && (
            <div className="desktop-sources">
              <label className="desktop-sources-label">Select Audio Source:</label>
              <select
                className="desktop-sources-dropdown"
                value={audioSource.selectedDesktopSource?.id || ''}
                onChange={(e) => handleDesktopSourceChange(e.target.value)}
                disabled={disabled}
              >
                {desktopSources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!loading && !error && desktopSources.length === 0 && (
            <div className="no-sources-message">
              <span className="info-icon">ℹ️</span>
              No system audio sources found
              <div className="debug-info">
                <small>
                  Debug: isElectron={String(isElectron)}, 
                  electronAPI={String(!!window.electronAPI)}
                </small>
              </div>
              <button 
                className="fallback-button"
                onClick={() => {
                  console.log('No sources found, switching to microphone');
                  onAudioSourceChange({ type: 'microphone' });
                }}
              >
                Use Microphone Instead
              </button>
            </div>
          )}
        </div>
      )}

      {!isElectron && audioSource.type === 'desktop' && (
        <div className="electron-required-message">
          <span className="warning-icon">⚠️</span>
          System audio capture is only available in the desktop app
        </div>
      )}
    </div>
  );
};
