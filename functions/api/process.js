// /functions/api/process.js

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const formData = await request.formData();
    const imageFile = formData.get('image');

    if (!imageFile) {
      return new Response(JSON.stringify({ error: "No image provided" }), { status: 400 });
    }

    // 1. R2 버킷에 원본 이미지 저장
    const fileExtension = imageFile.name.split('.').pop() || 'jpg';
    const originalFilename = `original-${Date.now()}.${fileExtension}`;
    await env.R2_BUCKET.put(originalFilename, await imageFile.arrayBuffer(), {
      httpMetadata: { contentType: imageFile.type }
    });
    // Public URL을 구성 (실제 환경에서는 커스텀 도메인이나 R2 pub.dev URL 사용 필요)
    // 현재는 프론트엔드에서 `/cdn-cgi/image/...` 혹은 직접 worker 라우팅을 할 수 없으므로 
    // 파일명만 저장하고 나중에 다시 불러올 수 있게 구성하는 것이 좋으나,
    // 데모 편의상 원본 이미지는 프론트엔드의 메모리(Blob)에 이미 있으므로 R2 저장만 수행하겠습니다.
    const originalUrl = `/cdn-cgi/image/width=800/cherryblossom-photos/${originalFilename}`; // 예시

    // 2. 데이터베이스에 레코드 생성
    let uploadId = null;
    if (env.D1_DB) {
      const dbResult = await env.D1_DB.prepare(
        "INSERT INTO photos (original_url, result_url) VALUES (?, '') RETURNING id"
      ).bind(originalUrl).first();
      if (dbResult && dbResult.id) {
        uploadId = dbResult.id;
      }
    } else {
      uploadId = Date.now(); // 만약 D1 바인딩이 없다면 임시 ID
    }

    // 3. Gemini API 호출하여 어깨 좌표 파악
    const buffer = await imageFile.arrayBuffer();
    const base64Bytes = btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
    
    const geminiPayload = {
      contents: [{
        parts: [
          { text: 'Analyze this image. Find the optimal pixel coordinates (x, y) on the person\'s shoulder (left or right) where a small mascot could sit. The image has original size and you should return coordinates mapped to its original dimensions. Format your answer as EXACT JSON like this: {"x": 100, "y": 200, "side": "left"}. Do not add any markdown formatting or extra text, just the pure JSON.' },
          { inlineData: { mimeType: imageFile.type, data: base64Bytes } }
        ]
      }]
    };

    const apiKey = env.GEMINI_API_KEY;
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload)
    });

    const geminiData = await geminiRes.json();
    console.log(JSON.stringify(geminiData));

    let coords = { x: 0, y: 0, side: 'left' }; // 기본값

    if (geminiData.candidates && geminiData.candidates.length > 0) {
      let textContent = geminiData.candidates[0].content.parts[0].text.trim();
      textContent = textContent.replace(/```json/g, '').replace(/```/g, '').trim();
      try {
        coords = JSON.parse(textContent);
      } catch (e) {
        console.error("Gemini JSON Parse Error:", textContent);
        // 파싱 실패시 가운데로 임시 배치
        coords = { x: 200, y: 200, side: 'left' };
      }
    }

    return new Response(JSON.stringify({ 
      uploadId,
      x: coords.x, 
      y: coords.y, 
      side: coords.side 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Process API Error:", error.stack);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
