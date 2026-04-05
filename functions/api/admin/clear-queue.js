export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { secret } = body;

    // 간단한 보안 체크 (필요시 env에 ADMIN_SECRET 설정 가능)
    if (secret !== "cherry-blossom-clear") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    if (!env.D1_DB) {
      return new Response(JSON.stringify({ error: "D1 Not Found" }), { status: 500 });
    }

    // 모든 대기열을 초기화 (완료된 것 제외하고 모두 실패 처리하여 다시 줄 서게 함)
    await env.D1_DB.prepare(`
      UPDATE generation_queue 
      SET status = 'failed', updated_at = CURRENT_TIMESTAMP 
      WHERE status IN ('pending', 'processing')
    `).run();

    return new Response(JSON.stringify({ success: true, message: "대기열이 초기화되었습니다." }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
