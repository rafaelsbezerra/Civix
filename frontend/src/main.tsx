import React from 'react'
import ReactDOM from 'react-dom/client'

import { BrowserRouter, Routes, Route } from 'react-router-dom'

// import App from './App'

import Login from './pages/Login/login'
import Empresa from './pages/empresa/page'

import './index.css'


export default function Home() {
  return (
    <div>
      <h1>Home Page</h1>
      <p>Welcome to the Home page!</p>
      <button onClick={() => window.location.href = '/login'}>Go to Login</button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/empresa" element={<Empresa />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)