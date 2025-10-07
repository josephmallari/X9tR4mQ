import React, { useState, useEffect } from 'react';
import './SourcePicker.css';

interface MediaSource {
  id: string;
  name: string;
  thumbnail: string;
  type: 'screen' | 'window';
}

interface SourcePickerProps {
  isVisible: boolean;
  onSourceSelected: (sourceId: string) => void;
  onCancel: () => void;
}

export const SourcePicker: React.FC<SourcePickerProps> = ({
  isVisible,
  onSourceSelected,
  onCancel
}) => {
  const [sources, setSources] = useState<MediaSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible) {
      loadSources();
    }
  }, [isVisible]);

  const loadSources = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }

      // Request sources from the main process
      const availableSources = await window.electronAPI.getAvailableSources();
      
      const formattedSources: MediaSource[] = availableSources.map((source: any) => ({
        id: source.id,
        name: source.name,
        thumbnail: source.thumbnail.toDataURL(),
        type: source.id.startsWith('screen:') ? 'screen' : 'window'
      }));
      
      setSources(formattedSources);
    } catch (err) {
      console.error('Failed to load sources:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sources');
    } finally {
      setLoading(false);
    }
  };

  const handleSourceClick = (sourceId: string) => {
    onSourceSelected(sourceId);
  };

  if (!isVisible) return null;

  return (
    <div className="source-picker-overlay">
      <div className="source-picker-modal">
        <div className="source-picker-header">
          <h3>Select Audio Source</h3>
          <button className="close-button" onClick={onCancel}>×</button>
        </div>
        
        <div className="source-picker-content">
          <p className="picker-instructions">
            Choose a screen or window to capture system audio from. 
            For Google Meet, select the browser window with your meeting.
          </p>
          
          {loading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading available sources...</p>
            </div>
          )}
          
          {error && (
            <div className="error-state">
              <p className="error-message">{error}</p>
              <button className="retry-button" onClick={loadSources}>
                Retry
              </button>
            </div>
          )}
          
          {!loading && !error && sources.length === 0 && (
            <div className="empty-state">
              <p>No sources available</p>
              <button className="retry-button" onClick={loadSources}>
                Refresh
              </button>
            </div>
          )}
          
          {!loading && !error && sources.length > 0 && (
            <div className="sources-grid">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="source-item"
                  onClick={() => handleSourceClick(source.id)}
                >
                  <div className="source-thumbnail">
                    <img src={source.thumbnail} alt={source.name} />
                  </div>
                  <div className="source-info">
                    <div className="source-name">{source.name}</div>
                    <div className="source-type">
                      {source.type === 'screen' ? '🖥️ Screen' : '🪟 Window'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="source-picker-footer">
          <button className="cancel-button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
