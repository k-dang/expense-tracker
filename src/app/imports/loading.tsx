export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 sm:p-6 lg:p-8">
      <div className="bg-muted h-8 w-40 animate-pulse rounded-md" />
      <div className="bg-muted h-28 animate-pulse rounded-lg" />
      <div className="bg-muted h-80 animate-pulse rounded-lg" />
    </main>
  );
}
