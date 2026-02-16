import { cn } from "@/lib/utils";
import { getCategoryColor } from "@/lib/categories";
import { Badge } from "@/components/ui/badge";

type CategoryBadgeProps = {
  category: string;
  className?: string;
};

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(getCategoryColor(category), className)}
    >
      {category}
    </Badge>
  );
}
