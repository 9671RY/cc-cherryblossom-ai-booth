export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { uploadId } = body;

    if (!uploadId) {
      return new Response(JSON.stringify({ error: "Missing uploadId" }), { status: 400 });
    }

    if (!env.D1_DB) {
      return new Response(JSON.stringify({ status: 'your_turn', position: 0 }), { headers: { 'Content-Type': 'application/json' } });
    }

    // API 키 개수 확인 (병렬 처리 한도)
    const apiKeys = (env.GEMINI_API_KEY || "").split(',').map(k => k.trim()).filter(k => k);
    const maxConcurrency = Math.max(1, apiKeys.length);

    // 1. 큐 테이블 생성
    await env.D1_DB.prepare(`
      CREATE TABLE IF NOT EXISTS generation_queue (
        upload_id INTEGER PRIMARY KEY,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // 2. Stale 레코드 정리 강화 (현재 시간 기준으로 2분 이상 정체된 작업 강제 실패 처리)
    // D1의 datetime('now')가 서버 시간에 따라 오차가 있을 수 있으므로 JS 시간을 활용하거나 보수적으로 처리
    await env.D1_DB.prepare(`
      UPDATE generation_queue 
      SET status = 'failed' 
      WHERE status = 'processing' 
      AND (
        updated_at < datetime('now', '-2 minutes') 
        OR updated_at < datetime('now', 'localtime', '-2 minutes')
      )
    `).run();

    // 3. 현재 큐 상태 확인
    let row = await env.D1_DB.prepare(`
      SELECT * FROM generation_queue WHERE upload_id = ?
    `).bind(uploadId).first();

    if (!row) {
      await env.D1_DB.prepare(`
        INSERT INTO generation_queue (upload_id, status) VALUES (?, 'pending')
      `).bind(uploadId).run();
      row = { upload_id: uploadId, status: 'pending' };
    } else if (row.status === 'failed' || row.status === 'completed') {
      await env.D1_DB.prepare(`
        UPDATE generation_queue SET status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE upload_id = ?
      `).bind(uploadId).run();
      row.status = 'pending';
    }

    if (row.status === 'processing') {
      return new Response(JSON.stringify({ status: 'your_turn', position: 0 }), { headers: { 'Content-Type': 'application/json' } });
    }

    // 4. 현재 처리 중인 인원수 및 내 앞 대기자 수 확인
    const { processingCount } = await env.D1_DB.prepare(`
      SELECT count(*) as processingCount FROM generation_queue WHERE status = 'processing'
    `).first();

    const { waitingPosition } = await env.D1_DB.prepare(`
      SELECT count(*) as waitingPosition FROM generation_queue 
      WHERE status = 'pending' 
      AND created_at < (SELECT created_at FROM generation_queue WHERE upload_id = ?)
    `).bind(uploadId).first();

    // 내 앞의 대기자가 0명 또는 (처리 가능 슬롯이 남았을 때 순번 내)인 경우 차례 배정
    // 여기서 waitingPosition은 나보다 먼저 들어온 사람의 수이므로,
    // (현재 처리중인 수 + 내 앞 대기자 수) < maxConcurrency 면 내가 들어갈 수 있음
    if ((processingCount + waitingPosition) < maxConcurrency) {
      await env.D1_DB.prepare(`
        UPDATE generation_queue SET status = 'processing', updated_at = CURRENT_TIMESTAMP WHERE upload_id = ?
      `).bind(uploadId).run();
      
      return new Response(JSON.stringify({ status: 'your_turn', position: 0 }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ 
      status: 'waiting', 
      position: waitingPosition,
      concurrency: maxConcurrency,
      processing: processingCount
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("Queue API Error:", error.stack);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
