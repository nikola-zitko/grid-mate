<template>
  <div class="chat-container">
    <div class="messages">
      <div v-for="(msg, index) in messages" :key="index" :class="['message', msg.role]">
        <strong>{{ msg.role === 'user' ? 'You' : 'Assistant' }}:</strong>
        <p>{{ msg.content }}</p>
      </div>
    </div>

    <form @submit.prevent="sendMessage" class="chat-form">
      <input v-model="input" placeholder="Ask the assistant..." required />
      <button type="submit">Send</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const messages = ref([
  {
    role: 'assistant',
    content: 'Hello! Ask me anything about the 2026 Formula 1 Technical Regulations.',
  },
])
const input = ref('')

const sendMessage = async () => {
  const userMsg = input.value.trim()
  if (!userMsg) return

  messages.value.push({ role: 'user', content: userMsg })
  input.value = ''

  try {
    const response = await fetch(
      'https://api.openai.com/v1/assistants/' + import.meta.env.VITE_ASSISTANT_ID + '/messages',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.value.map((m) => ({ role: m.role, content: m.content })),
        }),
      },
    )

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || '[No reply]'
    messages.value.push({ role: 'assistant', content: reply })
  } catch (error) {
    messages.value.push({ role: 'assistant', content: '[Error communicating with assistant]' })
  }
}
</script>

<style scoped>
.chat-container {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.messages {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 1rem;
}
.message {
  margin: 0.5rem 0;
}
.message.assistant {
  background: #f1f1f1;
  padding: 0.5rem;
  border-radius: 6px;
}
.message.user {
  text-align: right;
}
.chat-form {
  display: flex;
  gap: 0.5rem;
}
.chat-form input {
  flex: 1;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #ccc;
}
.chat-form button {
  padding: 0.5rem 1rem;
}
</style>
