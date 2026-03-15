/* ── UCCO Foundation MCP Server ── */
/* mcp.ucco.foundation — Streamable HTTP transport, JSON-RPC 2.0 */

const PROTOCOL_VERSION = "2025-03-26";
const SERVER_NAME = "ucco-foundation";
const SERVER_VERSION = "1.0.0";

/* ── Static Foundation Data ── */
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
    annexes: [
      "A: Comparison with W3C VC and X.509",
      "B: JSON Schema",
      "C: Implementation Notes",
      "D: Security Considerations",
    ],
    full_text: "Available at https://github.com/ucco-foundation/ucco-standard",
  },
};

/* ── Tool Definitions ── */
const TOOLS = [
  {
    name: "get_standard_info",
    description: "Get current UCCO standard version, status, structure, and submission targets",
    inputSchema: { type: "object", properties: {}, required: [] },
    annotations: { readOnly: true, openWorld: false },
  },
  {
    name: "get_foundation_info",
    description: "Get UCCO Foundation overview — name, jurisdiction, status, leadership, contacts",
    inputSchema: { type: "object", properties: {}, required: [] },
    annotations: { readOnly: true, openWorld: false },
  },
  {
    name: "get_pioneer_stats",
    description: "Get aggregate Pioneer Programme statistics — keys issued, active, hits",
    inputSchema: { type: "object", properties: {}, required: [] },
    annotations: { readOnly: true, openWorld: false },
  },
  {
    name: "verify_pioneer_key",
    description: "Verify a pioneer key prefix is valid and check its status",
    inputSchema: {
      type: "object",
      properties: {
        key_prefix: { type: "string", description: "The key prefix to verify (e.g. 'pca-')" },
      },
      required: ["key_prefix"],
    },
    annotations: { readOnly: true, openWorld: false },
  },
  {
    name: "get_fact_sheet",
    description: "Get structured foundation facts suitable for press and research use",
    inputSchema: { type: "object", properties: {}, required: [] },
    annotations: { readOnly: true, openWorld: false },
  },
  {
    name: "get_protocol_stack",
    description: "Explain where UCCO sits in the identity/credential/capability stack",
    inputSchema: { type: "object", properties: {}, required: [] },
    annotations: { readOnly: true, openWorld: false },
  },
  {
    name: "get_board_members",
    description: "Get public board composition — names, roles, bios (public fields only)",
    inputSchema: { type: "object", properties: {}, required: [] },
    annotations: { readOnly: true, openWorld: false },
  },
  {
    name: "get_specification_outline",
    description: "Get the high-level section structure of the UCCO specification",
    inputSchema: { type: "object", properties: {}, required: [] },
    annotations: { readOnly: true, openWorld: false },
  },
];

/* ── Tool Handlers ── */
async function handleTool(name, args, env) {
  switch (name) {
    case "get_standard_info":
      return FOUNDATION_DATA.standard;

    case "get_foundation_info":
      return FOUNDATION_DATA.foundation;

    case "get_protocol_stack":
      return FOUNDATION_DATA.protocol_stack;

    case "get_specification_outline":
      return FOUNDATION_DATA.spec_outline;

    case "get_fact_sheet":
      return {
        ...FOUNDATION_DATA.foundation,
        standard: {
          name: FOUNDATION_DATA.standard.name,
          version: FOUNDATION_DATA.standard.current_version,
          status: FOUNDATION_DATA.standard.status,
          submissions: FOUNDATION_DATA.standard.submissions,
          repository: FOUNDATION_DATA.standard.repository,
          license: FOUNDATION_DATA.standard.license,
        },
        pioneer_programme: await getPioneerStats(env),
      };

    case "get_pioneer_stats":
      return await getPioneerStats(env);

    case "verify_pioneer_key": {
      const prefix = (args.key_prefix || "").toLowerCase().trim();
      if (!prefix) return { valid: false, message: "key_prefix is required" };
      const row = await env.DB.prepare(
        "SELECT key_name, state, created_at FROM pioneer_keys WHERE LOWER(key_name) LIKE ? LIMIT 1"
      ).bind(prefix + "%").first();
      if (!row) return { valid: false, message: "No pioneer key found with this prefix." };
      return {
        valid: true,
        status: row.state,
        name: row.key_name,
        issued: row.created_at,
        note: "Pioneer keys are cryptographic identifiers issued to early participants in the UCCO standard development.",
      };
    }

    case "get_board_members": {
      const { results } = await env.DB.prepare(
        "SELECT b.display_name, b.title, p.bio, p.location, p.linkedin_url, p.website_url FROM board_members b LEFT JOIN member_profiles p ON b.id = p.member_id WHERE b.status = 'active' AND (p.bio_visibility = 'public' OR p.location_visibility = 'public')"
      ).all();
      return {
        board_members: results.map((r) => ({
          name: r.display_name,
          role: r.title,
          bio: r.bio_visibility === "public" ? r.bio : null,
          location: r.location_visibility === "public" ? r.location : null,
          linkedin: r.linkedin_visibility === "public" ? r.linkedin_url : null,
          website: r.website_visibility === "public" ? r.website_url : null,
        })),
        total_seats: 9,
        filled_seats: results.length,
        categories: ["Founding", "Governance", "Domain"],
        advisory: ["Pace (Claude, Anthropic) — AI Advisor, non-voting"],
      };
    }

    default:
      return null;
  }
}

