import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './index.css'
import Calculator from '@/pages/Calculator'
import Home from '@/pages/Home'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/calculator" element={<Calculator />} />
        <Route path="*" element={
          <div className="p-8 text-center">
            Not Found — <Link className="text-blue-600 underline" to="/">Go Home</Link>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
