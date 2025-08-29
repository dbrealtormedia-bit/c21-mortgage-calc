export function Input({ className='', ...props }) {
  return (
    <input
      {...props}
      className={`w-full h-10 rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-black/10 ${className}`}
    />
  )
}
