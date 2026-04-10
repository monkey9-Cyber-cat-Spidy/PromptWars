// StadiumSmart – App Bootstrap & SPA Router

import { initCrowd, refreshCrowd, getCrowdData, getCrowdLevelLabel } from './crowd.js';
import { initMap, getTransitInfo } from './map.js';
import { sendMessage, getSuggestedQuestions, clearHistory } from './gemini.js';
import { GATES, AMENITIES, FAQ } from './data.js';

// ─── State ──────────────────────────────────────────────────────────────────
let currentSection = 'dashboard';
let chatInitialized = false;
let mapLoaded = false;
let crowdRefreshTimer = null;

// ─── Init ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initCrowd();
  setupNavigation();
  renderDashboard();
  setupChatInput();
  appendWelcomeMessage();
  updateGreeting();
  renderExperience();

  // Refresh crowd data every 30 seconds
  crowdRefreshTimer = setInterval(() => {
    refreshCrowd();
    if (currentSection === 'dashboard') renderCrowdBadges();
    if (currentSection === 'crowd') renderCrowdIntel();
  }, 30000);

  // Animate score every 90 seconds (simulate live match)
  setInterval(animateScore, 90000);
});

// ─── UI Helpers ──────────────────────────────────────────────────────────────
function updateGreeting() {
  const el = document.getElementById('greeting-title');
  if (!el) return;

  const hour = new Date().getHours();
  let greeting = 'Good Evening!';
  if (hour < 12) greeting = 'Good Morning!';
  else if (hour < 18) greeting = 'Good Afternoon!';

  el.textContent = `${greeting} 👋`;
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function setupNavigation() {
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.nav;
      navigateTo(target);
    });
  });
}

function navigateTo(section) {
  currentSection = section;

  // Update nav active state
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.nav === section);
  });

  // Show/hide sections
  document.querySelectorAll('.section').forEach(el => {
    el.classList.toggle('active', el.id === `section-${section}`);
  });

  // Lazy init
  switch (section) {
    case 'assistant':
      if (!chatInitialized) initChat();
      break;
    case 'map':
      if (!mapLoaded) {
        const mapsKey = document.getElementById('maps-key-input')?.value?.trim() || '';
        initMap('map-container', mapsKey);
        renderTransitInfo();
        mapLoaded = true;
      }
      break;
    case 'crowd':
      renderCrowdIntel();
      break;
    case 'dashboard':
      renderCrowdBadges();
      break;
  }
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
function renderDashboard() {
  renderCrowdBadges();
  renderMatchCard();
  renderQuickActions();
}

function renderMatchCard() {
  const el = document.getElementById('match-card');
  if (!el) return;
  el.innerHTML = `
    <div class="match-teams">
      <div class="team">
        <span class="team-flag">🇮🇳</span>
        <span class="team-name">India</span>
        <span class="team-score" id="score-india">287/4</span>
        <span class="team-overs">(42.3 ov)</span>
      </div>
      <div class="vs-badge">VS</div>
      <div class="team">
        <span class="team-flag">🏴󠁧󠁢󠁥󠁮󠁧󠁿</span>
        <span class="team-name">England</span>
        <span class="team-score" id="score-eng">–</span>
        <span class="team-overs">Batting 2nd</span>
      </div>
    </div>
    <div class="match-meta">
      <span class="live-dot"></span>
      <span>LIVE — ODI Match · MetroArena Stadium</span>
    </div>
  `;
}

let indiaRuns = 287, indiaWickets = 4, indiaOvers = 42.3;
function animateScore() {
  indiaRuns += Math.floor(Math.random() * 12) + 1;
  const ball = Math.round((Math.random() * 5) * 10) / 10;
  indiaOvers = Math.min(50, +(indiaOvers + 0.1).toFixed(1));
  const el = document.getElementById('score-india');
  if (el) el.textContent = `${indiaRuns}/${indiaWickets}`;
}

function renderCrowdBadges() {
  const el = document.getElementById('crowd-badges');
  if (!el) return;
  const data = getCrowdData();
  const gates = Object.values(data).filter(d => d.type === 'gate').slice(0, 4);
  el.innerHTML = gates.map(g => {
    const lbl = getCrowdLevelLabel(g.crowdLevel);
    return `
      <div class="crowd-badge" role="status" aria-label="${g.name}: ${lbl.text} crowd">
        <span class="badge-dot" style="background:${lbl.color}"></span>
        <span class="badge-name">Gate ${g.id.replace('gate-', '')}</span>
        <span class="badge-label" style="color:${lbl.color}">${lbl.text}</span>
        <span class="badge-wait">≈${g.waitMinutes}m</span>
      </div>
    `;
  }).join('');
}

