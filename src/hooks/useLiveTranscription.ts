import { useRef, useCallback } from "react";
import type { LiveTranscriptionState } from "../types/audio";

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const useLiveTranscription = (
  liveTranscriptionState: LiveTranscriptionState,
  setLiveTranscriptionState: React.Dispatch<React.SetStateAction<LiveTranscriptionState>>,
  clearLiveTranscription: () => void
) => {
  const liveRecognitionRef = useRef<any>(null);
  const liveTranscriptionIntervalRef = useRef<number | null>(null);
  const lastTranscriptRef = useRef<string>("");

  const startLiveTranscription = useCallback(() => {
    try {
      // Check if Web Speech API is available
      if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
        console.warn("Web Speech API not available for live transcription");
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = false; // Disable interim results to prevent echo
      recognition.lang = "en-US";

      // Add configuration to prevent echo and improve accuracy
      recognition.maxAlternatives = 1;

      // Set audio constraints to prevent echo
      if (recognition.audioContext) {
        recognition.audioContext.sampleRate = 16000;
      }

      recognition.onstart = () => {
        console.log("Live transcription started");
        setLiveTranscriptionState((prev) => ({
          ...prev,
          status: "listening",
          isListening: true,
          error: null,
        }));
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }

        // Only update if we have new content and it's different from the last update
        if (finalTranscript && finalTranscript !== lastTranscriptRef.current) {
          console.log("New transcription:", finalTranscript);
          lastTranscriptRef.current = finalTranscript;

          setLiveTranscriptionState((prev) => ({
            ...prev,
            transcript: prev.transcript + finalTranscript + " ",
          }));
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Live transcription error:", event.error);
        setLiveTranscriptionState((prev) => ({
          ...prev,
          status: "error",
          isListening: false,
          error: event.error,
        }));
      };

      recognition.onend = () => {
        console.log("Live transcription ended");
        setLiveTranscriptionState((prev) => ({
          ...prev,
          status: "idle",
          isListening: false,
        }));
      };

      liveRecognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error("Error starting live transcription:", error);
      setLiveTranscriptionState((prev) => ({
        ...prev,
        status: "error",
        isListening: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  }, [setLiveTranscriptionState]);

  const stopLiveTranscription = useCallback(() => {
    if (liveRecognitionRef.current) {
      liveRecognitionRef.current.stop();
      liveRecognitionRef.current = null;
    }

    setLiveTranscriptionState((prev) => ({
      ...prev,
      status: "idle",
      isListening: false,
    }));
  }, [setLiveTranscriptionState]);

  const resetLastTranscript = useCallback(() => {
    lastTranscriptRef.current = "";
  }, []);

  return {
    startLiveTranscription,
    stopLiveTranscription,
    resetLastTranscript,
  };
};
