import "server-only";
import OpenAI from "openai";

// Simple, reusable OpenAI client using the Responses API.
// Ensure you only import this from server-side code.
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
