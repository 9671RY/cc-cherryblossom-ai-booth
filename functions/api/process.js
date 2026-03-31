// /functions/api/process.js

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const formData = await request.formData();
    const file = formData.get('file');
    const prompt = formData.get('prompt') || '';
    const mascotName = formData.get('mascotName') || '꽃등이';
    const providerName = formData.get('providerName') || null;
    const providerPhone = formData.get('providerPhone') || null;

    if (!file) {
      return new Response(JSON.stringify({ error: "No image file provided" }), { status: 400 });
    }

    // 파일 메타데이터 추출
    const fileExtension = file.name.split('.').pop() || 'jpeg';
    const timestamp = Date.now();
    let filename = `original-${timestamp}.${fileExtension}`;
    if (providerName || providerPhone) {
      const namePart = providerName || '무명';
      const phonePart = providerPhone ? `_${providerPhone}` : '';
      filename = `${namePart}${phonePart}_${timestamp}.${fileExtension}`;
    }
    
    // R2 버킷에 업로드
    await env.R2_BUCKET.put(filename, file.stream(), {
      httpMetadata: { contentType: file.type || `image/${fileExtension}` }
    });

    const encodedFilename = encodeURIComponent(filename);
    const originalUrl = `/cdn-cgi/image/width=800/cherryblossom-photos/${encodedFilename}`;

    // 데이터베이스에 레코드 생성
    let uploadId = null;
    if (env.D1_DB) {
      const dbResult = await env.D1_DB.prepare(
        "INSERT INTO photos (original_url, mascot_name, provider_name, provider_phone) VALUES (?, ?, ?, ?) RETURNING id"
      ).bind(originalUrl, mascotName, providerName, providerPhone).first();
      if (dbResult && dbResult.id) {
        uploadId = dbResult.id;
      }
    } else {
      uploadId = timestamp; // 만약 D1 바인딩이 없다면 임시 ID
    }

    // 반환
    return new Response(JSON.stringify({ 
      uploadId,
      originalUrl,
      prompt // Pass the prompt back if needed, but not strictly necessary here
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Process API Error:", error.stack);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
