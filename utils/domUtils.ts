/**
 * Utility functions for the AI Agent to interact with the DOM.
 */

// Helper to get all relevant interactable elements
// REMOVED 'h3' to prevent clicking non-interactive containers that wrap buttons.
const getInteractables = () => {
  return Array.from(
    document.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [role="textbox"], [role="searchbox"], [contenteditable="true"], .cursor-pointer, [type="search"], [type="text"]',
    ),
  );
};

// Calculate element center coordinates
export const getElementCenter = (element: Element) => {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
};

/**
 * Robust click simulation for React applications.
 * Triggers both native click and bubbling MouseEvents to ensure React listeners fire.
 */
export const simulateClick = (element: Element) => {
  // 1. Dispatch MouseEvents for visual states (:active, :focus)
  // We keep mousedown/mouseup to simulate the full press cycle, but we DO NOT dispatch 'click' manually
  // because element.click() below generates the click event automatically.
  const mouseEventInit = {
    view: window,
    bubbles: true,
    cancelable: true,
    buttons: 1, // Left mouse button
  };

  element.dispatchEvent(new MouseEvent("mousedown", mouseEventInit));
  element.dispatchEvent(new MouseEvent("mouseup", mouseEventInit));

  // 2. Trigger the click
  if (element instanceof HTMLElement) {
    // .click() invokes the element's click method, which fires a 'click' event that bubbles.
    // This is the standard way to programmatically click in DOM.
    element.click();

    // 3. Focus if it's an input/textarea
    if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
      element.focus();
    }
  } else {
    // Fallback for non-HTMLElement nodes (like SVG or generic Elements) that might not have .click()
    // only then do we manually dispatch the click event.
    element.dispatchEvent(new MouseEvent("click", mouseEventInit));
  }
};

// Universal helper to detect if an element is clickable (works across all websites)
const isClickableElement = (element: Element): boolean => {
  const htmlEl = element as HTMLElement;
  const computedStyle = window.getComputedStyle(element);

  // 1. Check if element has click event listeners
  // Note: We can't directly check addEventListener listeners, but we can check onclick
  if (htmlEl.onclick !== null || element.getAttribute("onclick") !== null) {
    return true;
  }

  // 2. Check cursor style (most reliable universal indicator)
  if (computedStyle.cursor === "pointer") {
    return true;
  }

  // 3. Check ARIA roles that indicate interactivity
  const role = element.getAttribute("role");
  if (
    role === "button" ||
    role === "link" ||
    role === "menuitem" ||
    role === "tab" ||
    role === "option" ||
    role === "checkbox" ||
    role === "radio"
  ) {
    return true;
  }

  // 4. Check if it's a semantic interactive element
  const tagName = element.tagName.toLowerCase();
  if (
    tagName === "a" ||
    tagName === "button" ||
    tagName === "select" ||
    tagName === "details" ||
    tagName === "summary"
  ) {
    return true;
  }

  // 5. Check for tabindex (indicates keyboard interactivity)
  if (
    element.hasAttribute("tabindex") &&
    element.getAttribute("tabindex") !== "-1"
  ) {
    return true;
  }

  // 6. Check for common data attributes that indicate interactivity
  if (
    element.hasAttribute("data-clickable") ||
    element.hasAttribute("data-action") ||
    element.hasAttribute("data-toggle") ||
    element.hasAttribute("data-target")
  ) {
    return true;
  }

  return false;
};

// Find an element by fuzzy text matching
export const findElementByText = (text: string): Element | null => {
  const lowerText = text.toLowerCase();
  const elements = getInteractables();

  const matches = (el: Element): boolean => {
    const content = (el.textContent || "").toLowerCase();
    const aria = el.getAttribute("aria-label")?.toLowerCase() || "";
    const placeholder =
      (el as HTMLInputElement).placeholder?.toLowerCase() || "";
    // Check name attribute (e.g., name="q" for Google search)
    const name = el.getAttribute("name")?.toLowerCase() || "";
    // Check title attribute
    const title = el.getAttribute("title")?.toLowerCase() || "";
    // Check value attribute
    const value = (el as HTMLInputElement).value?.toLowerCase() || "";
    // Check type attribute (e.g., type="search")
    const type = el.getAttribute("type")?.toLowerCase() || "";

    return (
      content.includes(lowerText) ||
      aria.includes(lowerText) ||
      placeholder.includes(lowerText) ||
      name.includes(lowerText) ||
      title.includes(lowerText) ||
      value.includes(lowerText) ||
      (lowerText.includes("search") && type === "search") ||
      (lowerText.includes("tìm") && type === "search")
    );
  };

  // Filter candidates
  let candidates = elements.filter(matches);

  // If no direct match, try to find parent containers with the text
  if (candidates.length === 0) {
    // Look for any element containing the text (including non-interactive ones)
    const allElements = Array.from(document.querySelectorAll("*"));
    const textMatches = allElements.filter((el) => {
      const content = (el.textContent || "").toLowerCase();
      return content.includes(lowerText) && el.children.length > 0; // Has children (likely a container)
    });

    // For each text match, find the closest clickable parent
    for (const textEl of textMatches) {
      let current: Element | null = textEl;
      while (current && current !== document.body) {
        if (isClickableElement(current)) {
          candidates.push(current);
          break;
        }
        current = current.parentElement;
      }
    }
  }

  if (candidates.length === 0) {
    // Fallback: If searching for "search" or "tìm kiếm", try to find any visible search input
    if (
      lowerText.includes("search") ||
      lowerText.includes("tìm") ||
      lowerText.includes("kiếm")
    ) {
      const searchInputs = Array.from(
        document.querySelectorAll<HTMLInputElement>(
          'input[type="search"], input[type="text"], textarea, [role="searchbox"], [role="textbox"]',
        ),
      ).filter((el) => {
        // Only return visible and interactable elements
        const rect = el.getBoundingClientRect();
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          window.getComputedStyle(el).visibility !== "hidden" &&
          window.getComputedStyle(el).display !== "none"
        );
      });

      if (searchInputs.length > 0) {
        // Prefer focused or main search input (usually the first visible one)
        return searchInputs[0];
      }
    }
    return null;
  }

  // PRIORITY LOGIC:
  // 1. Prefer Exact Match (shortest text length difference)
  // This prevents finding the whole "Card" container when searching for just "Buy"
  candidates.sort((a, b) => {
    const aLen = (a as HTMLElement).innerText?.length || 1000;
    const bLen = (b as HTMLElement).innerText?.length || 1000;
    return aLen - bLen;
  });

  // Return the best match
  return candidates[0];
};

// Clean text content for the AI context
export const getVisiblePageContent = (): string => {
  // Clone body to not mess with original
  const bodyClone = document.body.cloneNode(true) as HTMLElement;

  // Remove chatbot widget and overlay to prevent AI from reading its own content
  const chatbotRoot = bodyClone.querySelector("#ai-chatbot-extension-root");
  if (chatbotRoot) {
    chatbotRoot.remove();
  }

  // Get clean text content
  const bodyText = bodyClone.innerText || bodyClone.textContent || "";

  // Simple heuristic to remove huge chunks of scripts or styles if they leaked into innerText (usually distinct)
  // Limit length to avoid token limits
  return bodyText.replace(/\s+/g, " ").trim().substring(0, 10000);
};

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
