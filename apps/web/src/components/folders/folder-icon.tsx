/** Glyph genérico de pasta (não há mais ícone customizável por pasta). */
export function FolderIcon({ muted = false }: { muted?: boolean }) {
  return (
    <div
      className={`flex h-10 w-10 flex-none items-center justify-center rounded-full ${
        muted ? 'bg-muted/10 text-muted' : 'bg-foreground/[0.06] text-foreground'
      }`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      </svg>
    </div>
  )
}
