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
      const sources = await window.electronAPI!.getDesktopSources({ types: ['audio'] });
      setDesktopSources(sources);
    } catch (err) {
      console.error('Failed to load desktop sources:', err);
      setError('Failed to load system audio sources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isElectron && audioSource.type === 'desktop') {
      loadDesktopSources();
    }
  }, [audioSource.type, isElectron]);

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
              <button 
                className="retry-button"
                onClick={loadDesktopSources}
                disabled={loading}
              >
                Retry
              </button>
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
