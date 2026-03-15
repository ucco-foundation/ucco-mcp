/* ── UCCO Foundation MCP Server ── */
/* mcp.ucco.foundation — Streamable HTTP + OAuth 2.1, JSON-RPC 2.0 */

const PROTOCOL_VERSION = "2025-03-26";
const SERVER_NAME = "ucco-foundation";
const SERVER_VERSION = "1.1.0";

/* ══════════════════════════════════════════════════════════════════
   CRYPTO HELPERS
   ══════════════════════════════════════════════════════════════════ */

async function sha256(input) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Base64url(input) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomHex(bytes) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function hashIP(ip) {
  const data = new TextEncoder().encode(ip + "ucco-mcp-salt");
  const hash = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(hash))).slice(0, 16);
}

/* ══════════════════════════════════════════════════════════════════
   STATIC FOUNDATION DATA
   ══════════════════════════════════════════════════════════════════ */

const FOUNDATION_DATA = {
  standard: {
    name: "Universal Capability Chain Object (UCCO)",
    publisher: "UCCA Inc",
    governing_body: "UCCO Foundation, Inc.",
    current_version: "1.1 Rev2",
    status: "Draft for Public Comment",
    date: "March 2026",
    lines: 1141,
    structure: "Full ISO-style — Scope, Normative References, Terms and Definitions, Identity Primitives, Capability Envelopes, Chain Events, Attestation, Store-and-Forward, Supervision Chain, Revocation. Annexes A-D.",
    submissions: [
      { body: "ISO TC 307", status: "Submitted for adoption consideration" },
      { body: "NIST NCCoE", status: "Submitted for adoption consideration" },
      { body: "W3C Verifiable Credentials Working Group", status: "Submitted for adoption consideration" },
    ],
    repository: "https://github.com/ucco-foundation/ucco-standard",
    license: "W3C Software and Document License",
    next_version: "2.0 (planned, not started)",
  },
  foundation: {
    name: "UCCO Foundation, Inc.",
    type: "Nonprofit corporation",
    jurisdiction: "Kentucky, United States",
    status: "Pending incorporation",
    founded: 2026,
    purpose: "Govern the UCCO open standard for cryptographic capability verification",
    website: "https://ucco.foundation",
    repository: "https://github.com/ucco-foundation",
    press_office: "https://pr.ucco.foundation",
    contact: "admin@ucco.foundation",
    leadership: [
      { name: "Tim Rignold", role: "President & Chair" },
      { name: "Jimmy Kuo", role: "Treasurer & Director" },
    ],
  },
  protocol_stack: {
    description: "UCCO completes the internet's trust stack by adding a capability verification layer.",
    stack: [
      { layer: 3, protocol: "UCCO", function: "WHAT YOU CAN DO", status: "Draft for Public Comment" },
      { layer: 2, protocol: "W3C Verifiable Credentials", function: "WHAT CREDENTIALS YOU HOLD", status: "Emerging standard" },
      { layer: 1, protocol: "OAuth 2.0 / OpenID Connect", function: "WHO YOU ARE", status: "Established" },
    ],
    positioning: "We're not competing. We're completing.",
  },
  spec_outline: {
    version: "1.1 Rev2",
    sections: [
      { number: "1", title: "Scope" },
      { number: "2", title: "Normative References" },
      { number: "3", title: "Terms and Definitions" },
      { number: "4", title: "Identity Primitives" },
      { number: "5", title: "Capability Envelopes" },
      { number: "6", title: "Chain Events" },
      { number: "7", title: "Attestation" },
      { number: "8", title: "Store-and-Forward" },
      { number: "9", title: "Supervision Chain" },
      { number: "10", title: "Revocation" },
    ],
    annexes: ["A: Comparison with W3C VC and X.509", "B: JSON Schema", "C: Implementation Notes", "D: Security Considerations"],
    full_text: "Available at https://github.com/ucco-foundation/ucco-standard",
  },
};

