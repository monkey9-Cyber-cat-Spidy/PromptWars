// StadiumSmart – Gemini API Integration (Production Proxy Version)
// Communicates with our server.py backend to keep API keys secure.

import { VENUE_CONTEXT } from './data.js';
import { getCrowdSummary } from './crowd.js';

let conversationHistory = [];

export function clearHistory() {
  conversationHistory = [];
}

function buildSystemInstruction() {
  const crowdInfo = getCrowdSummary();
  return `${VENUE_CONTEXT}

CURRENT LIVE CROWD & WAIT TIME DATA:
${crowdInfo}

Use the above crowd data to give real-time, accurate advice. For example, if a gate has high crowd levels, suggest alternatives.`;
}

export async function sendMessage(userMessage, onChunk) {
  // Add user message to local history for tracking
  // Note: Backend also appends this, but we keep it for rendering consistency if needed
  
  const payload = {
    message: userMessage,
    history: conversationHistory,
    system_context: buildSystemInstruction()
  };

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.reply || `Server Error (${response.status})`);
    }

    const data = await response.json();
    const assistantText = data.reply;

    if (!assistantText) throw new Error('Empty response from assistant');

    // Update conversation history
    conversationHistory.push({ role: 'user', parts: [{ text: userMessage }] });
    conversationHistory.push({ role: 'model', parts: [{ text: assistantText }] });
    
    // Keep history manageable
    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
    }

    // Since we are not streaming from the backend yet (for simplicity/reliability),
    // we simulate the streaming effect on the frontend for the "AI feel".
    if (onChunk) {
      const words = assistantText.split(' ');
      let accumulated = '';
      for (let i = 0; i < words.length; i++) {
        accumulated += (i === 0 ? '' : ' ') + words[i];
        onChunk(accumulated, false);
        await new Promise(r => setTimeout(r, 15));
      }
      onChunk(assistantText, true);
    }

    return assistantText;
  } catch (err) {
    throw err;
  }
}

export function getSuggestedQuestions() {
  return [
    "🏟️ How do I get to my seat in Stand 15?",
    "🍔 Where's the nearest food stall to Gate B?",
    "🚗 How should I exit after the match ends?",
    "🚻 Which restroom has the shortest queue right now?",
    "♿ What accessibility facilities are available?",
    "🚨 What should I do in an emergency?",
  ];
}
