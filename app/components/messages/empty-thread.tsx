export default function EmptyThread() {
  return (
    <div className="hidden flex-1 flex-col items-center justify-center gap-3 md:flex">
      <span className="text-5xl">💬</span>
      <p className="text-sm text-muted">Select a conversation to start messaging</p>
    </div>
  )
}
