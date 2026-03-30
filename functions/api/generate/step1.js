import { GoogleGenAI } from "@google/genai";

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { uploadId, prompt: userPrompt } = body;

    if (!uploadId) {
      return new Response(JSON.stringify({ error: "Missing uploadId data" }), { status: 400 });
    }

    // 1. D1에서 원본 URL 가져오기
    let originalUrl = null;
    let originalFilename = null;
    if (env.D1_DB) {
      const dbResult = await env.D1_DB.prepare(
        "SELECT original_url FROM photos WHERE id = ?"
      ).bind(uploadId).first();
      
      if (dbResult && dbResult.original_url) {
        originalUrl = dbResult.original_url;
      }
    }

    if (!originalUrl) {
      throw new Error("원본 사진을 찾을 수 없습니다.");
    }

    originalFilename = originalUrl.split('/').pop();

    // 2. R2에서 유저 사진 가져오기
    const userImgObj = await env.R2_BUCKET.get(originalFilename);
    const userMimeType = userImgObj?.httpMetadata?.contentType || "image/jpeg";
    if (!userImgObj) {
      throw new Error("R2에서 유저 사진을 다운로드하는 데 실패했습니다.");
    }
    const userImgBuffer = await userImgObj.arrayBuffer();
    const userBase64 = arrayBufferToBase64(userImgBuffer);

    // 3. ASSETS에서 마스코트(꽃등이) 사진 가져오기
    const mascotRes = await env.ASSETS.fetch(new URL('/꽃등이.jpg', request.url));
    if (!mascotRes.ok) {
      throw new Error("마스코트 이미지를 에셋에서 가져오지 못했습니다.");
    }
    const mascotBuffer = await mascotRes.arrayBuffer();
    const mascotBase64 = arrayBufferToBase64(mascotBuffer);

    // 4. Gemini API 호출
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    
    // 수채화 스타일 프롬프트 작성
    const basePrompt = "위의 두 이미지를 참고하여, 첫 번째 사진(사용자 얼굴 사진)의 속성을 최대한 유지하면서 사용자의 어깨 위에 두 번째 사진(귀여운 핑크색 벚꽃 캐릭터 '꽃등이')이 자연스럽게 앉아있는 합성 장면을 부드럽고 따뜻한 수채화(Watercolor) 일러스트레이션 스타일로 하나로 합쳐서 새롭게 그려줘. 원본 인물의 특징을 살추되 수채화풍으로 표현해줘.";
    const finalPrompt = userPrompt ? `${basePrompt} 추가 요청: ${userPrompt}` : basePrompt;
    
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: [
        finalPrompt,
        { inlineData: { mimeType: userMimeType, data: userBase64 } },
        { inlineData: { mimeType: "image/jpeg", data: mascotBase64 } }
      ],
      config: {
        responseModalities: ["IMAGE"]
      }
    });

    let generatedBase64 = null;
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          generatedBase64 = part.inlineData.data;
          break;
        }
      }
    }

    if (!generatedBase64) {
      throw new Error("이미지 생성에 실패했거나 NO_IMAGE가 반환되었습니다.");
    }

    // 5. 결과 R2 버킷에 저장
    const fileExtension = 'jpeg';
    const filename = `result1-${uploadId}-${Date.now()}.${fileExtension}`;
    
    // base64 to Uint8Array
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

    // 6. DB 업데이트
    if (env.D1_DB) {
      await env.D1_DB.prepare(
        "UPDATE photos SET result1_url = ? WHERE id = ?"
      ).bind(result1Url, uploadId).run();
    }

    // 7. 성공 응답
    return new Response(JSON.stringify({ 
      uploadId,
      result1Url,
      result1Base64: generatedBase64
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Step 1 API Error:", error.stack || error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
