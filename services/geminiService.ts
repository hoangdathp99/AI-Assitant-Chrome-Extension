import {
  GoogleGenerativeAI,
  FunctionDeclaration,
  Content,
  Part,
  FunctionCall,
  SchemaType,
} from "@google/generative-ai";
import { AgentContext } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants/constants";
import {
  findElementByText,
  getElementCenter,
  getVisiblePageContent,
  sleep,
  simulateClick,
} from "../utils/domUtils";

// Define Tools
const clickElementTool: FunctionDeclaration = {
  name: "clickElement",
  description:
    "Click on an element on the page identified by its visible text or label.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      targetText: {
        type: SchemaType.STRING,
        description:
          "The visible text on the button, link, or element to click (e.g., 'Add to Cart', 'Home', 'Headphones').",
      },
    },
    required: ["targetText"],
  },
};

const typeInputTool: FunctionDeclaration = {
  name: "typeInput",
  description:
    "Type text into an input field identified by its placeholder or label.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      targetLabel: {
        type: SchemaType.STRING,
        description:
          "The placeholder text or label of the input field (e.g., 'Search...').",
      },
      value: {
        type: SchemaType.STRING,
        description: "The text to type into the field.",
      },
    },
    required: ["targetLabel", "value"],
  },
};

const scrollTool: FunctionDeclaration = {
  name: "scroll",
  description: "Scroll the page up, down, to top, or to bottom.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      direction: {
        type: SchemaType.STRING,
        description:
          "Direction to scroll: 'up', 'down', 'top' (scroll to top of page), or 'bottom' (scroll to bottom of page).",
      },
    },
    required: ["direction"],
  },
};

const pressEnterTool: FunctionDeclaration = {
  name: "pressEnter",
  description:
    "Press the Enter key on an input field to submit a form or search. Use this after typing into a search box.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      targetLabel: {
        type: SchemaType.STRING,
        description:
          "The placeholder text or label of the input field to press Enter on (e.g., 'Search...').",
      },
    },
    required: ["targetLabel"],
  },
};

let genAI: GoogleGenerativeAI | null = null;
let cachedApiKey: string | null = null;

const getGenAI = async (): Promise<GoogleGenerativeAI> => {
  // Get API key from Chrome Storage
  if (!cachedApiKey) {
    const result = await chrome.storage.sync.get(["geminiApiKey"]);
    if (!result.geminiApiKey) {
      throw new Error(
        "No API key configured. Please set your Gemini API key in the extension settings.",
      );
    }
    cachedApiKey = result.geminiApiKey;
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(cachedApiKey || "");
  }
  return genAI;
};

