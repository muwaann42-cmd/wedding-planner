/* ==========================================================================
   Cloudflare Pages Functions — Backend API for Wedding Planner
   Endpoint: /api/wedding
   Supports Cloudflare D1 (Serverless SQL) & Cloudflare KV with Auto-Init
   ========================================================================== */

export async function onRequestGet(context) {
  const { env } = context;
  try {
    // 1. Primary: Cloudflare D1 Database (Serverless SQLite)
    if (env.DB) {
      // Auto-create table if it doesn't exist yet
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS wedding_store (
          id TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      const row = await env.DB.prepare(
        "SELECT data, updated_at FROM wedding_store WHERE id = 'main' LIMIT 1"
      ).first();

      if (row && row.data) {
        return new Response(row.data, {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store, no-cache, must-revalidate",
            "Access-Control-Allow-Origin": "*",
            "X-Storage-Engine": "Cloudflare-D1",
            "X-Updated-At": String(row.updated_at || "")
          }
        });
      }

      // No data in D1 yet
      return new Response(JSON.stringify({ exists: false, message: "No data in Cloudflare D1 yet" }), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "X-Storage-Engine": "Cloudflare-D1"
        }
      });
    }

    // 2. Secondary: Cloudflare KV (if configured)
    if (env.WEDDING_KV) {
      const val = await env.WEDDING_KV.get("wedding_state");
      if (val) {
        return new Response(val, {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store, no-cache, must-revalidate",
            "Access-Control-Allow-Origin": "*",
            "X-Storage-Engine": "Cloudflare-KV"
          }
        });
      }
      return new Response(JSON.stringify({ exists: false, message: "No data in Cloudflare KV yet" }), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    return new Response(JSON.stringify({
      error: "No database bound yet. Please bind Cloudflare D1 as 'DB' in Cloudflare Pages Dashboard (Settings > Functions > D1 Database Bindings).",
      connected: false
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const rawBody = await request.text();
    if (!rawBody || rawBody.length < 10) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }

    // Validate JSON structure
    const parsed = JSON.parse(rawBody);
    if (!parsed || typeof parsed !== 'object') {
      return new Response(JSON.stringify({ error: "Malformed JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }

    // 1. Save into Cloudflare D1 Database
    if (env.DB) {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS wedding_store (
          id TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      await env.DB.prepare(`
        INSERT INTO wedding_store (id, data, updated_at)
        VALUES ('main', ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          data = excluded.data,
          updated_at = CURRENT_TIMESTAMP
      `).bind(rawBody).run();

      return new Response(JSON.stringify({
        success: true,
        storage: "Cloudflare D1",
        updatedAt: new Date().toISOString()
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // 2. Save into Cloudflare KV
    if (env.WEDDING_KV) {
      await env.WEDDING_KV.put("wedding_state", rawBody);
      return new Response(JSON.stringify({
        success: true,
        storage: "Cloudflare KV",
        updatedAt: new Date().toISOString()
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    return new Response(JSON.stringify({
      error: "No database bound yet. Please bind Cloudflare D1 as 'DB' in Cloudflare Pages Dashboard.",
      success: false
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, success: false }), {
      status: 500,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400"
    }
  });
}
