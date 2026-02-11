// DOM Elements
const apiKeyInput = document.getElementById("apiKey");
const toggleKeyBtn = document.getElementById("toggleKey");
const enableChatbotCheckbox = document.getElementById("enableChatbot");
const saveBtn = document.getElementById("saveBtn");
const clearBtn = document.getElementById("clearBtn");
const statusDiv = document.getElementById("status");

// Load saved settings
chrome.storage.sync.get(["geminiApiKey", "chatbotEnabled"], (result) => {
  if (result.geminiApiKey) {
    apiKeyInput.value = result.geminiApiKey;
  }
  enableChatbotCheckbox.checked = result.chatbotEnabled !== false; // Default true
});

// Toggle API key visibility
let isKeyVisible = false;
toggleKeyBtn.addEventListener("click", () => {
  isKeyVisible = !isKeyVisible;
  apiKeyInput.type = isKeyVisible ? "text" : "password";
  toggleKeyBtn.textContent = isKeyVisible ? "🙈" : "👁️";
});

// Show status message
function showStatus(message, isError = false) {
  statusDiv.textContent = message;
  statusDiv.className = "status " + (isError ? "error" : "success");

  setTimeout(() => {
    statusDiv.style.display = "none";
  }, 3000);
}

// Save settings
saveBtn.addEventListener("click", () => {
  const apiKey = apiKeyInput.value.trim();
  const chatbotEnabled = enableChatbotCheckbox.checked;

  if (!apiKey) {
    showStatus("⚠️ Vui lòng nhập API key!", true);
    return;
  }

  // Validate API key format (basic check)
  if (apiKey.length < 20) {
    showStatus("⚠️ API key không hợp lệ!", true);
    return;
  }

  chrome.storage.sync.set(
    {
      geminiApiKey: apiKey,
      chatbotEnabled: chatbotEnabled,
    },
    () => {
      showStatus("✅ Đã lưu cấu hình thành công!");

      // Notify content scripts to reload chatbot
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs
            .sendMessage(tab.id, {
              action: "configUpdated",
              chatbotEnabled: chatbotEnabled,
            })
            .catch(() => {
              // Ignore errors for tabs that don't have content script
            });
        });
      });
    },
  );
});

// Clear all data
clearBtn.addEventListener("click", () => {
  if (confirm("Bạn có chắc muốn xóa tất cả dữ liệu cấu hình?")) {
    chrome.storage.sync.clear(() => {
      apiKeyInput.value = "";
      enableChatbotCheckbox.checked = true;
      showStatus("🗑️ Đã xóa tất cả dữ liệu!");
    });
  }
});

// Enter key to save
apiKeyInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    saveBtn.click();
  }
});
