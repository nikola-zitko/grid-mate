<template>
  <main style="max-width: 600px; margin: 2rem auto; font-family: sans-serif">
    <h1>F1 Assistant Chat - 2026 Regulations</h1>

    <div style="margin-bottom: 1rem">
      <textarea
        v-model="input"
        :disabled="loading"
        placeholder="Ask a question about 2026 F1 technical regs..."
        rows="4"
        style="width: 100%; padding: 0.5rem; font-size: 1rem"
      ></textarea>
    </div>

    <button @click="handleSend" :disabled="loading || !input.trim()">
      {{ loading ? 'Thinking...' : 'Send' }}
    </button>
    <div v-if="loading">
      <p style="margin-top: 1rem">Fetching assistants response...</p>
    </div>
    <section v-if="error" style="color: red; margin-top: 1rem">Error: {{ error }}</section>

    <section
      v-if="reply"
      style="width: 100%; margin-top: 2rem; background: #f3f3f3; padding: 1rem; border-radius: 4px"
    >
      <p><strong>Question:</strong> {{ submittedText }}</p>
      <strong>Assistant:</strong>
      <div v-html="reply"></div>
    </section>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { useAssistant } from './useAssistant.js'

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY
const ASSISTANT_ID = import.meta.env.VITE_ASSISTANT_ID

const { sendMessage, loading, error } = useAssistant(OPENAI_API_KEY, ASSISTANT_ID)

const input = ref('')
const reply = ref('')
const submittedText = ref('')

async function handleSend() {
  if (!input.value.trim()) return
  reply.value = ''
  const res = await sendMessage(input.value)
  if (res) {
    reply.value = res
  }
  submittedText.value = input.value
  input.value = ''
}
</script>
