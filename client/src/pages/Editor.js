import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import API from '../services/api';

import '../styles/editor.css'; // <-- make sure this file exists

export default function Editor() {
  const { id } = useParams();
  const nav = useNavigate();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('Loading...');
  const [activeUsers, setActiveUsers] = useState([]);
  const [role, setRole] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const socketRef = useRef();
  const saveTimerRef = useRef();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { nav('/login'); return; }

    socketRef.current = io(process.env.REACT_APP_SOCKET || 'http://localhost:4000', { auth: { token } });
    const s = socketRef.current;

    s.on('connect_error', (err) => console.error('socket connect error', err.message));

    s.emit('join-document', { docId: id });

    s.on('document-load', ({ content: c, title: t, ownerId, collaborators: cols }) => {
      setContent(c || '');
      setTitle(t || 'Untitled');
      setCollaborators(cols || []);

      if (String(ownerId) === user.id) setRole('owner');
      else {
        const me = (cols || []).find(x => String(x.userId) === user.id);
        setRole(me ? me.role : 'viewer');
      }
    });

    s.on('content-change', ({ content: c }) => setContent(c));
    s.on('active-users', list => setActiveUsers(list || []));
    s.on('document-saved', () => {});

    API.get('/docs/' + id)
      .then(res => {
        setContent(res.data.doc.content || '');
        setTitle(res.data.doc.title || 'Untitled');
        setRole(res.data.role);
        setCollaborators(res.data.doc.collaborators || []);
      })
      .catch(e => console.error(e));

    return () => {
      s.emit('leave-document', { docId: id });
      s.disconnect();
    };
  }, [id, nav]);

  useEffect(() => {
    const s = socketRef.current;
    if (!s) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (!(role === 'owner' || role === 'collaborator')) return;

    saveTimerRef.current = setTimeout(() => {
      s.emit('content-change', { docId: id, content });
    }, 300);
  }, [content, id, role]);

  useEffect(() => {
    const s = socketRef.current;
    const timer = setInterval(() => {
      if (s && (role === 'owner' || role === 'collaborator'))
        s.emit('save-document', { docId: id, content });

      if (role === 'owner' || role === 'collaborator')
        API.put('/docs/' + id + '/content', { content }).catch(e => console.error(e));
    }, 10000);

    return () => clearInterval(timer);
  }, [id, content, role]);

  async function saveNow() {
    const s = socketRef.current;

    if (!(role === 'owner' || role === 'collaborator'))
      return alert('You do not have permission to save.');

    if (s) s.emit('save-document', { docId: id, content });

    if (role === 'owner') {
      await API.put('/docs/' + id + '/title', { title }).catch(console.error);
    }

    await API.put('/docs/' + id + '/content', { content }).catch(console.error);
    alert('Saved');
  }

  async function invite() {
    if (!inviteEmail) return alert('Enter email');

    try {
      const res = await API.post('/docs/' + id + '/collaborators', {
        email: inviteEmail,
        role: 'collaborator'
      });

      setCollaborators(res.data.collaborators || []);
      setInviteEmail('');
      alert('Invited');
    } catch (e) {
      alert(e.response?.data?.message || 'Invite failed');
    }
  }

  async function removeCollab(collabId) {
    if (!window.confirm('Remove collaborator?')) return;

    try {
      const res = await API.delete('/docs/' + id + '/collaborators/' + collabId);
      setCollaborators(res.data.collaborators || []);
    } catch (e) {
      alert(e.response?.data?.message || 'Remove failed');
    }
  }

  async function deleteDoc() {
    if (!window.confirm('Delete document? This cannot be undone.')) return;

    try {
      await API.delete('/docs/' + id);
      nav('/dashboard');
    } catch (e) {
      alert(e.response?.data?.message || 'Delete failed');
    }
  }

 return (
  <div className="editor-container">

    <div className="editor-left">
      <div className="editor-topbar">
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <input value={title} onChange={e=>setTitle(e.target.value)} 
            className="title-input"
            disabled={role !== 'owner'} />

          <span className="role-badge"><b>Your role:</b> {role}</span>
        </div>

        <div>
          <button className="btn" onClick={saveNow}>Save</button>
          <button className="btn" onClick={()=>nav('/dashboard')}>Back</button>
          {role === 'owner' && (
            <button className="btn btn-danger" onClick={deleteDoc}>Delete</button>
          )}
        </div>
      </div>

      <textarea
        className="text-editor"
        value={content}
        onChange={e=>setContent(e.target.value)}
        readOnly={!(role === 'owner' || role === 'collaborator')}
      />
    </div>

    <div className="editor-right">
      <h4>Active collaborators</h4>
      <div className="list-box">
        <ul>
          {activeUsers.map(u=>(
            <li key={u.userId}>{u.username}</li>
          ))}
        </ul>
      </div>

      <h4>Collaborators</h4>
      <div className="list-box">
        <ul>
          {collaborators.map(c=>(
            <li key={c.userId}>
              {c.userId} — {c.role}
              {role === 'owner' && (
                <button onClick={() => removeCollab(c.userId)}>Remove</button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {role === 'owner' && (
        <div className="invite-box">
          <input placeholder="Invite by email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)} />
          <button className="btn" onClick={invite}>Invite</button>
        </div>
      )}

      <div className="info-box">
        Auto-saves every 10s. Real-time updates enabled.
      </div>
    </div>

  </div>
);

}
