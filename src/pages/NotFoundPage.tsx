import { Link } from 'react-router-dom'
import { Button } from '../components/Button'

export function NotFoundPage() {
  return (
    <div className='flex min-h-screen items-center justify-center px-4 py-10'>
      <div className='glass-panel w-full max-w-lg p-10 text-center'>
        <p className='text-xs uppercase tracking-[0.3em] text-slate-400'>404</p>
        <h1 className='mt-3 text-3xl font-semibold text-slate-900'>Page not found</h1>
        <p className='mt-2 text-sm text-slate-600'>The page you’re looking for doesn’t exist.</p>
        <Link to='/login' className='mt-6 block'>
          <Button className='w-full'>Go to login</Button>
        </Link>
      </div>
    </div>
  )
}
