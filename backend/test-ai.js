const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function main() {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'Say hello!' }],
      model: 'llama-3.1-8b-instant',
    });
    console.log("Success! Response from Groq:", chatCompletion.choices[0].message.content);
  } catch (error) {
    console.error("Groq Error Details:", error);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }
  }
}

main();
