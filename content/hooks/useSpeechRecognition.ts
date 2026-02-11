import { useState, useEffect, useCallback, useRef } from "react";

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  hasRecognitionSupport: boolean;
}

export const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<any>(null);
  const silenceTimer = useRef<any>(null);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true; // Keep listening until stopped manually or by silence timer
      recognitionInstance.interimResults = true; // Show results while talking
      recognitionInstance.lang = "vi-VN";

      recognitionInstance.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            currentTranscript += transcriptPart;
          } else {
            currentTranscript += transcriptPart;
          }
        }
        setTranscript(currentTranscript);

        // SILENCE DETECTION LOGIC:
        // Clear the existing timer every time we hear something new
        if (silenceTimer.current) clearTimeout(silenceTimer.current);

        // Set a new timer. If no speech occurs for 1.5 seconds, stop listening.
        silenceTimer.current = setTimeout(() => {
          if (recognitionInstance) {
            recognitionInstance.stop();
            setIsListening(false);
          }
        }, 2000);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        if (silenceTimer.current) clearTimeout(silenceTimer.current);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
        if (silenceTimer.current) clearTimeout(silenceTimer.current);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      try {
        recognition.start();
        setIsListening(true);
        // Clear any previous timer just in case
        if (silenceTimer.current) clearTimeout(silenceTimer.current);
      } catch (error) {
        console.error("Error starting recognition:", error);
      }
    }
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
    }
  }, [recognition, isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    hasRecognitionSupport: !!recognition,
  };
};
