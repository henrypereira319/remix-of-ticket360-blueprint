import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type OrganizerModuleTone = "active" | "partial";

const toneMeta: Record<OrganizerModuleTone, { label: string; variant: "default" | "secondary" }> = {
  active: {
    label: "Ativo",
    variant: "default",
  },
  partial: {
    label: "Parcial",
    variant: "secondary",
  },
};

export const OrganizerModuleCard = ({
  title,
  description,
  detail,
  tone,
}: {
  title: string;
  description: string;
  detail: string;
  tone: OrganizerModuleTone;
}) => {
  const meta = toneMeta[tone];

  return (
    <Card className="border-border bg-card">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          <Badge variant={meta.variant}>{meta.label}</Badge>
        </div>
        <div className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
          {detail}
        </div>
      </CardContent>
    </Card>
  );
};
