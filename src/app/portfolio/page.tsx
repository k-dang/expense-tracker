import { Suspense } from "react";
import { PortfolioPageContent } from "./_components/portfolio-page-content";
import { PortfolioPageContentSkeleton } from "./_components/portfolio-page-content-skeleton";

type PageProps = {
  searchParams: Promise<{
    asOfDate?: string;
  }>;
};

export default function PortfolioPage({ searchParams }: PageProps) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Portfolio</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Track your weighted stock allocation
        </p>
      </header>

      <Suspense fallback={<PortfolioPageContentSkeleton />}>
        <PortfolioPageContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
