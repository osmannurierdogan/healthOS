import seedData from "../../protocol_state.json" with { type: "json" };
import fs from "node:fs";
import path from "node:path";
import { getBlobStore, isAuthorized, isValidState, KEY } from "../lib/shared.mts";

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