export const sendMessageToGemini = async (
  userMessage: string,
  history: Content[],
  context: AgentContext,
): Promise<{ text: string; newHistory: Content[] }> => {
  const ai = await getGenAI();

  // Create model with system instruction and tools
  const model = ai.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION,
    tools: [
      {
        functionDeclarations: [
          clickElementTool,
          typeInputTool,
          scrollTool,
          pressEnterTool,
        ],
      },
    ],
  });

  // Dynamic Context: Read the actual DOM
  let pageContent = getVisiblePageContent();
  const contextPrompt = `
    [VISIBLE PAGE CONTENT START]
    ${pageContent}
    [VISIBLE PAGE CONTENT END]

    [USER REQUEST]
    ${userMessage}
  `;

  // Start chat with history
  const chat = model.startChat({ history });

  let response = await chat.sendMessage(contextPrompt);
  let finalResponseText = "";

  // Execution Loop
  while (true) {
    const result = response.response;
    if (!result.candidates || result.candidates.length === 0) break;

    const candidate = result.candidates[0];
    const content = candidate.content;
    const parts = content.parts;

    const textPart = parts.find((p) => p.text);
    if (textPart && textPart.text) {
      finalResponseText += textPart.text;
    }

    const functionCalls = parts
      .filter((p) => p.functionCall)
      .map((p) => p.functionCall as FunctionCall);

    if (functionCalls.length > 0) {
      const functionResponses: Part[] = [];

      for (const call of functionCalls) {
        console.log(`[AI Agent] Tool: ${call.name}`, call.args);

        let result: any = { error: "Unknown tool" };

        try {
          if (call.name === "clickElement") {
            const { targetText } = call.args as any;
            const element = findElementByText(targetText);

            if (element) {
              // Visual feedback
              element.scrollIntoView({ behavior: "smooth", block: "center" });
              const { x, y } = getElementCenter(element);

              context.setCursor({
                visible: true,
                x,
                y,
                label: `Clicking "${targetText}"`,
                isClicking: false,
              });
              await sleep(800); // Wait for move

              context.setCursor({
                visible: true,
                x,
                y,
                label: `Clicking "${targetText}"`,
                isClicking: true,
              });
              await sleep(300); // Click animation

              // Use robust simulation
              simulateClick(element);

              // CRITICAL FIX: Wait for navigation/render and capture NEW state
              await sleep(1000);
              const newContent = getVisiblePageContent();

              result = {
                success: true,
                message: `Clicked element containing "${targetText}".`,
                // We send the new content back so the model knows the page changed
                visiblePageContentAfterAction: newContent,
              };

              context.setCursor({ visible: false, x: 0, y: 0 });
            } else {
              result = {
                error: `Element with text "${targetText}" not found.`,
              };
            }
          } else if (call.name === "typeInput") {
            const { targetLabel, value } = call.args as any;
            const element = findElementByText(targetLabel) as HTMLInputElement;

            if (
              element &&
              (element.tagName === "INPUT" || element.tagName === "TEXTAREA")
            ) {
              element.scrollIntoView({ behavior: "smooth", block: "center" });
              const { x, y } = getElementCenter(element);

              context.setCursor({
                visible: true,
                x,
                y,
                label: `Typing "${value}"`,
                isClicking: false,
              });
              await sleep(800);

              element.focus();
              // Simulate React input change
              const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype,
                "value",
              )?.set;
              nativeInputValueSetter?.call(element, value);
              element.dispatchEvent(new Event("input", { bubbles: true }));

              // Update content after typing? usually not needed as much as click, but good for autocomplete
              await sleep(500);
              const newContent = getVisiblePageContent();

              result = {
                success: true,
                message: `Typed "${value}" into "${targetLabel}"`,
                visiblePageContentAfterAction: newContent,
              };
              context.setCursor({ visible: false, x: 0, y: 0 });
            } else {
              result = { error: `Input field "${targetLabel}" not found.` };
            }
          } else if (call.name === "scroll") {
            const { direction } = call.args as any;

            if (direction === "top") {
              // Scroll to top of page
              window.scrollTo({ top: 0, behavior: "smooth" });
            } else if (direction === "bottom") {
              // Scroll to bottom of page
              window.scrollTo({
                top: document.body.scrollHeight,
                behavior: "smooth",
              });
            } else {
              // Scroll up or down by viewport height
              const amount =
                direction === "down"
                  ? window.innerHeight * 0.7
                  : -window.innerHeight * 0.7;
              window.scrollBy({ top: amount, behavior: "smooth" });
            }

            await sleep(500);
            const newContent = getVisiblePageContent();
            result = {
              success: true,
              message: `Scrolled ${direction}`,
              visiblePageContentAfterAction: newContent,
            };
          } else if (call.name === "pressEnter") {
            const { targetLabel } = call.args as any;
            const element = findElementByText(targetLabel) as HTMLInputElement;

            if (
              element &&
              (element.tagName === "INPUT" || element.tagName === "TEXTAREA")
            ) {
              element.scrollIntoView({ behavior: "smooth", block: "center" });
              const { x, y } = getElementCenter(element);

              context.setCursor({
                visible: true,
                x,
                y,
                label: "Pressing Enter",
                isClicking: false,
              });
              await sleep(300);

              // Focus the element first
              element.focus();

              // Simulate Enter key press
              const enterEvent = new KeyboardEvent("keydown", {
                key: "Enter",
                code: "Enter",
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true,
              });
              element.dispatchEvent(enterEvent);

              // Also dispatch keyup for completeness
              const enterUpEvent = new KeyboardEvent("keyup", {
                key: "Enter",
                code: "Enter",
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true,
              });
              element.dispatchEvent(enterUpEvent);

              // Wait for potential navigation or search results
              await sleep(1500);
              const newContent = getVisiblePageContent();

              result = {
                success: true,
                message: `Pressed Enter on "${targetLabel}"`,
                visiblePageContentAfterAction: newContent,
              };
              context.setCursor({ visible: false, x: 0, y: 0 });
            } else {
              result = { error: `Input field "${targetLabel}" not found.` };
            }
          }
        } catch (e) {
          result = { error: (e as Error).message };
        }

        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: result,
          },
        });
      }

      response = await chat.sendMessage(functionResponses);
    } else {
      break;
    }
  }

  // Cleanup potential context leakage in response
  finalResponseText = finalResponseText
    .replace(/\[VISIBLE PAGE CONTENT START\]/g, "")
    .replace(/\[VISIBLE PAGE CONTENT END\]/g, "")
    .replace(/\[USER REQUEST\]/g, "")
    .trim();

  return { text: finalResponseText || "Done.", newHistory: [] };
};
