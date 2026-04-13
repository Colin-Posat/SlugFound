import Link from 'next/link'
import LoginForm from './login-form'

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
          <div className="mb-6 text-center">
            <span className="text-3xl">🐌</span>
            <h1 className="mt-3 text-2xl font-bold text-white">Welcome back</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Sign in to your SlugFound account
            </p>
          </div>

          <LoginForm />

          <p className="mt-6 text-center text-sm text-zinc-500">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-medium text-yellow-400 hover:text-yellow-300">
              Sign up free
            </Link>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-zinc-700">
          By signing in you agree to our{' '}
          <Link href="#" className="underline hover:text-zinc-500">Terms of Service</Link>
        </p>
      </div>
    </div>
  )
}
