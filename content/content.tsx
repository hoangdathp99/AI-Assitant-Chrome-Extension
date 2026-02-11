import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { ChatWidget } from "./ChatWidget";
import { AgentOverlay } from "./AgentOverlay";
import { AgentContext, AgentCursorState } from "../types";
import "./styles.css";

console.log("AI Chatbot Extension - React content script loaded");

// Main App Component
const App: React.FC = () => {
  const [cursorState, setCursorState] = useState<AgentCursorState>({
    visible: false,
    x: 0,
    y: 0,
    label: "",
    isClicking: false,
  });

  const [isEnabled, setIsEnabled] = useState(false);

  // Check if chatbot is enabled
  useEffect(() => {
    chrome.storage.sync.get(["chatbotEnabled", "geminiApiKey"], (result) => {
      const enabled = result.chatbotEnabled !== false && !!result.geminiApiKey;
      setIsEnabled(enabled);

      if (!result.geminiApiKey) {
        console.log("No API key configured");
      }
      if (!enabled) {
        console.log("Chatbot is disabled");
      } else {
        console.log("Chatbot initialized successfully");
      }
    });

    // Listen for config updates
    const handleMessage = (request: any) => {
      if (request.action === "configUpdated") {
        const enabled = request.chatbotEnabled && !!request.apiKey;
        setIsEnabled(enabled);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  // Agent context
  const agentContext: AgentContext = {
    pageUrl: window.location.href,
    pageTitle: document.title,
    setCursor: (state: AgentCursorState) => setCursorState(state),
  };

  if (!isEnabled) {
    return null;
  }

  return (
    <>
      <AgentOverlay cursorState={cursorState} />
      <ChatWidget agentContext={agentContext} />
    </>
  );
};

// Initialize React app with Shadow DOM
const initChatbot = () => {
  // Create container for Shadow DOM
  const container = document.createElement("div");
  container.id = "ai-chatbot-extension-root";
  document.body.appendChild(container);

  // Create Shadow DOM (open mode for debugging)
  const shadowRoot = container.attachShadow({ mode: "open" });

  // Create link element to load CSS into Shadow DOM
  const linkElement = document.createElement("link");
  linkElement.rel = "stylesheet";
  linkElement.href = chrome.runtime.getURL("content/content.css");

  // Wait for CSS to load before mounting React
  linkElement.onload = () => {
    console.log("✅ CSS loaded successfully");

    // Create div for React root inside shadow DOM
    const reactRoot = document.createElement("div");
    shadowRoot.appendChild(reactRoot);

    // Mount React app into shadow root
    const root = ReactDOM.createRoot(reactRoot);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );

    console.log("✅ Shadow DOM initialized - Complete CSS isolation active");

    // Notify background that chatbot is ready
    chrome.runtime.sendMessage({ action: "chatbotReady" }).catch(() => {
      // Ignore errors if background script is not ready
    });
  };

  linkElement.onerror = () => {
    console.error(
      "❌ Failed to load CSS from:",
      chrome.runtime.getURL("content/content.css"),
    );
  };

  shadowRoot.appendChild(linkElement);
  console.log(
    "📦 CSS loading from:",
    chrome.runtime.getURL("content/content.css"),
  );
};

// Initialize on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initChatbot);
} else {
  initChatbot();
}
