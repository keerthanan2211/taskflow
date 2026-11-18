export function PageMessage({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted">{children}</div>;
}