/* ══════════════════════════════════════════════════════════════════
   TOOL DEFINITIONS & HANDLERS
   ══════════════════════════════════════════════════════════════════ */

const TOOLS = [
  { name: "get_standard_info", description: "Get current UCCO standard version, status, structure, and submission targets", inputSchema: { type: "object", properties: {}, required: [] }, annotations: { readOnly: true, openWorld: false } },
  { name: "get_foundation_info", description: "Get UCCO Foundation overview — name, jurisdiction, status, leadership, contacts", inputSchema: { type: "object", properties: {}, required: [] }, annotations: { readOnly: true, openWorld: false } },
  { name: "get_pioneer_stats", description: "Get aggregate Pioneer Programme statistics — keys issued, active, hits", inputSchema: { type: "object", properties: {}, required: [] }, annotations: { readOnly: true, openWorld: false } },
  { name: "verify_pioneer_key", description: "Verify a pioneer key prefix is valid and check its status", inputSchema: { type: "object", properties: { key_prefix: { type: "string", description: "The key prefix to verify (e.g. 'pca-')" } }, required: ["key_prefix"] }, annotations: { readOnly: true, openWorld: false } },
  { name: "get_fact_sheet", description: "Get structured foundation facts suitable for press and research use", inputSchema: { type: "object", properties: {}, required: [] }, annotations: { readOnly: true, openWorld: false } },
  { name: "get_protocol_stack", description: "Explain where UCCO sits in the identity/credential/capability stack", inputSchema: { type: "object", properties: {}, required: [] }, annotations: { readOnly: true, openWorld: false } },
  { name: "get_board_members", description: "Get public board composition — names, roles, bios (public fields only)", inputSchema: { type: "object", properties: {}, required: [] }, annotations: { readOnly: true, openWorld: false } },
  { name: "get_specification_outline", description: "Get the high-level section structure of the UCCO specification", inputSchema: { type: "object", properties: {}, required: [] }, annotations: { readOnly: true, openWorld: false } },
];

async function handleTool(name, args, env) {
  switch (name) {
    case "get_standard_info": return FOUNDATION_DATA.standard;
    case "get_foundation_info": return FOUNDATION_DATA.foundation;
    case "get_protocol_stack": return FOUNDATION_DATA.protocol_stack;
    case "get_specification_outline": return FOUNDATION_DATA.spec_outline;
    case "get_fact_sheet":
      return { ...FOUNDATION_DATA.foundation, standard: { name: FOUNDATION_DATA.standard.name, version: FOUNDATION_DATA.standard.current_version, status: FOUNDATION_DATA.standard.status, submissions: FOUNDATION_DATA.standard.submissions, repository: FOUNDATION_DATA.standard.repository, license: FOUNDATION_DATA.standard.license }, pioneer_programme: await getPioneerStats(env) };
    case "get_pioneer_stats": return await getPioneerStats(env);
    case "verify_pioneer_key": {
      const input = (args.key_prefix || "").trim();
      if (!input) return { valid: false, message: "key_prefix is required" };
      // Try 1: hash the input and match against key_hash (actual key verification)
      const inputHash = await sha256(input.toLowerCase());
      let row = await env.DB.prepare("SELECT key_name, state, created_at FROM pioneer_keys WHERE key_hash = ?").bind(inputHash).first();
      // Try 2: match by key_name prefix (name-based lookup)
      if (!row) {
        row = await env.DB.prepare("SELECT key_name, state, created_at FROM pioneer_keys WHERE LOWER(key_name) LIKE ? LIMIT 1").bind(input.toLowerCase() + "%").first();
      }
      if (!row) return { valid: false, message: "No pioneer key found with this prefix." };
      return { valid: true, status: row.state, name: row.key_name, issued: row.created_at, note: "Pioneer keys are cryptographic identifiers issued to early participants in the UCCO standard development." };
    }
    case "get_board_members": {
      const { results } = await env.DB.prepare("SELECT b.display_name, b.title, p.bio, p.location, p.linkedin_url, p.website_url, p.bio_visibility, p.location_visibility, p.linkedin_visibility, p.website_visibility FROM board_members b LEFT JOIN member_profiles p ON b.id = p.member_id WHERE b.status = 'active' AND (p.bio_visibility = 'public' OR p.location_visibility = 'public')").all();
      return {
        board_members: results.map((r) => ({ name: r.display_name, role: r.title, bio: r.bio_visibility === "public" ? r.bio : null, location: r.location_visibility === "public" ? r.location : null, linkedin: r.linkedin_visibility === "public" ? r.linkedin_url : null, website: r.website_visibility === "public" ? r.website_url : null })),
        total_seats: 9, filled_seats: results.length, categories: ["Founding", "Governance", "Domain"], advisory: ["Pace (Claude, Anthropic) — AI Advisor, non-voting"],
      };
    }
    default: return null;
  }
}

