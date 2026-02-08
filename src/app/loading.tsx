export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 sm:p-6 lg:p-8">
      <div className="bg-muted h-8 w-52 animate-pulse rounded-md" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bg-muted h-24 animate-pulse rounded-lg" />
        <div className="bg-muted h-24 animate-pulse rounded-lg" />
        <div className="bg-muted h-24 animate-pulse rounded-lg" />
      </div>
      <div className="bg-muted h-72 animate-pulse rounded-lg" />
    </main>
  );
}
