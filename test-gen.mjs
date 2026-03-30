import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";

async function main() {
  const ai = new GoogleGenAI({ apiKey: "AIzaSyCtLUnYD6G3ZhFs4Bid3OzBT07SuUiL9e4" });

  const prompt = "Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: prompt,
    });
    
    console.log("Raw response object keys:", Object.keys(response));
    if (response.candidates) {
      console.log("Candidates:", JSON.stringify(response.candidates[0], null, 2));
    }
  } catch (err) {
    console.error("Error:", JSON.stringify(err, null, 2));
    console.error(err.message);
  }
}

main();
