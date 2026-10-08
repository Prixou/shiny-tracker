import { describe, it, expect, vi, afterEach } from 'vitest';

afterEach(() => vi.unstubAllGlobals());

const sse = events => new Response(events.join(''), { status: 200, headers: { 'content-type': 'text/event-stream' } });

describe('connexion à Claude', () => {
  const ev = (type, data) => `event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`;
  const start = (model, n) => ev('message_start', { message: { id: `m${n}`, type: 'message', role: 'assistant', model, content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 1, output_tokens: 1 } } });

  it('boucle d\'outils, historique conservé tel quel, sources et options de requête', async () => {
    const bodies = [];
    vi.stubGlobal('fetch', vi.fn(async (url, init) => {
      bodies.push({ url: String(url), headers: new Headers(init.headers), body: JSON.parse(init.body) });
      if (bodies.length === 1) {
        return sse([
          start('claude-opus-5-5', 1),
          ev('content_block_start', { index: 0, content_block: { type: 'thinking', thinking: '', signature: '' } }),
          ev('content_block_delta', { index: 0, delta: { type: 'signature_delta', signature: 'sig' } }),
          ev('content_block_stop', { index: 0 }),
          ev('content_block_start', { index: 1, content_block: { type: 'text', text: '', citations: [] } }),
          ev('content_block_delta', { index: 1, delta: { type: 'citations_delta', citation: { type: 'web_search_result_location', url: 'https://serebii.net/x', title: 'Serebii', cited_text: 'x', encrypted_index: 'e' } } }),
          ev('content_block_delta', { index: 1, delta: { type: 'text_delta', text: 'Je regarde.' } }),
          ev('content_block_stop', { index: 1 }),
          ev('content_block_start', { index: 2, content_block: { type: 'tool_use', id: 'toolu_1', name: 'mes_chasses', input: {} } }),
          ev('content_block_delta', { index: 2, delta: { type: 'input_json_delta', partial_json: '{}' } }),
          ev('content_block_stop', { index: 2 }),
          ev('message_delta', { delta: { stop_reason: 'tool_use', stop_sequence: null }, usage: { output_tokens: 3 } }),
          ev('message_stop', {})
        ]);
      }
      return sse([
        start('claude-opus-5-5', 2),
        ev('content_block_start', { index: 0, content_block: { type: 'text', text: '' } }),
        ev('content_block_delta', { index: 0, delta: { type: 'text_delta', text: 'Aucune chasse.' } }),
        ev('content_block_stop', { index: 0 }),
        ev('message_delta', { delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 3 } }),
        ev('message_stop', {})
      ]);
    }));
    const { runTurn } = await import('../../src/services/ai/claude.js');
    const text = [];
    const tools = [];
    const res = await runTurn({
      apiKey: 'sk-ant-test', model: 'claude-opus-5-5', system: 'sys', history: [], userText: 'Mes chasses ?', webSearch: true,
      execTool: async name => ({ outil: name, en_cours: [] }), onText: t => text.push(t), onTool: n => tools.push(n)
    });
    expect(text.join('')).toBe('Je regarde.Aucune chasse.');
    expect(tools).toEqual(['mes_chasses']);
    const [first, second] = bodies;
    expect(first.url).toContain('/v1/messages');
    expect(first.headers.get('anthropic-dangerous-direct-browser-access')).toBe('true');
    expect(first.headers.get('anthropic-beta')).toContain('server-side-fallback-2026-07-01');
    expect(first.body).toMatchObject({ model: 'claude-opus-5-5', fallbacks: 'default', cache_control: { type: 'ephemeral' }, output_config: { effort: 'medium' }, stream: true });
    expect(first.body.tools.filter(t => t.input_schema).every(t => t.eager_input_streaming)).toBe(true);
    expect(first.body.tools.map(t => t.type).filter(Boolean)).toEqual(['web_search_20260209', 'web_fetch_20260209']);
    // L'historique renvoyé est complété, jamais réécrit : le bloc de réflexion est renvoyé tel quel.
    expect(second.body.messages[1].content[0]).toEqual({ type: 'thinking', thinking: '', signature: 'sig' });
    expect(second.body.messages[2].content[0]).toMatchObject({ type: 'tool_result', tool_use_id: 'toolu_1' });
    expect(res.history).toHaveLength(4);
    expect(res.sources).toEqual([{ url: 'https://serebii.net/x', title: 'Serebii' }]);
  });

  it('Haiku : pas de repli serveur, outils web de base', async () => {
    let body;
    vi.stubGlobal('fetch', vi.fn(async (url, init) => {
      body = JSON.parse(init.body);
      return sse([
        start('claude-haiku-5-5', 1),
        ev('content_block_start', { index: 0, content_block: { type: 'text', text: '' } }),
        ev('content_block_delta', { index: 0, delta: { type: 'text_delta', text: 'ok' } }),
        ev('content_block_stop', { index: 0 }),
        ev('message_delta', { delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 1 } }),
        ev('message_stop', {})
      ]);
    }));
    const { runTurn } = await import('../../src/services/ai/claude.js');
    await runTurn({ apiKey: 'k', model: 'claude-haiku-5-5', system: 's', history: [], userText: 'x', webSearch: true, execTool: async () => ({}), onText: () => {}, onTool: () => {} });
    expect(body.fallbacks).toBeUndefined();
    expect(body.tools.map(t => t.type).filter(Boolean)).toEqual(['web_search_20250305', 'web_fetch_20250910']);
  });

  it('un refus est signalé sans être ajouté à l\'historique', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => sse([
      start('claude-opus-5-5', 1),
      ev('message_delta', { delta: { stop_reason: 'refusal', stop_sequence: null }, usage: { output_tokens: 1 } }),
      ev('message_stop', {})
    ])));
    const { runTurn } = await import('../../src/services/ai/claude.js');
    const res = await runTurn({ apiKey: 'k', model: 'claude-opus-5-5', system: 's', history: [], userText: 'x', execTool: async () => ({}), onText: () => {}, onTool: () => {} });
    expect(res.refused).toBe(true);
    expect(res.history).toHaveLength(1);
  });

  it('message d\'erreur clair pour une clé refusée', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } }), { status: 401, headers: { 'content-type': 'application/json' } })));
    const { runTurn, describeError } = await import('../../src/services/ai/claude.js');
    const err = await runTurn({ apiKey: 'k', model: 'claude-opus-5-5', system: 's', history: [], userText: 'x', execTool: async () => ({}), onText: () => {}, onTool: () => {} }).catch(e => e);
    expect(describeError(err)).toMatch(/Clé API Claude refusée/);
  });
});

