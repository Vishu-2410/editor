# Real-Time Collaborative Document Editor (MERN + Socket.IO) — Updated with Roles

This updated repository implements role-based permissions (owner, collaborator, viewer) and maintains real-time collaboration using Socket.IO.

## Main changes
- Document schema includes collaborators with roles.
- Routes to add/remove collaborators (owner-only).
- Socket.IO enforces roles on content-change and save-document.
- Frontend Editor uses role info to disable/enable actions.

## Run
1. Start MongoDB.
2. Backend: cd server && npm install && npm run dev
3. Frontend: cd client && npm install && npm start

Frontend expects backend at http://localhost:4000
Set REACT_APP_API and REACT_APP_SOCKET in the client if needed.
