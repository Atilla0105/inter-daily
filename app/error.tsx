"use client";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="content-wrap flex min-h-screen items-center justify-center">
      <div className="card-border w-full rounded-xl2 bg-surface p-6">
        <p className="mb-2 text-sm uppercase tracking-[0.24em] text-danger">同步异常</p>
        <h1 className="mb-2 text-2xl font-semibold text-text-primary">页面加载失败</h1>
        <p className="mb-4 text-sm text-text-secondary">{error.message || "请稍后再试。"}</p>
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
        >
          重新加载
        </button>
      </div>
    </div>
  );
}
