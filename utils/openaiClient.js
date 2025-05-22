// proxy/src/utils/openaiClient.js
const axios = require("axios");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

async function callOpenAI(prompt) {
  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a motivational AI habit coach that helps users improve based on their personal goals, tracked habits, and notes.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("OpenAI API error:", error.response?.data || error.message);
    throw new Error("Failed to get response from OpenAI");
  }
}

module.exports = { callOpenAI };
