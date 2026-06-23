import { askChatbot } from "../services/chatbotService.js";

const widgetHost = document.getElementById("chatbotWidget");

if (widgetHost) {
  widgetHost.innerHTML = `
    <section class="chatbot-widget">
      <header>
        <strong>Nexora AI</strong>
        <span>Online</span>
      </header>

      <div class="chat-messages" id="widgetMessages">
        <p class="chat-message">Ask me for recommendations, order tracking, or checkout help.</p>
      </div>

      <form class="chat-form" id="widgetChatForm">
        <input name="message" placeholder="Ask AI" />
        <button class="btn primary" type="submit">Send</button>
      </form>
    </section>
  `;

  bindChat("widgetChatForm", "widgetMessages");
}

if (document.getElementById("fullChatForm")) {
  document.getElementById("fullChatMessages").innerHTML =
    `<p class="chat-message">Hello. I can help you shop with natural language.</p>`;

  bindChat("fullChatForm", "fullChatMessages");
}

function bindChat(formId, messagesId) {
  const form = document.getElementById(formId);
  const messages = document.getElementById(messagesId);

  // ✅ safety check (prevents runtime crash)
  if (!form || !messages) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const input = form.elements.message;
    const text = input.value.trim();

    if (!text) return;

    // show user message
    messages.insertAdjacentHTML(
      "beforeend",
      `<p class="chat-message user">${escapeHtml(text)}</p>`
    );

    input.value = "";

    // disable button to prevent double click
    const button = form.querySelector("button");
    if (button) button.disabled = true;

    // show loading message
    const loadingId = Date.now();
    messages.insertAdjacentHTML(
      "beforeend",
      `<p class="chat-message bot" data-id="${loadingId}">Thinking...</p>`
    );

    messages.scrollTop = messages.scrollHeight;

    try {
      const reply = await askChatbot(text);

      // remove loading
      const loadingMsg = messages.querySelector(`[data-id="${loadingId}"]`);
      if (loadingMsg) loadingMsg.remove();

      // show bot response
      messages.insertAdjacentHTML(
        "beforeend",
        `<p class="chat-message bot">${escapeHtml(reply)}</p>`
      );

    } catch (error) {
      console.error(error);

      const loadingMsg = messages.querySelector(`[data-id="${loadingId}"]`);
      if (loadingMsg) loadingMsg.remove();

      messages.insertAdjacentHTML(
        "beforeend",
        `<p class="chat-message bot">Something went wrong.</p>`
      );
    }

    messages.scrollTop = messages.scrollHeight;

    // enable button again
    if (button) button.disabled = false;
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}