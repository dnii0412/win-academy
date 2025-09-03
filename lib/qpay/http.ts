export async function qpayFetch(path: string, init: RequestInit = {}) {
  const url = `${process.env.QPAY_BASE_URL}${path}`
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    // QPay endpoints are server-to-server only. Never call this from the browser.
    cache: 'no-store',
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`QPay HTTP ${res.status}: ${text}`)
  }
  return res.json()
}
