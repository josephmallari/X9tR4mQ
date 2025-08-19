// Mock Transcription API
// This simulates a real transcription service with realistic delays and responses

export interface MockTranscriptionResponse {
  transcript: string;
  confidence: number;
  duration: number;
}

// Sample transcriptions for different recording lengths
const sampleTranscripts = [
  "Hello, this is a test recording. I'm speaking into the microphone to test the audio recording functionality.",
  "Welcome to our audio recording application. This is a demonstration of the recording and transcription features.",
  "Today we're testing the audio recorder app. It has recording, playback, and transcription capabilities.",
  "This is a longer recording to test the transcription feature. The app should be able to handle various lengths of audio content.",
  "Testing one, two, three. This is a comprehensive test of the audio recording and transcription system.",
  "Hello world! This is a sample audio recording for testing purposes. The transcription should work properly.",
  "Welcome to the audio recorder demo. This application supports recording, pausing, resuming, and stopping audio.",
  "This is a test of the transcription feature. The mock API should provide realistic transcriptions for demonstration purposes.",
];

export const mockTranscribeAudio = async (audioBlob: Blob, duration: number): Promise<MockTranscriptionResponse> => {
  // Simulate API delay based on audio duration
  const baseDelay = 2000; // 2 seconds base delay
  const durationDelay = Math.min((duration / 1000) * 500, 10000); // 0.5s per second of audio, max 10s
  const totalDelay = baseDelay + durationDelay;

  console.log(`Mock transcription starting... Duration: ${duration}ms, Delay: ${totalDelay}ms`);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        // Select a sample transcript based on duration
        const transcriptIndex = Math.min(
          Math.floor(duration / 10000), // Every 10 seconds = new transcript
          sampleTranscripts.length - 1
        );

        const baseTranscript = sampleTranscripts[transcriptIndex];

        // Modify transcript based on actual duration
        let transcript = baseTranscript;
        if (duration < 5000) {
          transcript = "Short audio recording detected.";
        } else if (duration > 30000) {
          transcript = baseTranscript + " This is a longer recording with additional content for testing purposes.";
        }

        // Add some variation based on chunk count (simulating audio quality)
        const chunkCount = Math.floor(duration / 1000);
        if (chunkCount > 10) {
          transcript += " The recording quality appears to be good with clear audio.";
        }

        const response: MockTranscriptionResponse = {
          transcript,
          confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
          duration: duration,
        };

        console.log("Mock transcription completed:", response);
        resolve(response);
      } catch (error) {
        console.error("Mock transcription error:", error);
        reject(new Error("Transcription failed"));
      }
    }, totalDelay);
  });
};
