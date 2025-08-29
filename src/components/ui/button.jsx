export function Button({ className='', children, ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-black text-white hover:opacity-90 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}
