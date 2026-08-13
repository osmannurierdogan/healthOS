import { getStore, getDeployStore } from "@netlify/blobs";
import seedData from "../../protocol_state.json" with { type: "json" };
import fs from "node:fs";
import path from "node:path";

const STORE_NAME = "healthos";
const KEY = "protocol_state.json";

// Read local .env.local if it exists
let localToken = "";
try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    const match = envContent.match(/^DASHBOARD_TOKEN\s*=\s*(.*)$/m);
    if (match) {
      localToken = match[1].trim().replace(/^['"]|['"]$/g, "");
    }
  }
} catch (e) { /* ignore */ }

function getBlobStore() {
  if (Netlify.context?.deploy?.context === "production") {
    return getStore(STORE_NAME);
  }
  return getDeployStore(STORE_NAME);
}

function isAuthorized(req: Request): boolean {
  const token = Netlify.env.get("DASHBOARD_TOKEN") || process.env.DASHBOARD_TOKEN || localToken;
  if (!token) return false; // fail closed if misconfigured
  const auth = req.headers.get("authorization") || "";
  return auth === `Bearer ${token}`;
}

function isValidState(data: any): boolean {
  return !!(data && data.user_profile && Array.isArray(data.daily_logs) && data.workout_programs && Array.isArray(data.weekly_measurements));
}

export default async (req: Request) => {
  if (!isAuthorized(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const store = getBlobStore();

  if (req.method === "GET") {
    const existing = await store.get(KEY, { type: "json" });
    return Response.json(existing ?? seedData);
  }

  if (req.method === "POST" || req.method === "PUT") {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response("Invalid JSON body", { status: 400 });
    }
    if (!isValidState(body)) {
      return new Response("Body is not a valid protocol_state object", { status: 400 });
    }
    await store.setJSON(KEY, body);

    // In local development, keep the root protocol_state.json in sync for convenience
    if (Netlify.context?.deploy?.context !== "production") {
      try {
        fs.writeFileSync(path.resolve(process.cwd(), "protocol_state.json"), JSON.stringify(body, null, 2), "utf-8");
      } catch (e) {
        console.error("Failed to sync local protocol_state.json:", e);
      }
    }

    return Response.json({ ok: true });
  }

  return new Response("Method Not Allowed", { status: 405 });
};

export const config = {
  path: "/api/data"
};
