import CreateForm from './create-form'

type PageProps = {
  // In Next.js 16, searchParams is a Promise — it must be awaited.
  // This page is a server component so it can await it, then passes
  // the resolved value down to the client component as a plain prop.
  searchParams: Promise<{ type?: string }>
}

export default async function CreatePage({ searchParams }: PageProps) {
  const { type } = await searchParams

  // Default to 'lost'. Any value other than 'found' is treated as 'lost'
  // so the form never starts in an undefined state.
  const initialType: 'lost' | 'found' = type === 'found' ? 'found' : 'lost'

  return <CreateForm initialType={initialType} />
}
