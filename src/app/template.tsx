export default function Template({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="pg-route-shell">{children}</div>;
}
