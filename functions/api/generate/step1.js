import { GoogleGenAI } from "@google/genai";

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { uploadId, prompt: userPrompt } = body;

    if (!uploadId || !userPrompt) {
      return new Response(JSON.stringify({ error: "Missing uploadId or prompt data" }), { status: 400 });
    }

    // Initialize Google Gen AI with the provided API key
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

    // Text-to-Image용 보정 프롬프트 결합
    const finalPrompt = `${userPrompt}. 그리고 이 장면에 자연스럽게 어우러지는 귀엽고 작은 핑크색 벚꽃 랜턴 마스코트 캐릭터 '꽃등이'를 높은 품질의 일러스트 수채화풍으로 그려줘.`;
    
    // 사용자가 요청한 최신 generateContent 방식 적용
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: finalPrompt,
      config: {
        // 이미지를 반환하도록 설정
        responseModalities: ["IMAGE"]
      }
    });

    let generatedBase64 = null;

    // 패키지의 응답 형식에 따라 base64 이미지를 추출합니다.
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          generatedBase64 = part.inlineData.data;
          break;
        }
      }
    }

    if (!generatedBase64) {
      throw new Error("Gemini returned successfully, but no image data was found in response.");
    }

    // 2. R2 버킷에 저장
    const fileExtension = 'jpeg';
    const filename = `result1-${uploadId}-${Date.now()}.${fileExtension}`;
    
    // base64 to buffer
    const binaryString = atob(generatedBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    await env.R2_BUCKET.put(filename, bytes.buffer, {
      httpMetadata: { contentType: `image/${fileExtension}` }
    });
    
    const result1Url = `/cdn-cgi/image/width=800/cherryblossom-photos/${filename}`;

    // 3. DB 업데이트
    if (env.D1_DB && uploadId) {
      await env.D1_DB.prepare(
        "UPDATE photos SET result1_url = ? WHERE id = ?"
      ).bind(result1Url, uploadId).run();
    }

    return new Response(JSON.stringify({ 
      uploadId,
      result1Url,
      result1Base64: generatedBase64
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Step 1 API Error:", error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