async function getPioneerStats(env) {
  const stats = await env.DB.prepare(
    "SELECT COUNT(*) as total, SUM(CASE WHEN state='active' THEN 1 ELSE 0 END) as active, SUM(CASE WHEN state='unused' THEN 1 ELSE 0 END) as unused, SUM(CASE WHEN state='destroyed' THEN 1 ELSE 0 END) as destroyed, SUM(total_hits) as hits, MAX(last_hit_at) as last_activity FROM pioneer_keys"
  ).first();
  return {
    total_keys_issued: stats.total || 0,
    active: stats.active || 0,
    inactive: (stats.unused || 0) + (stats.destroyed || 0),
    destroyed: stats.destroyed || 0,
    total_activity_hits: stats.hits || 0,
    last_activity: stats.last_activity || null,
    programme_status: "Active — accepting nominations",
    specification: "https://pioneer.ucco.foundation/spec",
  };
}

/* ── JSON-RPC Handler ── */
function jsonRpcResponse(id, result) {
  return { jsonrpc: "2.0", id, result };
}

function jsonRpcError(id, code, message) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

async function handleJsonRpc(body, env, request) {
  const { id, method, params } = body;

  switch (method) {
    case "initialize":
      return jsonRpcResponse(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
      });

    case "notifications/initialized":
      return null; // No response for notifications

    case "tools/list":
      return jsonRpcResponse(id, { tools: TOOLS });

    case "tools/call": {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      const tool = TOOLS.find((t) => t.name === toolName);
      if (!tool) return jsonRpcError(id, -32602, `Unknown tool: ${toolName}`);

      try {
        const result = await handleTool(toolName, toolArgs, env);

        // Track usage
        const ip = request.headers.get("cf-connecting-ip") || "unknown";
        const ipHash = await hashIP(ip);
        await env.DB.prepare("INSERT INTO mcp_usage (tool_name, ip_hash) VALUES (?, ?)").bind(toolName, ipHash).run();

        return jsonRpcResponse(id, {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        });
      } catch (e) {
        return jsonRpcError(id, -32603, `Tool execution failed: ${e.message}`);
      }
    }

    case "ping":
      return jsonRpcResponse(id, {});

    default:
      return jsonRpcError(id, -32601, `Method not found: ${method}`);
  }
}

async function hashIP(ip) {
  const data = new TextEncoder().encode(ip + "ucco-mcp-salt");
  const hash = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(hash))).slice(0, 16);
}

/* ── HTML Documentation Page ── */
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

<h2>Setup — Other Clients</h2>
<p>Any MCP-compatible client can connect via Streamable HTTP transport at the endpoint above. Protocol version: <code>${PROTOCOL_VERSION}</code>.</p>

<p>All data is public. No API key required.</p>

<div class="footer">
<p>UCCO Foundation, Inc. · <a href="https://ucco.foundation">ucco.foundation</a> · <a href="https://github.com/ucco-foundation/ucco-mcp">Source on GitHub</a></p>
</div>
</div>
</body>
</html>`;
}

/* ── Security Headers ── */
const SECURITY_HEADERS = {
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-DNS-Prefetch-Control": "off",
};

/* ── Main Handler ── */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Build provenance
    if (path === "/_build") {
      return json({ surface: "ucco-mcp", version: SERVER_VERSION, built_at: "2026-03-15" });
    }
    if (path === "/_health") {
      return json({ status: "ok", surface: "ucco-mcp" });
    }

    // HTML docs page for browsers
    if (path === "/" && request.method === "GET") {
      const accept = request.headers.get("accept") || "";
      if (accept.includes("text/html")) {
        return new Response(docsPage(), {
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300", ...SECURITY_HEADERS },
        });
      }
      // Non-browser GET to root — return server info
      return json({
        name: SERVER_NAME,
        version: SERVER_VERSION,
        protocol: PROTOCOL_VERSION,
        endpoint: "https://mcp.ucco.foundation/mcp",
        tools: TOOLS.map((t) => t.name),
      });
    }

    // MCP endpoint
    if (path === "/mcp") {
      if (request.method === "POST") {
        try {
          const body = await request.json();

          // Handle batch or single
          if (Array.isArray(body)) {
            const results = [];
            for (const msg of body) {
              const result = await handleJsonRpc(msg, env, request);
              if (result) results.push(result);
            }
            return json(results.length === 1 ? results[0] : results);
          }

          const result = await handleJsonRpc(body, env, request);
          if (!result) return new Response("", { status: 202 }); // notification, no response
          return json(result);
        } catch (e) {
          return json(jsonRpcError(null, -32700, "Parse error"), 400);
        }
      }

      // GET /mcp — return server info for discovery
      if (request.method === "GET") {
        return json({
          name: SERVER_NAME,
          version: SERVER_VERSION,
          protocol: PROTOCOL_VERSION,
        });
      }

      return new Response("Method not allowed", { status: 405 });
    }

    // 404 for everything else
    return json({ error: "Not found. MCP endpoint is at /mcp" }, 404);
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
      ...SECURITY_HEADERS,
    },
  });
}
