const API_URL = process.env.NEXT_PUBLIC_API_URL
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "CONNECTIONS_FOUND") storeAndSync(message.data)
  if (message.type === "FLUSH") chrome.storage.local.get("pending_connections", d => flush(d.pending_connections || []))
})

async function storeAndSync(data) {
  const stored = await chrome.storage.local.get("pending_connections")
  const pending = stored.pending_connections || []
  const updated = Array.isArray(data) ? [...pending, ...data] : [...pending, data]
  await chrome.storage.local.set({ pending_connections: updated })
  if (updated.length >= 20) await flush(updated)
}

async function flush(connections) {
  const { user_id } = await chrome.storage.local.get("user_id")
  if (!user_id || connections.length === 0) return
  try {
    await fetch(`${API_URL}/api/upload/extension`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, connections })
    })
    await chrome.storage.local.set({ pending_connections: [] })
  } catch (e) { console.error("Sync failed:", e) }
}
