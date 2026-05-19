import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Expense Dashboard
        </h1>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Skeleton className="h-9 w-full sm:w-40" />
        <Skeleton className="h-9 w-full sm:w-40" />
        <Skeleton className="h-9 w-full sm:w-24" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-32 w-full rounded-lg" />
        ))}
      </div>

      <Skeleton className="h-80 w-full min-w-0 rounded-lg" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-72 w-full min-w-0 rounded-lg" />
        <Skeleton className="h-72 w-full min-w-0 rounded-lg" />
      </div>
    </main>
  );
}
