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
        <div className="rounded-2xl border border-line bg-surface p-8">
          <div className="mb-6 text-center">
            <span className="text-3xl">🐌</span>
            <h1 className="mt-3 text-2xl font-bold text-ink">Create an account</h1>
            <p className="mt-1 text-sm text-muted">
              Join SlugFound with your UCSC email
            </p>
          </div>

          <SignupForm />
        </div>

        <p className="mt-4 text-center text-xs text-muted">
          By creating an account you agree to our{' '}
          <Link href="#" className="underline hover:text-muted">
            Terms of Service
          </Link>
        </p>
      </div>
    </div>
  )
}