function renderQuickActions() {
  const el = document.getElementById('quick-actions');
  if (!el) return;
  const actions = [
    { icon: '🤖', label: 'Ask AI Assistant', nav: 'assistant' },
    { icon: '🗺️', label: 'Venue Map', nav: 'map' },
    { icon: '👥', label: 'Crowd Intel', nav: 'crowd' },
    { icon: '🎟️', label: 'My Experience', nav: 'experience' },
  ];
  el.innerHTML = actions.map(a => `
    <button class="quick-action-btn" data-nav="${a.nav}" aria-label="${a.label}">
      <span class="qa-icon">${a.icon}</span>
      <span class="qa-label">${a.label}</span>
    </button>
  `).join('');
  // Re-bind navigation for dynamically created buttons
  el.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.nav));
  });
}

// ─── Chat Assistant ───────────────────────────────────────────────────────────
function initChat() {
  chatInitialized = true;
  renderSuggestedQuestions();
}

function renderSuggestedQuestions() {
  const el = document.getElementById('suggested-questions');
  if (!el) return;
  
  el.innerHTML = '';
  getSuggestedQuestions().forEach(q => {
    const btn = document.createElement('button');
    btn.className = 'suggestion-chip';
    btn.textContent = q;
    btn.setAttribute('aria-label', `Ask: ${q}`);
    btn.addEventListener('click', () => {
      const input = document.getElementById('chat-input');
      if (input) {
        input.value = q;
        submitChat();
      }
    });
    el.appendChild(btn);
  });
}


function setupChatInput() {
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  if (!form || !input) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    submitChat();
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitChat();
    }
  });
}

async function submitChat() {
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const messages = document.getElementById('chat-messages');
  if (!input || !messages) return;

  const text = input.value.trim();
  if (!text) return;

  // Backend now handles keys
  appendMessage('user', text, messages);
  input.value = '';
  input.disabled = true;
  if (sendBtn) sendBtn.disabled = true;

  // Hide suggested questions after first message
  const sq = document.getElementById('suggested-questions');
  if (sq) sq.style.display = 'none';

  // Show typing indicator
  const typingId = appendTypingIndicator(messages);

  try {
    let assistantEl = null;

    await sendMessage(text, (chunk, done) => {
      // Remove typing indicator on first chunk
      const typing = document.getElementById(typingId);
      if (typing) typing.remove();

      if (!assistantEl) {
        assistantEl = appendMessage('assistant', chunk, messages, true);
      } else {
        assistantEl.querySelector('.msg-content').innerHTML = formatMessage(chunk);
      }

      if (done) messages.scrollTop = messages.scrollHeight;
    });
  } catch (err) {
    const typing = document.getElementById(typingId);
    if (typing) typing.remove();
    appendMessage('error', `⚠️ ${err.message}`, messages);
  }

  input.disabled = false;
  if (sendBtn) sendBtn.disabled = false;
  input.focus();
}

function appendMessage(role, text, container, returnEl = false) {
  const el = document.createElement('div');
  el.className = `chat-message ${role}`;
  el.setAttribute('role', 'article');
  el.setAttribute('aria-label', `${role === 'user' ? 'You' : 'StadiumSmart'}: ${text.substring(0, 50)}`);
  el.innerHTML = `
    <div class="msg-avatar">${role === 'user' ? '👤' : role === 'error' ? '❗' : '🤖'}</div>
    <div class="msg-body">
      <div class="msg-content">${formatMessage(text)}</div>
      <div class="msg-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
    </div>
  `;
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
  return returnEl ? el : null;
}

