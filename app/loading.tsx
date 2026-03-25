export default function Loading() {
  return (
    <div className="content-wrap flex min-h-screen items-center justify-center">
      <div className="card-border surface-glow w-full rounded-xl2 bg-surface p-6 text-center">
        <div className="mx-auto mb-3 h-10 w-10 animate-live rounded-full border border-live/50 bg-live/15" />
        <p className="text-sm text-text-secondary">正在装载国米日报...</p>
      </div>
    </div>
  );
}
