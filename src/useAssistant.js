import { ref } from 'vue'
import MarkdownIt from 'markdown-it'

const API_BASE = 'https://api.openai.com/v1'

export function useAssistant(apiKey, assistantId) {
  const threadId = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const commonHeaders = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'OpenAI-Beta': 'assistants=v2',
  }

  async function createThread() {
    const res = await fetch(`${API_BASE}/threads`, {
      method: 'POST',
      headers: commonHeaders,
    })
    if (!res.ok) throw new Error('Failed to create thread')
    const data = await res.json()
    threadId.value = data.id
  }

  async function sendMessage(userMessage) {
    loading.value = true
    error.value = null

    try {
      if (!threadId.value) {
        await createThread()
      }

      // Add user message
      const msgRes = await fetch(`${API_BASE}/threads/${threadId.value}/messages`, {
        method: 'POST',
        headers: commonHeaders,
        body: JSON.stringify({
          role: 'user',
          content: userMessage,
        }),
      })
      if (!msgRes.ok) throw new Error('Failed to send message')

      // Create a run
      const runRes = await fetch(`${API_BASE}/threads/${threadId.value}/runs`, {
        method: 'POST',
        headers: commonHeaders,
        body: JSON.stringify({
          assistant_id: assistantId,
        }),
      })
      if (!runRes.ok) throw new Error('Failed to create run')
      const run = await runRes.json()

      // Poll for run completion
      let status = run.status
      let runResult = run
      while (status === 'queued' || status === 'in_progress') {
        await new Promise((r) => setTimeout(r, 1000))
        const pollRes = await fetch(`${API_BASE}/threads/${threadId.value}/runs/${run.id}`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'OpenAI-Beta': 'assistants=v2',
          },
        })
        runResult = await pollRes.json()
        status = runResult.status
      }

      if (status === 'failed') {
        throw new Error(`Run failed with status: ${status}`)
      }

      // Fetch messages to get assistant reply
      const messagesRes = await fetch(`${API_BASE}/threads/${threadId.value}/messages`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'OpenAI-Beta': 'assistants=v2',
        },
      })
      if (!messagesRes.ok) throw new Error('Failed to fetch messages')
      const messagesData = await messagesRes.json()

      // Sort assistant messages by created time descending
      const sorted = messagesData.data
        .filter((m) => m.role === 'assistant')
        .sort((a, b) => b.created_at - a.created_at)

      const replyText = sorted[0]?.content?.[0]?.text?.value || 'No reply found'

      loading.value = false

      const md = new MarkdownIt()
      return md.render(replyText) || 'No reply found'
    } catch (e) {
      loading.value = false
      error.value = e.message
      return null
    }
  }

  return { sendMessage, loading, error }
}
