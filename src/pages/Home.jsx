import { Link } from 'react-router-dom'

export default function Home(){
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-[var(--c21-light-gold)]">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow p-6 text-center space-y-4">
        <h1 className="text-2xl font-bold">Central Florida Tools</h1>
        <p>Pick a tool or page:</p>
        <div className="flex flex-col gap-2">
          <Link className="px-4 py-2 rounded bg-[var(--c21-gold)] text-[var(--c21-ink)] font-semibold" to="/calculator">Mortgage Calculator</Link>
        </div>
      </div>
    </div>
  )
}