async function getPioneerStats(env) {
  const stats = await env.DB.prepare("SELECT COUNT(*) as total, SUM(CASE WHEN state='active' THEN 1 ELSE 0 END) as active, SUM(CASE WHEN state='unused' THEN 1 ELSE 0 END) as unused, SUM(CASE WHEN state='destroyed' THEN 1 ELSE 0 END) as destroyed, SUM(total_hits) as hits, MAX(last_hit_at) as last_activity FROM pioneer_keys").first();
  return { total_keys_issued: stats.total || 0, active: stats.active || 0, inactive: (stats.unused || 0) + (stats.destroyed || 0), destroyed: stats.destroyed || 0, total_activity_hits: stats.hits || 0, last_activity: stats.last_activity || null, programme_status: "Active — accepting nominations", specification: "https://pioneer.ucco.foundation/spec" };
}

/* ══════════════════════════════════════════════════════════════════
   OAUTH 2.1 ENDPOINTS
   ══════════════════════════════════════════════════════════════════ */

async function handleOAuthMetadata() {
  return json({
    issuer: "https://mcp.ucco.foundation",
    authorization_endpoint: "https://mcp.ucco.foundation/oauth/authorize",
    token_endpoint: "https://mcp.ucco.foundation/oauth/token",
    revocation_endpoint: "https://mcp.ucco.foundation/oauth/revoke",
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["client_secret_post"],
    scopes_supported: ["read"],
    service_documentation: "https://mcp.ucco.foundation/",
  });
}

