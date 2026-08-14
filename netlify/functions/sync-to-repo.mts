import { getBlobStore, isAuthorized, isValidState, KEY, readLocalEnvVar } from "../lib/shared.mts";

const OWNER = "osmannurierdogan";
const REPO = "healthOS";
const BRANCH = "main";
const FILE_PATH = "protocol_state.json";
const GITHUB_API_VERSION = "2022-11-28";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  if (!isAuthorized(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const ghToken = Netlify.env.get("GITHUB_TOKEN") || process.env.GITHUB_TOKEN || readLocalEnvVar("GITHUB_TOKEN");
  if (!ghToken) {
    return Response.json({ error: "GITHUB_TOKEN ortam değişkeni ayarlanmamış." }, { status: 500 });
  }

  const store = getBlobStore();
  const current = await store.get(KEY, { type: "json" });
  if (!current || !isValidState(current)) {
    return Response.json({ error: "Blob deposunda geçerli veri yok; önce Kaydet ile bir kayıt oluşturun." }, { status: 409 });
  }

  const apiUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;
  const ghHeaders = {
    Authorization: `Bearer ${ghToken}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "healthos-sync-to-repo-function",
    "X-GitHub-Api-Version": GITHUB_API_VERSION
  };

  let sha: string | undefined;
  try {
    const getRes = await fetch(`${apiUrl}?ref=${BRANCH}`, { headers: ghHeaders });
    if (getRes.status === 404) {
      sha = undefined; // file doesn't exist yet — PUT below will create it
    } else if (!getRes.ok) {
      const details = await getRes.text();
      return Response.json({ error: "GitHub'dan mevcut dosya okunamadı.", status: getRes.status, details }, { status: 502 });
    } else {
      const fileInfo = await getRes.json();
      sha = fileInfo.sha;
    }
  } catch (e: any) {
    return Response.json({ error: "GitHub isteği başarısız (GET).", details: e.message }, { status: 502 });
  }

  const content = Buffer.from(JSON.stringify(current, null, 2), "utf-8").toString("base64");
  const putBody: any = {
    message: `Repoya yedekle: protocol_state.json güncellendi (${new Date().toISOString()})`,
    content,
    branch: BRANCH
  };
  if (sha) putBody.sha = sha;

  try {
    const putRes = await fetch(apiUrl, {
      method: "PUT",
      headers: { ...ghHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(putBody)
    });
    if (putRes.status === 409) {
      const details = await putRes.text();
      return Response.json({ error: "SHA çakışması: dosya GitHub'da başka bir yerden değişmiş görünüyor. Tekrar deneyin.", status: 409, details }, { status: 409 });
    }
    if (!putRes.ok) {
      const details = await putRes.text();
      return Response.json({ error: "GitHub güncellemesi başarısız.", status: putRes.status, details }, { status: 502 });
    }
    const result = await putRes.json();
    return Response.json({ ok: true, commitSha: result.commit?.sha, htmlUrl: result.commit?.html_url });
  } catch (e: any) {
    return Response.json({ error: "GitHub isteği başarısız (PUT).", details: e.message }, { status: 502 });
  }
};

export const config = {
  path: "/api/sync-to-repo"
};
