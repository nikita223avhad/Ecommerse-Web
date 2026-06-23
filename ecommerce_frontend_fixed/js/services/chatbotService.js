import { API_BASE_URL, ENDPOINTS } from "../config/api-config.js";

export async function askChatbot(message) {
  try {
    const user = JSON.parse(localStorage.getItem("user"));

    console.log("Logged in user:", user);

    const response = await fetch(
      `${API_BASE_URL}${ENDPOINTS.chatbot}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: message,
          user_id: user.id
        }),
      }
    );

    const data = await response.json();

    console.log("Chatbot Response:", data);

    return (
      data.answer ||
      data.message ||
      "No response received."
    );

  } catch (error) {
    console.error(error);
    return "Unable to connect to AI service.";
  }
}