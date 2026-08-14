import { getStore, getDeployStore } from "@netlify/blobs";
import fs from "node:fs";
import path from "node:path";

export const STORE_NAME = "healthos";
export const KEY = "protocol_state.json";

export function readLocalEnvVar(name: string): string {
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      const match = envContent.match(new RegExp(`^${name}\\s*=\\s*(.*)$`, "m"));
      if (match) {
        return match[1].trim().replace(/^['"]|['"]$/g, "");
      }
    }
  } catch (e) { /* ignore */ }
  return "";
}

export function getBlobStore() {
  if (Netlify.context?.deploy?.context === "production") {
    return getStore(STORE_NAME);
  }
  return getDeployStore(STORE_NAME);
}

export function isAuthorized(req: Request): boolean {
  const token = Netlify.env.get("DASHBOARD_TOKEN") || process.env.DASHBOARD_TOKEN || readLocalEnvVar("DASHBOARD_TOKEN");
  if (!token) return false; // fail closed if misconfigured
  const auth = req.headers.get("authorization") || "";
  return auth === `Bearer ${token}`;
}

export function isValidState(data: any): boolean {
  return !!(data && data.user_profile && Array.isArray(data.daily_logs) && data.workout_programs && Array.isArray(data.weekly_measurements));
}
