import { Card, CardContent } from "@/components/ui/card";
import { customerTheme } from "@/features/customer/styles/customerTheme";

interface CustomerPlaceholderPageProps {
  title: string;
  description: string;
}

export function CustomerPlaceholderPage({
  title,
  description,
}: CustomerPlaceholderPageProps) {
  return (
    <Card className={`${customerTheme.card} gap-4 p-8`}>
      <CardContent className="px-0">
        <p className={`mb-2 text-sm font-semibold uppercase tracking-[0.18em] ${customerTheme.primaryText}`}>
          Placeholder
        </p>
        <h1 className={`text-3xl font-bold ${customerTheme.darkText}`}>
          {title}
        </h1>
        <p className={`mt-3 max-w-2xl ${customerTheme.mutedText}`}>
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
