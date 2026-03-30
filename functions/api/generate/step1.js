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

    // 수정된 프롬프트: 원본 사진(얼굴, 배경, 스타일)을 100% 동일하게 유지하면서 어깨에만 캐릭터 합성 
    const prompt = "Act as an expert image editor. Your ONLY task is to add a small, cute pink cherry blossom lantern mascot character named 'Kkot-deung-i' standing naturally on the person's shoulder and waving its hand happily. You MUST completely preserve the original person's face, body, clothing, and the background exactly as they are without ANY style changes or alterations. The final image must look like the original photo with just the mascot added. Maintain original aspect ratio.";
    
    // 사용자가 요청한 최신 멀티턴(Chat) 방식 및 responseModalities 적용
    const chat = ai.chats.create({
      model: "gemini-3.1-flash-image-preview",
      config: {
        responseModalities: ["TEXT", "IMAGE"]
      }
    });

    const response = await chat.sendMessage({
      message: [
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