async function handleAuthorize(url, env) {
  const p = url.searchParams;
  const clientId = p.get("client_id");
  const redirectUri = p.get("redirect_uri");
  const state = p.get("state");
  const codeChallenge = p.get("code_challenge");
  const codeChallengeMethod = p.get("code_challenge_method");
  const responseType = p.get("response_type");

  if (responseType !== "code") return json({ error: "unsupported_response_type" }, 400);
  if (!clientId || !redirectUri || !state) return json({ error: "invalid_request", error_description: "client_id, redirect_uri, and state are required" }, 400);
  if (!codeChallenge || codeChallengeMethod !== "S256") return json({ error: "invalid_request", error_description: "PKCE with S256 is required" }, 400);

  const client = await env.DB.prepare("SELECT * FROM oauth_clients WHERE client_id = ? AND active = 1").bind(clientId).first();
  if (!client) return json({ error: "invalid_client" }, 401);

  const allowedUris = JSON.parse(client.redirect_uris);
  if (!allowedUris.includes(redirectUri)) return json({ error: "invalid_request", error_description: "redirect_uri not registered" }, 400);

  const code = randomHex(32);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await env.DB.prepare("INSERT INTO oauth_codes (code, client_id, redirect_uri, code_challenge, code_challenge_method, expires_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(code, clientId, redirectUri, codeChallenge, "S256", expiresAt).run();

  const redirect = new URL(redirectUri);
  redirect.searchParams.set("code", code);
  redirect.searchParams.set("state", state);

  return Response.redirect(redirect.toString(), 302);
}

async function handleToken(request, env) {
  const body = await request.text();
  const p = new URLSearchParams(body);

  const grantType = p.get("grant_type");
  const code = p.get("code");
  const redirectUri = p.get("redirect_uri");
  const clientId = p.get("client_id");
  const clientSecret = p.get("client_secret");
  const codeVerifier = p.get("code_verifier");

  if (grantType !== "authorization_code") return json({ error: "unsupported_grant_type" }, 400);
  if (!code || !redirectUri || !clientId || !clientSecret || !codeVerifier) return json({ error: "invalid_request" }, 400);

  // Validate client
  const client = await env.DB.prepare("SELECT * FROM oauth_clients WHERE client_id = ? AND active = 1").bind(clientId).first();
  if (!client) return json({ error: "invalid_client" }, 401);

  const secretHash = await sha256(clientSecret);
  if (!constantTimeEqual(secretHash, client.client_secret_hash)) return json({ error: "invalid_client" }, 401);

  // Validate code
  const codeRecord = await env.DB.prepare("SELECT * FROM oauth_codes WHERE code = ? AND client_id = ? AND used = 0").bind(code, clientId).first();
  if (!codeRecord) return json({ error: "invalid_grant", error_description: "Code invalid or already used" }, 400);
  if (new Date(codeRecord.expires_at) < new Date()) {
    await env.DB.prepare("UPDATE oauth_codes SET used = 1 WHERE code = ?").bind(code).run();
    return json({ error: "invalid_grant", error_description: "Code expired" }, 400);
  }
  if (codeRecord.redirect_uri !== redirectUri) return json({ error: "invalid_grant", error_description: "redirect_uri mismatch" }, 400);

  // Verify PKCE
  const challenge = await sha256Base64url(codeVerifier);
  if (challenge !== codeRecord.code_challenge) return json({ error: "invalid_grant", error_description: "PKCE verification failed" }, 400);

  // Mark code used (single-use)
  await env.DB.prepare("UPDATE oauth_codes SET used = 1 WHERE code = ?").bind(code).run();

  // Issue token
  const accessToken = randomHex(48);
  const tokenHash = await sha256(accessToken);
  const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

  await env.DB.prepare("INSERT INTO oauth_tokens (token_hash, client_id, scope, expires_at) VALUES (?, ?, ?, ?)")
    .bind(tokenHash, clientId, "read", expiresAt).run();

  return json({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 3600,
    scope: "read",
  });
}

async function handleRevoke(request, env) {
  const body = await request.text();
  const p = new URLSearchParams(body);
  const token = p.get("token");
  const clientId = p.get("client_id");
  const clientSecret = p.get("client_secret");

  if (!token || !clientId || !clientSecret) return json({}, 200); // Always 200

  const client = await env.DB.prepare("SELECT * FROM oauth_clients WHERE client_id = ? AND active = 1").bind(clientId).first();
  if (client) {
    const secretHash = await sha256(clientSecret);
    if (constantTimeEqual(secretHash, client.client_secret_hash)) {
      const tokenHash = await sha256(token);
      await env.DB.prepare("UPDATE oauth_tokens SET revoked = 1 WHERE token_hash = ? AND client_id = ?").bind(tokenHash, clientId).run();
    }
  }
  return json({}, 200); // Always 200, no information leakage
}

/* Validate bearer token — returns client_id or null */
async function validateBearer(request, env) {
  const auth = request.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;

  const token = auth.slice(7);
  const tokenHash = await sha256(token);

  const record = await env.DB.prepare("SELECT client_id, expires_at, revoked FROM oauth_tokens WHERE token_hash = ?").bind(tokenHash).first();
  if (!record) return { error: true };
  if (record.revoked) return { error: true };
  if (new Date(record.expires_at) < new Date()) return { error: true };

  return { clientId: record.client_id };
}

/* ══════════════════════════════════════════════════════════════════
   OPS MANAGEMENT ENDPOINTS (protected by X-OPS-Key)
   ══════════════════════════════════════════════════════════════════ */

function checkOpsKey(request, env) {
  const key = request.headers.get("X-OPS-Key");
  return key && key === env.OPS_API_KEY;
}

async function handleOpsCreateClient(request, env) {
  if (!checkOpsKey(request, env)) return json({ error: "unauthorized" }, 401);
  const body = await request.json();
  const { client_name, redirect_uris } = body;
  if (!client_name || !redirect_uris) return json({ error: "client_name and redirect_uris required" }, 400);

  const clientId = "ucco-" + randomHex(8);
  const clientSecret = randomHex(48);
  const secretHash = await sha256(clientSecret);

  await env.DB.prepare("INSERT INTO oauth_clients (client_id, client_secret_hash, client_name, redirect_uris) VALUES (?, ?, ?, ?)")
    .bind(clientId, secretHash, client_name, JSON.stringify(redirect_uris)).run();

  return json({ client_id: clientId, client_secret: clientSecret, client_name, redirect_uris });
}

async function handleOpsListClients(request, env) {
  if (!checkOpsKey(request, env)) return json({ error: "unauthorized" }, 401);
  const { results } = await env.DB.prepare("SELECT client_id, client_name, redirect_uris, created_at, active FROM oauth_clients").all();
  return json({ clients: results });
}

async function handleOpsDeleteClient(request, env, clientId) {
  if (!checkOpsKey(request, env)) return json({ error: "unauthorized" }, 401);
  await env.DB.prepare("UPDATE oauth_clients SET active = 0 WHERE client_id = ?").bind(clientId).run();
  return json({ ok: true });
}

async function handleOpsUsage(request, env) {
  if (!checkOpsKey(request, env)) return json({ error: "unauthorized" }, 401);
  const { results } = await env.DB.prepare("SELECT client_id, tool_name, COUNT(*) as count FROM oauth_usage GROUP BY client_id, tool_name ORDER BY count DESC").all();
  const total = await env.DB.prepare("SELECT COUNT(*) as count FROM oauth_usage").first();
  const tokens = await env.DB.prepare("SELECT COUNT(*) as total, SUM(CASE WHEN revoked = 0 AND expires_at > datetime('now') THEN 1 ELSE 0 END) as active, SUM(CASE WHEN revoked = 1 THEN 1 ELSE 0 END) as revoked FROM oauth_tokens").first();
  return json({ total_requests: total.count, usage_by_client_tool: results, tokens: { total: tokens.total, active: tokens.active, revoked: tokens.revoked } });
}

/* ══════════════════════════════════════════════════════════════════
   JSON-RPC HANDLER
   ══════════════════════════════════════════════════════════════════ */

function jsonRpcResponse(id, result) { return { jsonrpc: "2.0", id, result }; }
function jsonRpcError(id, code, message) { return { jsonrpc: "2.0", id, error: { code, message } }; }

async function handleJsonRpc(body, env, request, oauthClient) {
  const { id, method, params } = body;

  switch (method) {
    case "initialize":
      return jsonRpcResponse(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
      });
    case "notifications/initialized": return null;
    case "tools/list": return jsonRpcResponse(id, { tools: TOOLS });
    case "tools/call": {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      if (!TOOLS.find((t) => t.name === toolName)) return jsonRpcError(id, -32602, `Unknown tool: ${toolName}`);
      try {
        const result = await handleTool(toolName, toolArgs, env);
        // Track anonymous usage
        const ip = request.headers.get("cf-connecting-ip") || "unknown";
        const ipHash = await hashIP(ip);
        await env.DB.prepare("INSERT INTO mcp_usage (tool_name, ip_hash) VALUES (?, ?)").bind(toolName, ipHash).run();
        // Track OAuth usage if authenticated
        if (oauthClient) {
          await env.DB.prepare("INSERT INTO oauth_usage (client_id, tool_name) VALUES (?, ?)").bind(oauthClient, toolName).run();
        }
        return jsonRpcResponse(id, { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] });
      } catch (e) {
        return jsonRpcError(id, -32603, `Tool execution failed: ${e.message}`);
      }
    }
    case "ping": return jsonRpcResponse(id, {});
    default: return jsonRpcError(id, -32601, `Method not found: ${method}`);
  }
}

