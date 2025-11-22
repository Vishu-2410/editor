import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';

function App(){
  const token = localStorage.getItem('token');
  return (
    <div style={{fontFamily:'Arial, sans-serif'}}>
      <Routes>
        <Route path='/' element={token ? <Navigate to='/dashboard' /> : <Navigate to='/login' />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/editor/:id' element={<Editor />} />
      </Routes>
    </div>
  );
}

export default App;
