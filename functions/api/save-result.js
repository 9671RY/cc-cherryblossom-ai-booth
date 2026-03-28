// /functions/api/save-result.js

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { uploadId, resultDataUrl } = body;

    if (!uploadId || !resultDataUrl) {
      return new Response(JSON.stringify({ error: "Missing data" }), { status: 400 });
    }

    // Data URL 파싱 (data:image/jpeg;base64,.....)
    const matches = resultDataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return new Response(JSON.stringify({ error: "Invalid image format" }), { status: 400 });
    }

    const type = matches[1];
    const base64Data = matches[2];
    
    const binaryStr = atob(base64Data);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // 1. R2 버킷에 결과 이미지 저장
    const extension = type.split('/')[1] || 'jpg';
    const resultFilename = `result-${uploadId}-${Date.now()}.${extension}`;
    await env.R2_BUCKET.put(resultFilename, bytes.buffer, {
      httpMetadata: { contentType: type }
    });

    const resultUrl = `/cdn-cgi/image/width=800/cherryblossom-photos/${resultFilename}`;

    // 2. 데이터베이스 업데이트 (Result URL)
    if (env.D1_DB) {
      await env.D1_DB.prepare(
        "UPDATE photos SET result_url = ? WHERE id = ?"
      ).bind(resultUrl, uploadId).run();
    }

    return new Response(JSON.stringify({ success: true, resultUrl }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Save Result API Error:", error.stack);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