/* ══════════════════════════════════════════════════════════════════
   HTML DOCS PAGE
   ══════════════════════════════════════════════════════════════════ */

function docsPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>UCCO Foundation MCP Server</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#012A4A;background:#fff;line-height:1.7;-webkit-font-smoothing:antialiased}
.wrap{max-width:680px;margin:0 auto;padding:40px 24px}
h1{font-size:24px;font-weight:600;color:#01497C;margin-bottom:8px}
h2{font-size:16px;font-weight:600;color:#01497C;margin:28px 0 12px;padding-top:20px;border-top:1px solid #E0E0E0}
p{margin-bottom:12px;font-size:15px}
.subtitle{font-size:14px;color:#555;margin-bottom:24px}
.endpoint{background:#F5F0E8;border:1px solid #DDE8F0;border-radius:6px;padding:12px 16px;margin:16px 0;font-family:monospace;font-size:14px;color:#01497C}
ul{list-style:none;padding:0;margin:12px 0}
ul li{padding:6px 0;font-size:14px;border-bottom:1px solid #f0f0f0}
ul li:last-child{border-bottom:none}
.tool-name{font-weight:600;color:#01497C;font-family:monospace}
.tool-desc{color:#555}
pre{background:#012A4A;color:#F5F0E8;border-radius:6px;padding:16px;overflow-x:auto;font-size:13px;line-height:1.5;margin:12px 0}
code{font-family:"IBM Plex Mono",monospace;font-size:13px}
.footer{margin-top:40px;padding-top:20px;border-top:1px solid #E0E0E0;font-size:13px;color:#999}
.footer a{color:#01497C;text-decoration:none}
.badge{display:inline-block;padding:2px 8px;border-radius:3px;font-size:11px;font-weight:500;background:#ECFDF5;color:#10B981;margin-left:8px}
</style>
</head>
<body>
<div class="wrap">
<h1>UCCO Foundation MCP Server <span class="badge">live</span></h1>
<p class="subtitle">Connect any MCP-compatible AI client to query the UCCO standard, foundation status, and pioneer programme data.</p>
<div class="endpoint">https://mcp.ucco.foundation/mcp</div>
<h2>Available Tools</h2>
<ul>
<li><span class="tool-name">get_standard_info</span> — <span class="tool-desc">Current UCCO standard version and status</span></li>
<li><span class="tool-name">get_foundation_info</span> — <span class="tool-desc">Foundation overview and governance</span></li>
<li><span class="tool-name">get_pioneer_stats</span> — <span class="tool-desc">Pioneer programme statistics</span></li>
<li><span class="tool-name">verify_pioneer_key</span> — <span class="tool-desc">Verify a pioneer key prefix</span></li>
<li><span class="tool-name">get_fact_sheet</span> — <span class="tool-desc">Structured foundation facts for press/research</span></li>
<li><span class="tool-name">get_protocol_stack</span> — <span class="tool-desc">Where UCCO sits in the identity stack</span></li>
<li><span class="tool-name">get_board_members</span> — <span class="tool-desc">Public board composition</span></li>
<li><span class="tool-name">get_specification_outline</span> — <span class="tool-desc">High-level spec structure</span></li>
</ul>
<h2>Authentication</h2>
<p>All data is public. No authentication required for queries.</p>
<p>OAuth 2.1 with PKCE is available for registered clients. See <code>/.well-known/oauth-authorization-server</code> for metadata.</p>
<h2>Setup — Claude Desktop</h2>
<p>Add to your <code>claude_desktop_config.json</code>:</p>
<pre>{
  "mcpServers": {
    "ucco-foundation": {
      "url": "https://mcp.ucco.foundation/mcp"
    }
  }
}</pre>
<h2>Setup — Claude Code</h2>
<pre>claude mcp add ucco-foundation https://mcp.ucco.foundation/mcp</pre>
<div class="footer">
<p>UCCO Foundation, Inc. · <a href="https://ucco.foundation">ucco.foundation</a> · <a href="https://github.com/ucco-foundation/ucco-mcp">Source on GitHub</a></p>
<p>OAuth 2.1 · MCP Protocol ${PROTOCOL_VERSION} · Server v${SERVER_VERSION}</p>
</div>
</div>
</body>
</html>`;
}

/* ══════════════════════════════════════════════════════════════════
   SECURITY HEADERS
   ══════════════════════════════════════════════════════════════════ */

const SECURITY_HEADERS = {
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-DNS-Prefetch-Control": "off",
};

/* ══════════════════════════════════════════════════════════════════
   MAIN HANDLER
   ══════════════════════════════════════════════════════════════════ */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Build provenance
    if (path === "/_build") return json({ surface: "ucco-mcp", version: SERVER_VERSION, built_at: "2026-03-15" });
    if (path === "/_health") return json({ status: "ok", surface: "ucco-mcp" });

    // OAuth metadata
    if (path === "/.well-known/oauth-authorization-server") return handleOAuthMetadata();

    // OAuth endpoints
    if (path === "/oauth/authorize" && request.method === "GET") return handleAuthorize(url, env);
    if (path === "/oauth/token" && request.method === "POST") return handleToken(request, env);
    if (path === "/oauth/revoke" && request.method === "POST") return handleRevoke(request, env);

    // Ops management endpoints
    if (path === "/ops/clients" && request.method === "POST") return handleOpsCreateClient(request, env);
    if (path === "/ops/clients" && request.method === "GET") return handleOpsListClients(request, env);
    if (path.startsWith("/ops/clients/") && request.method === "DELETE") return handleOpsDeleteClient(request, env, path.split("/").pop());
    if (path === "/ops/usage" && request.method === "GET") return handleOpsUsage(request, env);

    // HTML docs page for browsers
    if (path === "/" && request.method === "GET") {
      const accept = request.headers.get("accept") || "";
      if (accept.includes("text/html")) {
        return new Response(docsPage(), { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300", ...SECURITY_HEADERS } });
      }
      return json({ name: SERVER_NAME, version: SERVER_VERSION, protocol: PROTOCOL_VERSION, endpoint: "https://mcp.ucco.foundation/mcp", tools: TOOLS.map((t) => t.name), oauth: "https://mcp.ucco.foundation/.well-known/oauth-authorization-server" });
    }

    // MCP endpoint
    if (path === "/mcp") {
      if (request.method === "POST") {
        // Validate bearer token if present (additive — unauthenticated still works)
        const bearerResult = await validateBearer(request, env);
        if (bearerResult && bearerResult.error) {
          return json(jsonRpcError(null, -32001, "Invalid or expired token"), 401);
        }
        const oauthClient = bearerResult?.clientId || null;

        try {
          const body = await request.json();
          if (Array.isArray(body)) {
            const results = [];
            for (const msg of body) {
              const result = await handleJsonRpc(msg, env, request, oauthClient);
              if (result) results.push(result);
            }
            return json(results.length === 1 ? results[0] : results);
          }
          const result = await handleJsonRpc(body, env, request, oauthClient);
          if (!result) return new Response("", { status: 202 });
          return json(result);
        } catch (e) {
          return json(jsonRpcError(null, -32700, "Parse error"), 400);
        }
      }
      if (request.method === "GET") return json({ name: SERVER_NAME, version: SERVER_VERSION, protocol: PROTOCOL_VERSION });
      return new Response("Method not allowed", { status: 405 });
    }

    return json({ error: "Not found. MCP endpoint is at /mcp" }, 404);
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=300", ...SECURITY_HEADERS } });
}
