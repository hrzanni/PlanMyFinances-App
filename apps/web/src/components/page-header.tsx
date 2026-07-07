'use client'

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: React.ReactNode
  subtitle?: string
  children?: React.ReactNode
}) {
  return (
    <div className="mb-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-black text-foreground">{title}</h1>
        <div className="flex-1" />
        {children}
      </div>
      {subtitle ? <p className="mt-1 text-xs text-muted">{subtitle}</p> : null}
    </div>
  )
}
