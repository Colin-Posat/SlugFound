import Sidebar from '@/app/components/sidebar'
import { UnreadProvider } from '@/app/lib/unread-context'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    // UnreadProvider wraps the entire authenticated section so both Sidebar
    // (which reads totalUnread) and MessagesView (which calls clearUnread)
    // share the same unread count state.
    <UnreadProvider>
      <div className="flex min-h-screen bg-zinc-950 text-white">
        <Sidebar />
        {/* pb-20 reserves space for the fixed mobile tab bar (height ≈ 80px).
            md:pb-0 removes it on desktop where the tab bar is hidden. */}
        <div className="flex flex-1 flex-col min-w-0 pb-20 md:pb-0">
          {children}
        </div>
      </div>
    </UnreadProvider>
  )
}
