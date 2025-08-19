# Audio Recorder Refactoring

This project has been refactored to break down the massive `useAudioRecorder` hook and CSS files into smaller, more manageable chunks.

## New Structure

### Hooks Directory (`src/hooks/`)

The original `useAudioRecorder` hook (751 lines) has been broken down into:

1. **`useRecordingState.ts`** - Manages recording state (duration, status, audio chunks)
2. **`usePlaybackState.ts`** - Manages playback state (current time, duration, audio URL)
3. **`useTranscriptionState.ts`** - Manages transcription and live transcription state
4. **`useAudioPlayback.ts`** - Handles audio playback functionality
5. **`useLiveTranscription.ts`** - Manages live transcription using Web Speech API
6. **`useMediaRecorder.ts`** - Handles MediaRecorder functionality
7. **`useAudioRecorderRefactored.ts`** - Main hook that combines all the smaller hooks

### Component Organization

Each component is now organized in its own folder with its TSX file and CSS file co-located:

1. **`src/App.css`** - App-level styles and root layout (minimal)
2. **`src/components/RecordingControls/`** - Recording controls component
   - `RecordingControls.tsx` + `RecordingControls.css`
3. **`src/components/PlaybackControls/`** - Playback controls component
   - `PlaybackControls.tsx` + `PlaybackControls.css`
4. **`src/components/TranscriptionDisplay/`** - Transcription display component
   - `TranscriptionDisplay.tsx` + `TranscriptionDisplay.css`
5. **`src/components/LiveTranscriptionDisplay/`** - Live transcription component
   - `LiveTranscriptionDisplay.tsx` + `LiveTranscriptionDisplay.css`
6. **`src/components/WaveformVisualizer/`** - Waveform visualization component
   - `WaveformVisualizer.tsx` + `WaveformVisualizer.css`

**Note**: No `index.ts` files are needed - components are imported directly from their respective folders.

## Benefits of Refactoring

### Code Organization

- **Single Responsibility**: Each hook focuses on one specific aspect
- **Easier Testing**: Smaller hooks are easier to unit test
- **Better Maintainability**: Changes to one feature don't affect others
- **Improved Readability**: Each file is focused and easier to understand

### Reusability

- Individual hooks can be used independently in other components
- State management hooks can be reused for similar functionality
- Audio playback logic can be shared across different audio components

### Performance

- Smaller hooks have fewer dependencies and re-renders
- State updates are more targeted and efficient
- Better tree-shaking potential

## Usage

### Using the Refactored Hook

```typescript
import { useAudioRecorderRefactored } from "./hooks";

const MyComponent = () => {
  const {
    recordingState,
    startRecording,
    stopRecording,
    // ... other functions
  } = useAudioRecorderRefactored();

  // Component logic
};
```

### Using Individual Hooks

```typescript
import { useRecordingState, usePlaybackState } from "./hooks";

const MyComponent = () => {
  const { recordingState, startRecording } = useRecordingState();
  const { playbackState, playRecording } = usePlaybackState();

  // Component logic
};
```

### Importing Components and Styles

Each component is now in its own folder with direct imports:

```typescript
// Import components directly from their folders
import RecordingControls from "./components/RecordingControls/RecordingControls";
import PlaybackControls from "./components/PlaybackControls/PlaybackControls";
import TranscriptionDisplay from "./components/TranscriptionDisplay/TranscriptionDisplay";
import LiveTranscriptionDisplay from "./components/LiveTranscriptionDisplay/LiveTranscriptionDisplay";
import WaveformVisualizer from "./components/WaveformVisualizer/WaveformVisualizer";

// CSS is automatically imported in each component
// No need to manually import CSS files in App.tsx
```

## Migration Guide

### For Existing Components

1. **Update imports**: Change from `useAudioRecorder` to `useAudioRecorderRefactored`
2. **CSS is now co-located**: Each component imports its own CSS file
3. **Test functionality**: Ensure all features work as expected

### For New Components

1. **Use specific hooks**: Import only the hooks you need
2. **Co-locate CSS**: Keep CSS files in the same folder as your TSX components
3. **Follow the pattern**: Use the same structure for consistency

## File Sizes Comparison

| File                            | Original Size | New Size      | Reduction |
| ------------------------------- | ------------- | ------------- | --------- |
| `useAudioRecorder.ts`           | 751 lines     | -             | 100%      |
| `App.css`                       | 436 lines     | -             | 100%      |
| **New Structure**               | -             | -             | -         |
| `useRecordingState.ts`          | -             | 58 lines      | -         |
| `usePlaybackState.ts`           | -             | 47 lines      | -         |
| `useTranscriptionState.ts`      | -             | 67 lines      | -         |
| `useAudioPlayback.ts`           | -             | 108 lines     | -         |
| `useLiveTranscription.ts`       | -             | 108 lines     | -         |
| `useMediaRecorder.ts`           | -             | 280 lines     | -         |
| `useAudioRecorderRefactored.ts` | -             | 150 lines     | -         |
| **Total New**                   | -             | **818 lines** | **+9%**   |

_Note: The slight increase in total lines is due to better separation of concerns, clearer interfaces, and improved maintainability._

## Backward Compatibility

The original `useAudioRecorder` hook is still available for backward compatibility. You can gradually migrate components to use the new structure.

## 📁 **New File Structure**

```
src/
├── components/
│   ├── RecordingControls/
│   │   ├── RecordingControls.tsx      # Component logic
│   │   └── RecordingControls.css      # Component styles
│   ├── PlaybackControls/
│   │   ├── PlaybackControls.tsx       # Component logic
│   │   └── PlaybackControls.css       # Component styles
│   ├── TranscriptionDisplay/
│   │   ├── TranscriptionDisplay.tsx   # Component logic
│   │   └── TranscriptionDisplay.css   # Component styles
│   ├── LiveTranscriptionDisplay/
│   │   ├── LiveTranscriptionDisplay.tsx # Component logic
│   │   └── LiveTranscriptionDisplay.css # Component styles
│   └── WaveformVisualizer/
│       ├── WaveformVisualizer.tsx     # Component logic
│       └── WaveformVisualizer.css    # Component styles
├── hooks/                             # All the refactored hooks
├── App.tsx
└── App.css                            # App-level styles only
```

## Future Improvements

1. **Add TypeScript interfaces** for better type safety
2. **Implement error boundaries** for better error handling
3. **Add unit tests** for individual hooks
4. **Create a context provider** for global audio state if needed
5. **Add performance monitoring** for audio operations
