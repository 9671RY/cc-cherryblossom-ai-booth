// /functions/api/process.js

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: "No prompt provided" }), { status: 400 });
    }

    // 1. 이미지 원본이 없으므로 DB 에러를 막기 위해 더미 텍스트 삽입
    const originalUrl = 'text-prompt-only';

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
