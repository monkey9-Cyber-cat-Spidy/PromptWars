// StadiumSmart – Gemini API Integration
// Handles streaming chat with venue-aware system prompt

import { VENUE_CONTEXT } from './data.js';
import { getCrowdSummary } from './crowd.js';

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

let apiKey = '';
let conversationHistory = [];

export function setApiKey(key) {
  apiKey = key.trim();
}

export function getApiKey() {
  return apiKey;
}

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
  if (!apiKey) throw new Error('API key not set');

  // Add user message to history
  conversationHistory.push({ role: 'user', parts: [{ text: userMessage }] });

  const body = {
    system_instruction: {
      parts: [{ text: buildSystemInstruction() }],
    },
    contents: conversationHistory,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 512,
    },
  };

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const assistantText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!assistantText) throw new Error('Empty response from Gemini');

    // Add assistant response to history (keep last 10 turns to stay within limits)
    conversationHistory.push({ role: 'model', parts: [{ text: assistantText }] });
    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
    }

    // Stream-simulate: split into chunks and send progressively
    if (onChunk) {
      const words = assistantText.split(' ');
      let accumulated = '';
      for (let i = 0; i < words.length; i++) {
        accumulated += (i === 0 ? '' : ' ') + words[i];
        onChunk(accumulated, false);
        await sleep(18);
      }
      onChunk(assistantText, true);
    }

    return assistantText;
  } catch (err) {
    conversationHistory.pop(); // Remove failed user message from history
    throw err;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getSuggestedQuestions() {
  return [
    "🏟️ How do I get to my seat in Stand 15?",
    "🍔 Where's the nearest food stall to Gate A?",
    "🚗 How should I exit after the match ends?",
    "🚻 Which restroom has the shortest queue right now?",
    "♿ What accessibility facilities are available?",
    "🚨 What should I do in an emergency?",
  ];
}