describe('connexion à Gemini', () => {
  const chunk = parts => `data: ${JSON.stringify({ candidates: [{ content: { role: 'model', parts } }] })}\r\n\r\n`;

  it('appels de fonction, signatures conservées et réponse finale', async () => {
    const bodies = [];
    vi.stubGlobal('fetch', vi.fn(async (url, init) => {
      bodies.push({ url: String(url), body: JSON.parse(init.body) });
      if (bodies.length === 1) return sse([chunk([{ functionCall: { name: 'mes_chasses', args: {} }, thoughtSignature: 'sig1' }])]);
      return sse([chunk([{ text: 'Rien ' }]), chunk([{ text: 'en cours.' }])]);
    }));
    const { runTurn } = await import('../../src/services/ai/gemini.js');
    const text = [];
    const res = await runTurn({
      apiKey: 'AIza', model: 'gemini-3.5-flash-lite', system: 'sys', history: [], userText: 'Mes chasses ?',
      execTool: async () => ({ en_cours: [] }), onText: t => text.push(t), onTool: () => {}
    });
    expect(text.join('')).toBe('Rien en cours.');
    expect(bodies[0].url).toContain('gemini-3.5-flash-lite:streamGenerateContent');
    expect(bodies[0].body.tools[0].functionDeclarations.map(f => f.name)).toContain('proposer_action');
    expect(bodies[1].body.contents[1].parts[0]).toEqual({ functionCall: { name: 'mes_chasses', args: {} }, thoughtSignature: 'sig1' });
    expect(bodies[1].body.contents[2].parts[0].functionResponse).toMatchObject({ name: 'mes_chasses', response: { output: { en_cours: [] } } });
    expect(res.history).toHaveLength(4);
  });

  it('quota dépassé : message compréhensible', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: { code: 429, message: 'Resource exhausted', status: 'RESOURCE_EXHAUSTED' } }), { status: 429, headers: { 'content-type': 'application/json' } })));
    const { runTurn, describeError } = await import('../../src/services/ai/gemini.js');
    const err = await runTurn({ apiKey: 'AIza', model: 'm', system: 's', history: [], userText: 'x', execTool: async () => ({}), onText: () => {}, onTool: () => {} }).catch(e => e);
    expect(describeError(err)).toMatch(/Quota gratuit atteint/);
  });
});
