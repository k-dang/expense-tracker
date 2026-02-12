export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="bg-muted h-8 w-52 animate-pulse rounded-md" />
      <div className="bg-muted h-10 w-96 animate-pulse rounded-md" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-muted h-24 animate-pulse rounded-lg" />
        <div className="bg-muted h-24 animate-pulse rounded-lg" />
        <div className="bg-muted h-24 animate-pulse rounded-lg" />
        <div className="bg-muted h-24 animate-pulse rounded-lg" />
      </div>
      <div className="bg-muted h-80 animate-pulse rounded-lg" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-muted h-72 animate-pulse rounded-lg" />
        <div className="bg-muted h-72 animate-pulse rounded-lg" />
      </div>
      <div className="bg-muted h-72 animate-pulse rounded-lg" />
    </main>
  );
}
