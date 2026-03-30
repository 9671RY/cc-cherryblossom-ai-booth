import { GoogleGenAI } from "@google/genai";

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { uploadId, imageBase64, mimeType } = body;

    if (!uploadId || !imageBase64) {
      return new Response(JSON.stringify({ error: "Missing uploadId or image data" }), { status: 400 });
    }

    // Initialize Google Gen AI with the provided API key
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

    // 수정된 프롬프트: 비율 강제를 제거하고, 마스코트에 대한 자세한 영문/국문 묘사 추가
    const prompt = "Please redraw this image. Based strictly on the original image, add a small, cute pink cherry blossom lantern mascot character named 'Kkot-deung-i' standing on the person's shoulder and waving its hand happily. Keep the original face and background style as close to the original as possible. (Maintain original aspect ratio)";
    
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: [
        { text: prompt },
        { inlineData: { mimeType: mimeType || "image/jpeg", data: imageBase64 } }
      ]
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
