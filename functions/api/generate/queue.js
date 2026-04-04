export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { uploadId } = body;

    if (!uploadId) {
      return new Response(JSON.stringify({ error: "Missing uploadId" }), { status: 400 });
    }

    if (!env.D1_DB) {
      // D1이 연결되지 않은 로컬 환경 등에서는 즉시 처리
      return new Response(JSON.stringify({ status: 'your_turn', position: 0 }), { headers: { 'Content-Type': 'application/json' } });
    }

    // 1. 큐 테이블 생성 (최초 1회 동작 보장, 기존 photos 테이블에 영향 없음)
    await env.D1_DB.prepare(`
      CREATE TABLE IF NOT EXISTS generation_queue (
        upload_id INTEGER PRIMARY KEY,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // 2. Stale 레코드 정리 (1분 이상 processing 인 경우 failed 처리 / 타임아웃 방지)
    await env.D1_DB.prepare(`
      UPDATE generation_queue 
      SET status = 'failed' 
      WHERE status = 'processing' AND updated_at < datetime('now', '-1.5 minute')
    `).run();

    // 3. 현재 큐 상태 확인
    let row = await env.D1_DB.prepare(`
      SELECT * FROM generation_queue WHERE upload_id = ?
    `).bind(uploadId).first();

    if (!row) {
      // 큐에 추가
      await env.D1_DB.prepare(`
        INSERT INTO generation_queue (upload_id, status) VALUES (?, 'pending')
      `).bind(uploadId).run();
      row = { upload_id: uploadId, status: 'pending' };
    } else if (row.status === 'failed') {
      // 실패했던 작업이 다시 들어오면(재시도 등) 큐 후순위로 재진입
      await env.D1_DB.prepare(`
        UPDATE generation_queue SET status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE upload_id = ?
      `).bind(uploadId).run();
      row.status = 'pending';
    } else if (row.status === 'completed') {
      // 이미 끝난 경우 재처리
      await env.D1_DB.prepare(`
        UPDATE generation_queue SET status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE upload_id = ?
      `).bind(uploadId).run();
      row.status = 'pending';
    }

    // 내 상태가 이미 processing이면 차례 진입 허용
    if (row.status === 'processing') {
      return new Response(JSON.stringify({ status: 'your_turn', position: 0 }), { headers: { 'Content-Type': 'application/json' } });
    }

    // 4. 처리 중인 개수 확인
    const processingResult = await env.D1_DB.prepare(`
      SELECT count(*) as count FROM generation_queue WHERE status = 'processing'
    `).first();
    const processingCount = processingResult.count;

    // 5. 내 앞의 대기자 수 확인
    const waitResult = await env.D1_DB.prepare(`
      SELECT count(*) as count FROM generation_queue WHERE status = 'pending' AND created_at < (SELECT created_at FROM generation_queue WHERE upload_id = ?)
    `).bind(uploadId).first();
    const waitingPosition = waitResult.count || 0;

    // 현재 처리중인 작업이 1개 미만(0개)이고, 대기도 1등이면 차례 배정
    // 보수적으로 1명씩만 처리하도록 1로 지정 (rate limit 방지)
    if (processingCount < 1 && waitingPosition === 0) {
      await env.D1_DB.prepare(`
        UPDATE generation_queue SET status = 'processing', updated_at = CURRENT_TIMESTAMP WHERE upload_id = ?
      `).bind(uploadId).run();
      
      return new Response(JSON.stringify({ status: 'your_turn', position: 0 }), { headers: { 'Content-Type': 'application/json' } });
    }

    // 차례가 아니면 현재 대기 번호 응답
    return new Response(JSON.stringify({ status: 'waiting', position: waitingPosition }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("Queue API Error:", error.stack);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
