export function Card({ className='', style, children }) {
  return <div style={style} className={`bg-white border rounded-2xl ${className}`}>{children}</div>
}
export function CardHeader({ className='', children }) {
  return <div className={`px-4 pt-4 ${className}`}>{children}</div>
}
export function CardTitle({ className='', children }) {
  return <h2 className={`text-xl font-semibold ${className}`}>{children}</h2>
}
export function CardContent({ className='', children }) {
  return <div className={`px-4 pb-4 ${className}`}>{children}</div>
}
