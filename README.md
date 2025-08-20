# React Audio Recorder

Bootstrapped with Vite  

```npm install```  
```npm run dev```

## Approach / System Design
Get mic access -> Start recording & waveform -> Start transcription -> Collect audio chunks & live transcript -> Stop -> Download

## Technologies used

### Core Audio Technologies

- **MediaRecorder API** - Native browser audio recording with pause/resume support
- **Web Audio API** - Real-time waveform visualization and audio analysis.
- **MediaDevices API** - Microphone access with echo cancellation and noise suppression

### Audio Recording Features

- **Chunk-based recording** - Efficient memory usage with 1-second audio chunks
- **4-hour duration limit** - Automatic recording stop with time tracking
- **State management** - Persistent recording state across pause/resume cycles
- **Audio quality** - 44.1kHz sample rate, mono channel, WebM/Opus encoding

### Real-time Visualization

- **Canvas API** - Smooth 60fps waveform drawing
- **AnalyserNode** - Real-time audio data analysis for visual feedback
- **RequestAnimationFrame** - Optimized rendering loop for performance

### React Architecture

- **Custom hooks** - Modular state management for recording, playback, and transcription
- **Component composition** - Separated concerns with dedicated components for each feature
- **TypeScript** - Type-safe audio processing and state management

### Requirement fulfillments

- **Waveform** - There can be libraries for this. I wanted to get to know the Web Audio API more so was a good reason to use.
- **Duration Limit** - There is a check for 14,400,000ms which equates to 4 hours.
- **Transcription** - Instead of using a mock API, I just created a Live Transcription that can be saved. It's not the most accurate, but just a prototype.
- **Export** - Due to time constraints, I was not able to create download logic for mp3, since I used MediaRecorder API, webm was the simplest file type for download. There are libraries like ffmpeg or lamejs to convert to mp3.
- **Memory Management** - Audio is stored in 1 second chunks to prevent memory buildup
- **Performance** - Webm provides good compression.
