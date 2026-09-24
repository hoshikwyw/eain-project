/** Skeleton while dashboard data loads. Layout chrome stays visible. */
export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="h-9 w-64 animate-pulse rounded-lg bg-muted" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-muted" />
    </div>
  );
}
