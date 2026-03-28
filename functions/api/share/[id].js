export async function onRequestPost(context) {
  try {
    const { params, env } = context;
    const uploadId = params.id;

    if (!uploadId) {
      return new Response(JSON.stringify({ error: "No ID provided" }), { status: 400 });
    }

    if (env.D1_DB) {
      await env.D1_DB.prepare(
        "UPDATE photos SET share_count = share_count + 1 WHERE id = ?"
      ).bind(uploadId).run();
    }

    return new Response(JSON.stringify({ success: true }));

  } catch (error) {
    console.error("Share API Error:", error.stack);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
