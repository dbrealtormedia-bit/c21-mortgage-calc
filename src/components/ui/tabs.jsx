import React, { createContext, useContext, useState, useEffect } from 'react'
const TabsCtx = createContext(null)

export function Tabs({ value, onValueChange, children, className='' }) {
  const [val, setVal] = useState(value)
  useEffect(()=>setVal(value),[value])
  const set = (v)=>{ setVal(v); onValueChange?.(v) }
  return <TabsCtx.Provider value={{ val, set }}>{children}</TabsCtx.Provider>
}
export function TabsList({ children, className='' }) {
  return <div className={`grid gap-2 p-1 bg-gray-100 rounded-md ${className}`}>{children}</div>
}
export function TabsTrigger({ value, children, className='' }) {
  const { val, set } = useContext(TabsCtx)
  const active = val === value
  return (
    <button onClick={()=>set(value)} className={`px-3 py-2 rounded text-sm font-medium ${active ? 'bg-white shadow' : 'opacity-70'} ${className}`}>
      {children}
    </button>
  )
}
export function TabsContent({ value, children, className='' }) {
  const { val } = useContext(TabsCtx)
  if (val !== value) return null
  return <div className={className}>{children}</div>
}
