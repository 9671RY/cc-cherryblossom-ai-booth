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
        "INSERT INTO photos (original_url) VALUES (?) RETURNING id"
      ).bind(originalUrl).first();
      if (dbResult && dbResult.id) {
        uploadId = dbResult.id;
      }
    } else {
      uploadId = Date.now(); // 만약 D1 바인딩이 없다면 임시 ID
    }

    // 3. 반환
    return new Response(JSON.stringify({ 
      uploadId,
      originalUrl
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Process API Error:", error.stack);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
