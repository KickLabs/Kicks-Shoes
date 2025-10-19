import express from 'express';

const router = express.Router();

// Streams FTES AI response to the client to avoid browser CORS
router.post('/stream', async (req, res) => {
  try {
    const aiApiUrl =
      process.env.AI_API_URL || 'https://ai.ftes.vn/api/ai/rag_agent_template/stream';
    const aiToken = process.env.AI_TOKEN; // Bearer token expected by FTES API

    // Prepare form data from incoming request
    const form = new URLSearchParams();
    const { query, bot_id, conversation_id, model_name, api_key } = req.body || {};

    if (!query || !bot_id || !model_name || !api_key) {
      return res
        .status(400)
        .json({ message: 'Missing required fields: query, bot_id, model_name, api_key' });
    }

    form.append('query', query);
    form.append('bot_id', bot_id);
    form.append('conversation_id', conversation_id || '');
    form.append('model_name', model_name);
    form.append('api_key', api_key);

    // Call external FTES API with server-side fetch and stream back response
    const upstream = await fetch(aiApiUrl, {
      method: 'POST',
      headers: {
        Authorization: aiToken ? `Bearer ${aiToken}` : undefined,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => '');
      return res.status(upstream.status || 502).send(text || 'Upstream error');
    }

    // Set headers for streaming text
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Use Web Streams API reader for compatibility on Node 18+
    const reader = upstream.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        res.write(Buffer.from(value));
      }
    }
    res.end();
  } catch (error) {
    console.error('AI proxy error:', error);
    res.status(500).json({ message: 'AI proxy error' });
  }
});

export default router;
