import React from "react";
import type { PlaybackState } from "../../types/audio";
import { formatDuration } from "../../types/audio";
import { Pause, Play } from "lucide-react";
import "./PlaybackControls.css";

interface PlaybackControlsProps {
  playbackState: PlaybackState;
  onPlayRecording: () => void;
  onPausePlayback: () => void;
  onStopPlayback: () => void;
  onSeekTo: (time: number) => void;
  hasAudioChunks: boolean;
}

const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  playbackState,
  onPlayRecording,
  onPausePlayback,
  onSeekTo,
  hasAudioChunks,
}) => {
  const handleProgressClick = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * playbackState.duration;
      onSeekTo(newTime / 1000);
    },
    [playbackState.duration, onSeekTo]
  );

  const progressFillWidth = React.useMemo(() => {
    if (playbackState.duration === 0) return 0;
    return (playbackState.currentTime / playbackState.duration) * 100;
  }, [playbackState.currentTime, playbackState.duration]);

  const formattedCurrentTime = React.useMemo(
    () => formatDuration(playbackState.currentTime),
    [playbackState.currentTime]
  );

  const formattedDuration = React.useMemo(() => formatDuration(playbackState.duration), [playbackState.duration]);

  if (!hasAudioChunks) {
    return null;
  }

  return (
    <div className="playback-section">
      <h3>Playback</h3>
      <div className="playback-controls">
        {playbackState.status === "playing" ? (
          <button onClick={onPausePlayback} className="pause-playback-btn">
            <Pause />
          </button>
        ) : (
          <button onClick={onPlayRecording} className="play-btn">
            <Play />
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {playbackState.duration > 0 && (
        <div className="progress-container">
          <div className="progress-bar clickable-progress" onClick={handleProgressClick}>
            <div
              className="progress-fill"
              style={{
                width: `${progressFillWidth}%`,
              }}
            />
          </div>
          <div className="time-display">
            {formattedCurrentTime} / {formattedDuration}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaybackControls;
