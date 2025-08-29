export function Switch({ checked, onCheckedChange }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer select-none">
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e)=>onCheckedChange?.(e.target.checked)} />
      <span className={`w-10 h-6 rounded-full transition-colors ${checked ? 'bg-black' : 'bg-gray-300'}`}></span>
      <span className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${checked ? 'translate-x-4' : ''}`}></span>
    </label>
  )
}
