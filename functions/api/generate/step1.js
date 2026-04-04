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
  let globalUploadId = null;
  try {
    const { request, env } = context;
    const body = await request.json();
    const { uploadId, prompt: userPrompt } = body;
    globalUploadId = uploadId;

    if (!uploadId) {
      return new Response(JSON.stringify({ error: "Missing uploadId data" }), { status: 400 });
    }

    // 1. D1에서 원본 URL 가져오기
    let originalUrl = null;
    let originalFilename = null;
    let providerName = null;
    let providerPhone = null;
    if (env.D1_DB) {
      const dbResult = await env.D1_DB.prepare(
        "SELECT original_url, provider_name, provider_phone FROM photos WHERE id = ?"
      ).bind(uploadId).first();
      
      if (dbResult && dbResult.original_url) {
        originalUrl = dbResult.original_url;
        providerName = dbResult.provider_name;
        providerPhone = dbResult.provider_phone;
      }
    }

    if (!originalUrl) {
      throw new Error("원본 사진을 찾을 수 없습니다.");
    }

    originalFilename = decodeURIComponent(originalUrl.split('/').pop());

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
    const basePrompt = "매우 중요: 첫 번째 사진(사용자 얼굴)과 두 번째 사진(벚꽃 캐릭터 '꽃등이')의 원본 형태, 생김새, 특징을 절대 변형하지 말고 있는 그대로 똑같이 유지하세요. 창의적인 변형(AI의 상상력 추가)을 절대 금지합니다. 오직 원본 이미지들을 그대로 유지한 채, 인물의 어깨 위에 캐릭터가 자연스럽게 올려져 있는 구도로만 합성해 주세요. 그리고 그 합성된 전체 장면에만 옅고 부드러운 수채화(Watercolor) 필터 느낌을 입혀주세요.";
    
    // 숨겨진 프롬프트: 기본적으로 웃는 얼굴 추가
    const hiddenPrompt = "반드시 인물과 캐릭터 모두 밝고 자연스럽게 웃는 얼굴로 그려줘.";
    const finalPrompt = userPrompt 
      ? `${basePrompt} 추가 요청: ${userPrompt} (${hiddenPrompt})` 
      : `${basePrompt} (${hiddenPrompt})`;
    
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
    const timestamp = Date.now();
    let filename = `result1-${uploadId}-${timestamp}.${fileExtension}`;
    if (providerName || providerPhone) {
      const namePart = providerName || '무명';
      const phonePart = providerPhone ? `_${providerPhone}` : '';
      filename = `${namePart}${phonePart}_결과_${timestamp}.${fileExtension}`;
    }
    
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
    
    const encodedFilename = encodeURIComponent(filename);
    const result1Url = `/cdn-cgi/image/width=800/cherryblossom-photos/${encodedFilename}`;

    // 6. DB 업데이트 (photos 테이블 및 큐 상태 업데이트)
    if (env.D1_DB) {
      await env.D1_DB.prepare(
        "UPDATE photos SET result1_url = ? WHERE id = ?"
      ).bind(result1Url, uploadId).run();

      // 큐 정리
      await env.D1_DB.prepare(
        "UPDATE generation_queue SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE upload_id = ?"
      ).bind(uploadId).run();
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
    
    // 에러 발생시 큐 실패 처리
    if (context.env.D1_DB && globalUploadId) {
      try {
        await context.env.D1_DB.prepare(
          "UPDATE generation_queue SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE upload_id = ?"
        ).bind(globalUploadId).run();
      } catch (e) {
        // 무시
      }
    }

    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
