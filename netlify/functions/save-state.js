const OWNER = 'osmannurierdogan';
const REPO = 'healthOS';
const BRANCH = 'main';
const PATH = 'protocol_state.json';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return { statusCode: 500, body: JSON.stringify({ error: 'GITHUB_TOKEN ortam değişkeni ayarlanmamış.' }) };
  }

  let newState;
  try {
    newState = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Geçersiz JSON gövdesi.' }) };
  }

  const apiUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'healthos-save-state-function'
  };

  let currentSha;
  try {
    const getRes = await fetch(`${apiUrl}?ref=${BRANCH}`, { headers });
    if (!getRes.ok) {
      const details = await getRes.text();
      return { statusCode: 502, body: JSON.stringify({ error: 'Mevcut dosya okunamadı.', details }) };
    }
    const current = await getRes.json();
    currentSha = current.sha;
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: 'GitHub isteği başarısız.', details: e.message }) };
  }

  try {
    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Kaydet: protocol_state.json güncellendi',
        content: Buffer.from(JSON.stringify(newState, null, 2)).toString('base64'),
        sha: currentSha,
        branch: BRANCH
      })
    });
    if (!putRes.ok) {
      const details = await putRes.text();
      return { statusCode: 502, body: JSON.stringify({ error: 'GitHub güncellemesi başarısız oldu.', details }) };
    }
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: 'GitHub isteği başarısız.', details: e.message }) };
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