function appendTypingIndicator(container) {
  const id = 'typing-' + Date.now();
  const el = document.createElement('div');
  el.className = 'chat-message assistant typing-indicator-wrapper';
  el.id = id;
  el.innerHTML = `
    <div class="msg-avatar">🤖</div>
    <div class="msg-body">
      <div class="typing-indicator">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
  return id;
}

function formatMessage(text) {
  // Basic markdown-lite: bold, bullets, line breaks
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n/g, '<br>');
}

// ─── Crowd Intel ──────────────────────────────────────────────────────────────
function renderCrowdIntel() {
  const el = document.getElementById('crowd-intel-grid');
  if (!el) return;
  const data = getCrowdData();
  const sorted = Object.values(data).sort((a, b) => b.crowdLevel - a.crowdLevel);

  el.innerHTML = sorted.map(item => {
    const lbl = getCrowdLevelLabel(item.crowdLevel);
    const typeIcon = { gate: '🚪', food: '🍔', restroom: '🚻', medical: '🏥', atm: '🏧', merch: '🛍️' };
    const barWidth = item.crowdLevel;
    return `
      <div class="crowd-card" role="status" aria-label="${item.name}: ${lbl.text}, ${item.waitMinutes} minute wait">
        <div class="crowd-card-header">
          <span class="crowd-type-icon">${typeIcon[item.type] || '📍'}</span>
          <div class="crowd-card-title">
            <div class="crowd-card-name">${item.name}</div>
            <div class="crowd-card-type">${item.type.charAt(0).toUpperCase() + item.type.slice(1)}</div>
          </div>
          <div class="crowd-card-wait" style="color:${lbl.color}">
            <div class="wait-minutes">${item.waitMinutes}m</div>
            <div class="wait-label">wait</div>
          </div>
        </div>
        <div class="crowd-bar-bg" aria-hidden="true">
          <div class="crowd-bar-fill" style="width:${barWidth}%; background:${lbl.color}; transition: width 1s ease;"></div>
        </div>
        <div class="crowd-bar-labels" aria-hidden="true">
          <span style="color:${lbl.color}">${lbl.text}</span>
          <span>${item.crowdLevel}% capacity</span>
        </div>
      </div>
    `;
  }).join('');
}

// ─── Venue Map ────────────────────────────────────────────────────────────────
function renderTransitInfo() {
  const el = document.getElementById('transit-info');
  if (!el) return;
  el.innerHTML = getTransitInfo().map(t => `
    <div class="transit-item">
      <span class="transit-icon">${t.icon}</span>
      <div>
        <div class="transit-label">${t.label}</div>
        <div class="transit-detail">${t.detail}</div>
      </div>
    </div>
  `).join('');
}

// ─── My Experience ────────────────────────────────────────────────────────────
function renderExperience() {
  const el = document.getElementById('experience-content');
  if (!el) return;

  el.innerHTML = `
    <div class="experience-card">
      <div class="experience-header">
        <span class="experience-icon">🎟️</span>
        <div>
          <div class="experience-title">Your Seat</div>
          <div class="experience-subtitle">Stand 15 · Row G · Seat 24</div>
        </div>
      </div>
      <div class="experience-details">
        <div class="exp-detail-row"><span>Gate</span><span>Gate B (South)</span></div>
        <div class="exp-detail-row"><span>Level</span><span>Level 2</span></div>
        <div class="exp-detail-row"><span>View</span><span>South Stand, elevated pitch view</span></div>
        <div class="exp-detail-row"><span>Nearest Food</span><span>South Stand Grill (same level)</span></div>
        <div class="exp-detail-row"><span>Nearest Restroom</span><span>Gate B Block, Level 2</span></div>
      </div>
    </div>
    <div class="tips-card">
      <h3 class="tips-title">💡 Smart Tips for You</h3>
      <ul class="tips-list">
        <li>Your nearest entry is <strong>Gate B</strong> — currently <strong>moderate</strong> crowd. Allow 8 min for security.</li>
        <li>Avoid the Gate A rush — try Gate D for a smoother walk to your stand.</li>
        <li>South Stand Grill is on your level. Queue is short (~5 min) right now.</li>
        <li>Exit tip: After the match, leave via Gate B West exit to avoid bottlenecks.</li>
      </ul>
    </div>
    <div class="faq-card">
      <h3 class="faq-title">❓ Venue FAQ</h3>
      ${FAQ.map((f, i) => `
        <details class="faq-item" id="faq-${i}">
          <summary class="faq-question">${f.q}</summary>
          <div class="faq-answer">${f.a}</div>
        </details>
      `).join('')}
    </div>
  `;
}


function appendWelcomeMessage() {
  const messages = document.getElementById('chat-messages');
  if (!messages || messages.children.length > 0) return;
  const el = document.createElement('div');
  el.className = 'chat-message assistant welcome';
  el.innerHTML = `
    <div class="msg-avatar">🤖</div>
    <div class="msg-body">
      <div class="msg-content">
        👋 Welcome to <strong>MetroArena Stadium</strong>! I'm your StadiumSmart AI concierge.<br><br>
        I can help you navigate the venue, find the shortest queues, locate amenities, and make today's match experience seamless.<br><br>
        Try one of the suggested questions below, or ask me anything!
      </div>
    </div>
  `;
  messages.appendChild(el);
}
