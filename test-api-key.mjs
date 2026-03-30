import { GoogleGenAI } from "@google/genai";

async function main() {
  const ai = new GoogleGenAI({ apiKey: "AIzaSyCtLUnYD6G3ZhFs4Bid3OzBT07SuUiL9e4" });
  
  const dummyBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
  const prompt = "Preserve the image exactly, but add a small red dot to it.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseModalities: ["IMAGE"]
      }
    });
    
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      console.log("Success! Got parts.");
    }
  } catch (err) {
    console.error("Error from Google GenAI:", err.status, err.message);
  }
}

main();
