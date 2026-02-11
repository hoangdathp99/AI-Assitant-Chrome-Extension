import React, { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  Sparkles,
  Mic,
  MicOff,
} from "lucide-react";
import { ChatMessage, AgentContext } from "../types";
import { sendMessageToGemini } from "../services/geminiService";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";

interface ChatWidgetProps {
  agentContext: AgentContext;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ agentContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "model",
      text: "Xin chào! Tôi là AI Assistant. Tôi có thể giúp bạn tương tác với trang web này. Hãy thử nói 'Click vào nút X' hoặc 'Tìm kiếm Y'.",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Speech recognition
  const {
    transcript,
    isListening,
    hasRecognitionSupport: isSttSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  // Update input field with transcript
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  // Auto-send when user stops speaking (debounce)
  // useEffect(() => {
  //   if (!isListening || !transcript.trim()) return;

  //   // Set a timer to auto-send after 2 seconds of silence
  //   const debounceTimer = setTimeout(() => {
  //     if (transcript.trim() && !isLoading) {
  //       console.log("Auto-sending message after speech pause");

  //       // Create and send message
  //       const userMsg: ChatMessage = {
  //         id: Date.now().toString(),
  //         role: "user",
  //         text: transcript,
  //         timestamp: Date.now(),
  //       };

  //       setMessages((prev) => [...prev, userMsg]);
  //       setInput("");
  //       setIsLoading(true);
  //       stopListening(); // Stop listening after sending
  //       resetTranscript();

  //       // Send to AI
  //       (async () => {
  //         try {
  //           const apiHistory = messages
  //             .filter((m) => m.id !== "welcome")
  //             .map((m) => ({
  //               role: m.role,
  //               parts: [{ text: m.text }],
  //             }));

  //           const { text } = await sendMessageToGemini(
  //             userMsg.text,
  //             apiHistory,
  //             agentContext,
  //           );

  //           const botMsg: ChatMessage = {
  //             id: (Date.now() + 1).toString(),
  //             role: "model",
  //             text: text,
  //             timestamp: Date.now(),
  //           };
  //           setMessages((prev) => [...prev, botMsg]);
  //         } catch (error) {
  //           console.error(error);
  //           const errorMsg: ChatMessage = {
  //             id: (Date.now() + 1).toString(),
  //             role: "model",
  //             text: "I'm having trouble connecting right now. Please try again.",
  //             timestamp: Date.now(),
  //           };
  //           setMessages((prev) => [...prev, errorMsg]);
  //         } finally {
  //           setIsLoading(false);
  //         }
  //       })();
  //     }
  //   }, 2000); // 2 seconds delay

  //   // Cleanup timer if user continues speaking or component unmounts
  //   return () => clearTimeout(debounceTimer);
  // }, [
  //   transcript,
  //   isListening,
  //   isLoading,
  //   messages,
  //   agentContext,
  //   stopListening,
  //   resetTranscript,
  // ]); // Include all dependencies

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // Prepare history for API (excluding the latest user message which is sent as prompt)
      // We map UI messages to API Content format
      // Filter out the welcome message to avoid "First content should be with role 'user'" error
      const apiHistory = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({
          role: m.role,
          parts: [{ text: m.text }],
        }));

      const { text } = await sendMessageToGemini(
        userMsg.text,
        apiHistory,
        agentContext,
      );

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "model",
        text: text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "model",
        text: "I'm having trouble connecting right now. Please try again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening(); // Default to Vietnamese
    }
  };

  // Stop listening when chat closes
  useEffect(() => {
    if (!isOpen && isListening) {
      stopListening();
    }
  }, [isOpen, isListening, stopListening]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      {/* Chat Window */}
      <div
        className={`pointer-events-auto mb-4 bg-white w-[350px] md:w-[400px] h-[500px] rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 transform origin-bottom-right border border-gray-100 ${
          isOpen
            ? "scale-100 opacity-100"
            : "scale-90 opacity-0 translate-y-10 invisible"
        }`}
      >
        {/* Header */}
        <div className="gradient-indigo-violet p-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
              <Sparkles size={18} className="text-yellow-300" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">AI Assistant</h3>
              <p className="text-xs text-indigo-100 flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                Online
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 scrollbar-hide space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-none"
                    : "bg-white text-gray-700 border border-gray-100 rounded-bl-none"
                }`}
              >
                {msg.role === "model" && (
                  <div className="mb-1 text-xs text-indigo-500 font-semibold flex items-center gap-1">
                    <Bot size={12} /> AI Assistant
                  </div>
                )}
                <div className="whitespace-pre-wrap leading-relaxed">
                  {msg.text}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                <div className="flex space-x-1">
                  <div
                    className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-100">
          {/* STT Error Toast */}
          {/* {sttError && (
            <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
              {sttError}
            </div>
          )} */}
          <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Hỏi tôi bất cứ điều gì..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400"
              disabled={isLoading}
            />
            {/* Microphone Button */}
            {isSttSupported && (
              <button
                onClick={handleMicToggle}
                disabled={isLoading}
                className={`p-2 rounded-full transition-all relative ${
                  isListening
                    ? "bg-red-500 text-white shadow-md hover:bg-red-600"
                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                }`}
                title={isListening ? "Dừng ghi âm" : "Bắt đầu ghi âm"}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                {/* Pulsing indicator when listening */}
                {isListening && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
                )}
              </button>
            )}

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`p-2 rounded-full transition-all ${
                input.trim() && !isLoading
                  ? "bg-indigo-600 text-white shadow-md hover:bg-indigo-700"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Send size={16} />
            </button>
          </div>
          <div className="text-center mt-2">
            <p className="text-[10px] text-gray-400">Powered by Gemini API</p>
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`pointer-events-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-xl transition-all duration-300 flex items-center justify-center transform hover:scale-105 ${
          isOpen ? "rotate-90 opacity-0 absolute" : "rotate-0 opacity-100"
        }`}
      >
        <MessageCircle size={28} />
      </button>

      {/* Invisible button to rotate back when open, handled by the X in header, 
          but keeping the logic clean, the X closes it. */}
    </div>
  );
};
