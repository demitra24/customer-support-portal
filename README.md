RELAY — Customer Support Intelligence Portal
Full-stack customer support platform with role-based dashboards, live ticket triage,escalation workflows, and interactive analytics.

Live demo: https://customer-support-portal.onrender.com · 
<img width="1910" height="962" alt="lc" src="https://github.com/user-attachments/assets/b4fb79a4-47f0-46f8-a39c-96b40a086070" />
<img width="1912" height="905" alt="rd" src="https://github.com/user-attachments/assets/c1f39b9b-64ec-4426-b301-6038464e27b7" />
<img width="1912" height="897" alt="rrd" src="https://github.com/user-attachments/assets/9e1a12b7-745d-4775-84ea-edab6e292e19" />
<img width="1912" height="907" alt="rteam" src="https://github.com/user-attachments/assets/e3838923-da9e-43a1-a733-e85c02da3a73" />
<img width="1912" height="901" alt="queue" src="https://github.com/user-attachments/assets/18db184b-6feb-4697-b3ee-2f6fd301656a" />
<img width="1857" height="965" alt="myticket" src="https://github.com/user-attachments/assets/f5c9c967-46d4-444c-b06f-b37184ceaf5f" />







Demo accounts
Role	Email	Password
Admin	priya@relay.io	admin123
Agent	dana@relay.io	agent123
Customer	sam@relay.io	customer123


Tech stack
Frontend: React 18, React Router, Tailwind CSS, Vite, Axios
Backend: Node.js, Express.js, JWT auth, bcrypt
Database: MongoDB (Mongoose ODM)
Hosting: Render (full-stack single service), MongoDB Atlas

Features
🔐 Role-based dashboards — customers, agents, and admins each see their own scoped view (enforced server-side, not just hidden UI)
🎫 Full ticket lifecycle — create, assign, prioritize, track status, escalate
🧠 Live triage engine — as a customer types, a rules engine classifies category, priority, and sentiment in real time; agents get suggested replies computed from the latest customer message
📊 Analytics dashboard — ticket volume (14-day), avg resolution time, CSAT gauge, category breakdown, per-agent performance — all hand-built SVG charts fed by a single aggregation endpoint
⭐ CSAT ratings — customers rate resolved tickets; ratings feed agent scorecards
🔄 Real-time-ish sync — ticket threads poll every 15s, briefing dashboard every 30s
Running locally
# 1. Backend
cd servernpm installcp .env.example .env        # set MONGO_URI + JWT_SECRETnpm run seed                # 10 demo users, 46 ticketsnpm run dev                 # http://localhost:5000# 
2. Frontend (new terminal)
cd clientnpm installnpm run dev                 # http://localhost:5173


