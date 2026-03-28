export async function onRequestGet(context) {
  try {
    const { env } = context;

    let totalShares = 0;
    let photos = [];

    if (env.D1_DB) {
      // 총 공유 수
      const sumResult = await env.D1_DB.prepare(
        "SELECT SUM(share_count) as total FROM photos"
      ).first();
      
      if (sumResult && sumResult.total) {
        totalShares = sumResult.total;
      }

      // 최신 50개 리스트
      const listResult = await env.D1_DB.prepare(
        "SELECT * FROM photos ORDER BY created_at DESC LIMIT 50"
      ).all();
      
      if (listResult && listResult.results) {
        photos = listResult.results;
      }
    }

    return new Response(JSON.stringify({ totalShares, photos }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Admin Stats API Error:", error.stack);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
