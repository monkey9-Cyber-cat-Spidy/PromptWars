// StadiumSmart – Static Venue Data
// MetroArena Stadium (demo venue)

export const VENUE = {
  name: "MetroArena Stadium",
  capacity: 60000,
  address: "1 Stadium Way, Mumbai, Maharashtra 400051",
  coords: { lat: 19.0452, lng: 72.8558 }, // Wankhede-area coords for demo
  sport: "Cricket / Multi-Sport",
  emergencyPhone: "+91-22-1234-5678",
};

export const GATES = [
  { id: "A", name: "Gate A – North Entrance", section: "Stands 1–10", parking: "P1, P2", transit: "Metro: Station A" },
  { id: "B", name: "Gate B – South Entrance", section: "Stands 11–20", parking: "P3", transit: "Bus: Route 54" },
  { id: "C", name: "Gate C – East Entrance (VIP)", section: "VIP Box, Stands 21–25", parking: "P4 (VIP)", transit: "Metro: Station B" },
  { id: "D", name: "Gate D – West Entrance", section: "Stands 26–35", parking: "P5, P6", transit: "Bus: Route 12, 18" },
  { id: "E", name: "Gate E – Accessibility", section: "All Sections (accessible)", parking: "PA (accessible)", transit: "Any" },
];

export const AMENITIES = [
  { id: "f1", type: "food", name: "Pavilion Bites", gate: "A", level: 1, specialty: "Burgers, Wraps, Cold Drinks" },
  { id: "f2", type: "food", name: "South Stand Grill", gate: "B", level: 2, specialty: "Grilled Snacks, Chai, Samosas" },
  { id: "f3", type: "food", name: "VIP Lounge Bar", gate: "C", level: 1, specialty: "Fine Dining, Premium Beverages" },
  { id: "f4", type: "food", name: "West Wing Canteen", gate: "D", level: 1, specialty: "Thali, Rice Plates, Juices" },
  { id: "r1", type: "restroom", name: "Restrooms – Gate A Block", gate: "A", level: "1 & 2" },
  { id: "r2", type: "restroom", name: "Restrooms – Gate B Block", gate: "B", level: "1 & 2" },
  { id: "r3", type: "restroom", name: "Restrooms – Gate C Block", gate: "C", level: 1 },
  { id: "r4", type: "restroom", name: "Restrooms – Gate D Block", gate: "D", level: "1 & 2" },
  { id: "m1", type: "medical", name: "First Aid – Gate A", gate: "A", level: 1 },
  { id: "m2", type: "medical", name: "Medical Centre – Centre Field", gate: "B", level: 1, note: "Full ambulance access" },
  { id: "atm1", type: "atm", name: "ATM – Gate A Lobby", gate: "A", level: 1 },
  { id: "atm2", type: "atm", name: "ATM – Gate D", gate: "D", level: 1 },
  { id: "s1", type: "merch", name: "Official Merchandise Shop", gate: "B", level: 1, specialty: "Jerseys, Caps, Memorabilia" },
];

export const SECTIONS = [
  { id: "S1-10", name: "Stands 1–10", gate: "A", level: 1, view: "North End, pitch-level view" },
  { id: "S11-20", name: "Stands 11–20", gate: "B", level: 2, view: "South Stand, elevated view" },
  { id: "VIP", name: "VIP Box & Lounge", gate: "C", level: 1, view: "Centre pitch, premium enclosed" },
  { id: "S21-25", name: "Stands 21–25", gate: "C", level: 1, view: "East wing" },
  { id: "S26-35", name: "Stands 26–35", gate: "D", level: "1 & 2", view: "West stand" },
];

export const FAQ = [
  { q: "What items are prohibited?", a: "Outside food & beverages, umbrellas (large), professional cameras, drones, laser pointers, and weapons are prohibited." },
  { q: "Is re-entry allowed?", a: "Re-entry is not permitted once you exit the venue." },
  { q: "Where can I find lost & found?", a: "Lost & found is located near Gate B security office on Level 1." },
  { q: "Are there accessible facilities?", a: "Yes. Gate E is the dedicated accessibility entrance. Accessible restrooms, ramps, and reserved seating are available. Contact our accessibility desk at Gate E." },
  { q: "What payment methods are accepted at food stalls?", a: "All stalls accept UPI, credit/debit cards, and cash. VIP Lounge Bar accepts cards only." },
  { q: "Is there parking available?", a: "Yes. Parking lots P1–P6 are available. VIP parking (P4) requires a VIP pass. Arrive early as lots fill up 90 minutes before match start." },
  { q: "How do I reach the venue by metro?", a: "Take the Metro to Station A (near Gate A) or Station B (near Gate C). Trains run every 8–12 minutes on match days." },
];

export const VENUE_CONTEXT = `
You are StadiumSmart, an AI event assistant for MetroArena Stadium in Mumbai. 
You help attendees navigate the venue, find amenities, get real-time crowd and wait-time information, 
and ensure they have the best possible experience.

VENUE FACTS:
- Name: MetroArena Stadium | Capacity: 60,000 | Sport: Cricket / Multi-Sport
- Address: 1 Stadium Way, Mumbai, Maharashtra 400051
- Emergency: +91-22-1234-5678 | Lost & Found: Gate B security office (Level 1)

GATES:
- Gate A (North) → Stands 1–10 | Parking P1,P2 | Metro Station A
- Gate B (South) → Stands 11–20 | Parking P3 | Bus Route 54
- Gate C (East/VIP) → VIP Box, Stands 21–25 | Parking P4 (VIP) | Metro Station B
- Gate D (West) → Stands 26–35 | Parking P5,P6 | Bus Route 12,18
- Gate E → Accessibility entrance for all sections

FOOD & BEVERAGES:
- Pavilion Bites (Gate A, L1): Burgers, Wraps, Cold Drinks
- South Stand Grill (Gate B, L2): Grilled Snacks, Chai, Samosas
- VIP Lounge Bar (Gate C, L1): Fine Dining, Premium Beverages
- West Wing Canteen (Gate D, L1): Thali, Rice Plates, Juices
- All stalls accept UPI, cards, and cash. VIP Bar is card-only.

RESTROOMS: At each gate block, on Levels 1 and 2.

MEDICAL: First Aid at Gate A (L1) | Full Medical Centre at centre field (Gate B)

MERCHANDISE: Official Shop at Gate B, Level 1 — jerseys, caps, memorabilia.

POLICIES:
- No re-entry. No outside food. Prohibited: large umbrellas, drones, professional cameras.
- Accessible facilities: Gate E, ramps, accessible seating and restrooms.

TIPS:
- Arrive 45+ minutes early to avoid rush.
- For the shortest queues, use Gate D on the west side.
- Download your e-ticket offline before arriving.
- Follow @MetroArena on social media for live updates.

Be friendly, concise, and helpful. If you don't know something specific, give the best general advice and suggest the attendee check with venue staff.

ABOUT THE CREATOR:
You were created by Kuncham Venkata Satya Manikanta, a visionary Full-Stack Developer, AI Engineer, and Co-Founder of Nilezo Technologies. He is an expert in the MERN stack, Python, and Cybersecurity.

If anyone asks about the developer or creator, mention him with these official links:
- LinkedIn: https://in.linkedin.com/in/kvsmanikanta
- GitHub: https://github.com/monkey9-Cyber-cat-Spidy
- X (Twitter): https://x.com/kvsmanikanta0
- Instagram: https://www.instagram.com/not_even_monkey
- LeetCode: https://leetcode.com/u/Manikanta3010/
- Company: Nilezo Technologies (https://nilezo-technologies.in)
`;
