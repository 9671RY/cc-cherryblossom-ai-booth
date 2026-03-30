import { GoogleGenAI } from "@google/genai";

async function main() {
  const ai = new GoogleGenAI({ apiKey: "YOUR_API_KEY_HERE" });
  
  const dummyBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
  const prompt = "귀엽고 작은 핑크색 벚꽃 랜턴 마스코트 캐릭터를 높은 품질의 일러스트 수채화풍으로 그려줘.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: prompt,
      config: {
        responseModalities: ["IMAGE"]
      }
    });
    
    console.log(JSON.stringify(response, null, 2));
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      console.log("Success! Got parts.");
    }
  } catch (err) {
    console.error("Error from Google GenAI:", err.status, err.message);
  }
}

main();
