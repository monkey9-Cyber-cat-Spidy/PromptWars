// StadiumSmart – Crowd Intelligence Engine
// Simulates real-time crowd levels and wait times for amenities

import { GATES, AMENITIES } from './data.js';

const BASE_WAIT = {
  gate: { min: 1, max: 20 },
  food: { min: 2, max: 25 },
  restroom: { min: 1, max: 15 },
  medical: { min: 0, max: 5 },
  atm: { min: 1, max: 10 },
  merch: { min: 2, max: 18 },
};

// Crowd level: 0–100
let crowdData = {};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function crowdLevel(wait, max) {
  return Math.min(100, Math.round((wait / max) * 100));
}

function generateCrowdData() {
  const data = {};
  // Gates
  GATES.forEach(gate => {
    const wait = randomInt(BASE_WAIT.gate.min, BASE_WAIT.gate.max);
    data[`gate-${gate.id}`] = {
      id: `gate-${gate.id}`,
      name: gate.name,
      type: 'gate',
      waitMinutes: wait,
      crowdLevel: crowdLevel(wait, BASE_WAIT.gate.max),
    };
  });
  // Amenities
  AMENITIES.forEach(am => {
    const range = BASE_WAIT[am.type] || BASE_WAIT.food;
    const wait = randomInt(range.min, range.max);
    data[am.id] = {
      id: am.id,
      name: am.name,
      type: am.type,
      waitMinutes: wait,
      crowdLevel: crowdLevel(wait, range.max),
    };
  });
  return data;
}

export function initCrowd() {
  crowdData = generateCrowdData();
  return crowdData;
}

export function getCrowdData() {
  return crowdData;
}

export function getCrowdEntry(id) {
  return crowdData[id] || null;
}

export function getCrowdLevelLabel(level) {
  if (level < 30) return { text: 'Low', color: '#22c55e' };
  if (level < 65) return { text: 'Moderate', color: '#f59e0b' };
  return { text: 'High', color: '#ef4444' };
}

export function refreshCrowd() {
  // Smoothly drift values rather than jump
  Object.keys(crowdData).forEach(id => {
    const entry = crowdData[id];
    const delta = randomInt(-3, 3);
    const type = entry.type === 'gate' ? 'gate' : entry.type;
    const range = BASE_WAIT[type] || BASE_WAIT.food;
    entry.waitMinutes = Math.max(range.min, Math.min(range.max, entry.waitMinutes + delta));
    entry.crowdLevel = crowdLevel(entry.waitMinutes, range.max);
  });
  return crowdData;
}

// Lightweight summary for the Gemini system prompt
export function getCrowdSummary() {
  const lines = [];
  Object.values(crowdData).forEach(e => {
    const lbl = getCrowdLevelLabel(e.crowdLevel);
    lines.push(`${e.name}: ${lbl.text} (≈${e.waitMinutes} min wait)`);
  });
  return lines.join('\n');
}
