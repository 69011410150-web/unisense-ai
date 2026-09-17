import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shared placeholder used by the seven route components until the page wave
 * fills each screen in. Keeps the shell rendering end to end.
 */
export function PagePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div data-ocid="page.placeholder" className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </header>
      <Card className="rounded-2xl border-border shadow-soft">
        <CardContent className="space-y-3 p-5">
          <Skeleton className="h-5 w-2/3 rounded-lg" />
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-4 w-5/6 rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}
