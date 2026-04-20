// ⚠️ The form below has no server action — submitting it does nothing.
// To implement signup:
//   1. Create a `signup` server action in app/actions/auth.ts
//   2. Add Zod validation (name, email, password, confirm)
//   3. Hash the password with bcrypt and write the user to the database
//   4. Call createSession(userId) and redirect('/lost')
//   5. Wire the action: convert this to a client component and use useActionState,
//      or pass the action directly to the <form action={signup}> element.

import Link from 'next/link'

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

          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-sm font-medium text-zinc-300">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Sam Slug"
                className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-zinc-300">
                UCSC email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="slug@ucsc.edu"
                className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-zinc-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
              />
              <p className="text-xs text-zinc-600">8+ chars, one number, one special character</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirm" className="text-sm font-medium text-zinc-300">
                Confirm password
              </label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                placeholder="••••••••"
                className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
              />
            </div>

            <button
              type="submit"
              className="mt-1 flex h-11 items-center justify-center rounded-full bg-yellow-400 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300"
            >
              Create account
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-yellow-400 hover:text-yellow-300">
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-zinc-700">
          By creating an account you agree to our{' '}
          <Link href="#" className="underline hover:text-zinc-500">Terms of Service</Link>
        </p>
      </div>
    </div>
  )
}
