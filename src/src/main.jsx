import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './index.css'
import Calculator from './pages/Calculator'

function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-[var(--c21-light-gold)]">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow p-6 text-center space-y-4">
        <h1 className="text-2xl font-bold">Central Florida Tools</h1>
        <p>Pick a tool:</p>
        <div className="flex flex-col gap-2">
          <Link className="px-4 py-2 rounded bg-[var(--c21-gold)] text-[var(--c21-ink)] font-semibold" to="/calculator">Mortgage Calculator</Link>
        </div>
      </div>
    </div>
  )
}

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
