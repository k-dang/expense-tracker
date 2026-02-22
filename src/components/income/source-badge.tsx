import { cn } from "@/lib/utils";
import { getSourceColor } from "@/lib/income-sources";
import { Badge } from "@/components/ui/badge";

type SourceBadgeProps = {
  source: string;
  className?: string;
};

export function SourceBadge({ source, className }: SourceBadgeProps) {
  return (
    <Badge variant="outline" className={cn(getSourceColor(source), className)}>
      {source}
    </Badge>
  );
}
