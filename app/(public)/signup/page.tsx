import Link from 'next/link'
import SignupForm from './signup-form'

/**
 * Sign-up page (US 2.1).
 * The form is split into a separate client component so this page can stay
 * a pure server component. The form handles all validation + Supabase signup.
 */
export default function SignupPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
          <div className="mb-6 text-center">
            <span className="text-3xl">🐌</span>
            <h1 className="mt-3 text-2xl font-bold text-white">Create an account</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Join SlugFound with your UCSC email
            </p>
          </div>

          <SignupForm />
        </div>

        <p className="mt-4 text-center text-xs text-zinc-700">
          By creating an account you agree to our{' '}
          <Link href="#" className="underline hover:text-zinc-500">
            Terms of Service
          </Link>
        </p>
      </div>
    </div>
  )
}
