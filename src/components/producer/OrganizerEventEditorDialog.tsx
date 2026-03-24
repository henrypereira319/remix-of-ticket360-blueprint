import { useEffect, useMemo, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { OrganizerPublicationStatus } from "@/server/organizer.service";

export interface OrganizerEventFormValue {
  templateSlug: string;
  slug: string;
  title: string;
  category: string;
  city: string;
  venueName: string;
  summary: string;
  description: string;
  startsAt: string;
  organizerName: string;
  address: string;
  openingTime: string;
  discoveryLabel: string;
  salesBadge: string;
  priceFrom: string;
  heroUrl: string;
  bannerUrl: string;
  tags: string;
  searchTerms: string;
  ageRating: string;
  agePolicy: string;
  paymentInfo: string;
  salesInfo: string;
  importantNotice: string;
  ticketPolicies: string;
  infoParagraphs: string;
  securityNotes: string;
  publicationStatus: OrganizerPublicationStatus;
}

export interface OrganizerEventTemplatePreset {
  slug: string;
  title: string;
  category: string;
  description: string;
  preset: OrganizerEventFormValue;
}

const slugify = (value: string) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const OrganizerEventEditorDialog = ({
  open,
  mode,
  initialValue,
  templatePresets,
  busy = false,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  initialValue: OrganizerEventFormValue;
  templatePresets: OrganizerEventTemplatePreset[];
  busy?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (value: OrganizerEventFormValue) => void;
}) => {
  const [value, setValue] = useState(initialValue);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const templatePresetBySlug = useMemo(
    () => new Map(templatePresets.map((templatePreset) => [templatePreset.slug, templatePreset])),
    [templatePresets],
  );

  useEffect(() => {
    setValue(initialValue);
    setSlugTouched(mode === "edit");
  }, [initialValue, mode, open]);

  const handleTemplateChange = (templateSlug: string) => {
    const templatePreset = templatePresetBySlug.get(templateSlug);

    if (!templatePreset) {
      setValue((currentValue) => ({
        ...currentValue,
        templateSlug,
      }));
      return;
    }

    setValue({
      ...templatePreset.preset,
      templateSlug,
      slug: slugify(templatePreset.preset.title),
    });
    setSlugTouched(false);
  };

  const handleTitleChange = (title: string) => {
    setValue((currentValue) => ({
      ...currentValue,
      title,
      slug: mode === "create" && !slugTouched ? slugify(title) : currentValue.slug,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Novo evento" : "Editar evento"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Criamos um evento real no banco a partir de um template de mapa e metadados comerciais."
              : "Ajuste metadados, sessao principal e publicacao sem sair do modulo do organizador."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="organizer-template">Template de mapa</Label>
              <select
                id="organizer-template"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={value.templateSlug}
                onChange={(event) => handleTemplateChange(event.target.value)}
                disabled={mode === "edit"}
              >
                {templatePresets.map((templatePreset) => (
                  <option key={templatePreset.slug} value={templatePreset.slug}>
                    {templatePreset.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizer-slug">Slug</Label>
              <Input
                id="organizer-slug"
                value={value.slug}
                onChange={(event) => {
                  setSlugTouched(true);
                  setValue((currentValue) => ({
                    ...currentValue,
                    slug: slugify(event.target.value),
                  }));
                }}
                disabled={mode === "edit"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizer-status">Status de publicacao</Label>
              <select
                id="organizer-status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={value.publicationStatus}
                onChange={(event) =>
                  setValue((currentValue) => ({
                    ...currentValue,
                    publicationStatus: event.target.value as OrganizerPublicationStatus,
                  }))
                }
              >
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">Fee da plataforma fixa em 10%</Badge>
            <span>CRUD real no backend, sem gravar so no browser.</span>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="organizer-title">Titulo</Label>
              <Input id="organizer-title" value={value.title} onChange={(event) => handleTitleChange(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizer-category">Categoria</Label>
              <Input
                id="organizer-category"
                value={value.category}
                onChange={(event) =>
                  setValue((currentValue) => ({
                    ...currentValue,
                    category: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizer-city">Cidade</Label>
              <Input
                id="organizer-city"
                value={value.city}
                onChange={(event) =>
                  setValue((currentValue) => ({
                    ...currentValue,
                    city: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizer-venue">Venue</Label>
              <Input
                id="organizer-venue"
                value={value.venueName}
                onChange={(event) =>
                  setValue((currentValue) => ({
                    ...currentValue,
                    venueName: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizer-starts-at">Inicio da sessao</Label>
              <Input
                id="organizer-starts-at"
                type="datetime-local"
                value={value.startsAt}
                onChange={(event) =>
                  setValue((currentValue) => ({
                    ...currentValue,
                    startsAt: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizer-price-from">Preco inicial</Label>
              <Input
                id="organizer-price-from"
                type="number"
                min="0"
                step="0.01"
                value={value.priceFrom}
                onChange={(event) =>
                  setValue((currentValue) => ({
                    ...currentValue,
                    priceFrom: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="organizer-summary">Resumo comercial</Label>
              <Textarea
                id="organizer-summary"
                className="min-h-24"
                value={value.summary}
                onChange={(event) =>
                  setValue((currentValue) => ({
                    ...currentValue,
                    summary: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizer-description">Descricao</Label>
              <Textarea
                id="organizer-description"
                className="min-h-24"
                value={value.description}
                onChange={(event) =>
                  setValue((currentValue) => ({
                    ...currentValue,
                    description: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="organizer-hero">Imagem principal</Label>
              <Input
                id="organizer-hero"
                value={value.heroUrl}
                onChange={(event) =>
                  setValue((currentValue) => ({
                    ...currentValue,
                    heroUrl: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizer-banner">Banner</Label>
              <Input
                id="organizer-banner"
                value={value.bannerUrl}
                onChange={(event) =>
                  setValue((currentValue) => ({
                    ...currentValue,
                    bannerUrl: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="organizer-discovery-label">Selo comercial</Label>
              <Input
                id="organizer-discovery-label"
                value={value.discoveryLabel}
                onChange={(event) =>
                  setValue((currentValue) => ({
                    ...currentValue,
                    discoveryLabel: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizer-sales-badge">Badge de venda</Label>
              <Input
                id="organizer-sales-badge"
                value={value.salesBadge}
                onChange={(event) =>
                  setValue((currentValue) => ({
                    ...currentValue,
                    salesBadge: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="organizer-tags">Tags</Label>
              <Input
                id="organizer-tags"
                value={value.tags}
                onChange={(event) =>
                  setValue((currentValue) => ({
                    ...currentValue,
                    tags: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizer-search-terms">Termos de busca</Label>
              <Input
                id="organizer-search-terms"
                value={value.searchTerms}
                onChange={(event) =>
                  setValue((currentValue) => ({
                    ...currentValue,
                    searchTerms: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="organizer-name">Organizador</Label>
              <Input
                id="organizer-name"
                value={value.organizerName}
                onChange={(event) =>
                  setValue((currentValue) => ({
                    ...currentValue,
                    organizerName: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizer-address">Endereco</Label>
              <Input
                id="organizer-address"
                value={value.address}
                onChange={(event) =>
                  setValue((currentValue) => ({
                    ...currentValue,
                    address: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizer-opening-time">Abertura</Label>
              <Input
                id="organizer-opening-time"
                value={value.openingTime}
                onChange={(event) =>
                  setValue((currentValue) => ({
                    ...currentValue,
                    openingTime: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="organizer-age-rating">Classificacao</Label>
              <Input
                id="organizer-age-rating"
                value={value.ageRating}
                onChange={(event) =>
                  setValue((currentValue) => ({
                    ...currentValue,
                    ageRating: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizer-age-policy">Politica de acesso</Label>
              <Input
                id="organizer-age-policy"
                value={value.agePolicy}
                onChange={(event) =>
                  setValue((currentValue) => ({
                    ...currentValue,
                    agePolicy: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="organizer-payment-info">Pagamento</Label>
              <Textarea
                id="organizer-payment-info"
                className="min-h-20"
                value={value.paymentInfo}
                onChange={(event) =>
                  setValue((currentValue) => ({
                    ...currentValue,
                    paymentInfo: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizer-sales-info">Politica comercial</Label>
              <Textarea
                id="organizer-sales-info"
                className="min-h-20"
                value={value.salesInfo}
                onChange={(event) =>
                  setValue((currentValue) => ({
                    ...currentValue,
                    salesInfo: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="organizer-important-notice">Aviso principal</Label>
              <Textarea
                id="organizer-important-notice"
                className="min-h-20"
                value={value.importantNotice}
                onChange={(event) =>
                  setValue((currentValue) => ({
                    ...currentValue,
                    importantNotice: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizer-info-paragraphs">Paragrafos informativos</Label>
              <Textarea
                id="organizer-info-paragraphs"
                className="min-h-20"
                value={value.infoParagraphs}
                onChange={(event) =>
                  setValue((currentValue) => ({
                    ...currentValue,
                    infoParagraphs: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="organizer-ticket-policies">Politicas do ingresso</Label>
              <Textarea
                id="organizer-ticket-policies"
                className="min-h-24"
                value={value.ticketPolicies}
                onChange={(event) =>
                  setValue((currentValue) => ({
                    ...currentValue,
                    ticketPolicies: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizer-security-notes">Notas de seguranca</Label>
              <Textarea
                id="organizer-security-notes"
                className="min-h-24"
                value={value.securityNotes}
                onChange={(event) =>
                  setValue((currentValue) => ({
                    ...currentValue,
                    securityNotes: event.target.value,
                  }))
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Fechar
          </Button>
          <Button
            type="button"
            disabled={busy || !value.slug || !value.title || !value.templateSlug}
            onClick={() => onSubmit(value)}
          >
            {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {mode === "create" ? "Criar evento" : "Salvar alteracoes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
