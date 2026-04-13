import Sidebar from '@/app/components/sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <Sidebar />
      {/* Main content — add bottom padding on mobile for the tab bar */}
      <div className="flex flex-1 flex-col min-w-0 pb-20 md:pb-0">
        {children}
      </div>
    </div>
  )
}
