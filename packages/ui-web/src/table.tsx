import { cn } from './cn'

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full border-collapse text-sm tabular-nums', className)} {...props} />
    </div>
  )
}

export function Th({
  className,
  numeric,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <th
      className={cn(
        'bg-foreground px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-background first:rounded-l-md last:rounded-r-md',
        numeric && 'text-right',
        className,
      )}
      {...props}
    />
  )
}

export function Td({
  className,
  numeric,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <td
      className={cn('border-b border-line px-3 py-2.5 text-body', numeric && 'text-right', className)}
      {...props}
    />
  )
}
