export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { uploadId, imageBase64, mimeType } = body;

    if (!uploadId || !imageBase64) {
      return new Response(JSON.stringify({ error: "Missing uploadId or image data" }), { status: 400 });
    }

    const prompt = "Please convert this image into a clean, black-and-white coloring book style illustration suitable for children. (aspect ratio is 1:1)";
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${env.GEMINI_API_KEY}`;
    
    const geminiPayload = {
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType: mimeType || "image/jpeg", data: imageBase64 } }
        ]
      }]
    };

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload)
    });

    if (!geminiRes.ok) {
        const errorText = await geminiRes.text();
        throw new Error(`Gemini API Error: ${errorText}`);
    }

    const geminiData = await geminiRes.json();
    
    // 생성된 Base64 이미지 추출
    let generatedBase64 = null;
    const parts = geminiData.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        generatedBase64 = part.inlineData.data;
        break;
      }
    }

    if (!generatedBase64) {
      throw new Error("Gemini returned successfully, but no image data was found.");
    }

    // 2. R2 버킷에 저장
    const fileExtension = 'jpeg';
    const filename = `result2-${uploadId}-${Date.now()}.${fileExtension}`;
    
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
    
    const result2Url = `/cdn-cgi/image/width=800/cherryblossom-photos/${filename}`;

    // 3. DB 업데이트
    if (env.D1_DB && uploadId) {
      await env.D1_DB.prepare(
        "UPDATE photos SET result2_url = ? WHERE id = ?"
      ).bind(result2Url, uploadId).run();
    }

    return new Response(JSON.stringify({ 
      uploadId,
      result2Url,
      result2Base64: generatedBase64
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Step 2 API Error:", error.stack || error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
