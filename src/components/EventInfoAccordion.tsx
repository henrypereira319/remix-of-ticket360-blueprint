import { AlertCircle, FileText, ShieldCheck, Ticket } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { EventData } from "@/data/events";
import { formatCurrency, getSectionCapacity, getSelectableSeatCount } from "@/lib/ticketing";

interface EventInfoAccordionProps {
  event: EventData;
}

const EventInfoAccordion = ({ event }: EventInfoAccordionProps) => {
  const serviceFacts = [
    { label: "Apresentacao", value: `${event.weekday}, ${event.day} de ${event.month}` },
    { label: "Abertura", value: event.details.openingTime },
    { label: "Inicio", value: event.time },
    { label: "Local", value: event.venueName },
    { label: "Endereco", value: event.details.address },
    { label: "Pagamento", value: event.details.paymentInfo },
    { label: "Vendas", value: event.details.salesInfo },
  ];

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Detalhes e politicas</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="informacoes">
            <AccordionTrigger className="text-left text-base font-semibold text-foreground">
              <span className="inline-flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Informacoes do evento
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              {event.details.infoParagraphs.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-7 text-muted-foreground">
                  {paragraph}
                </p>
              ))}

              <Alert className="border-primary/20 bg-primary/5">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertTitle className="text-foreground">Atencao importante</AlertTitle>
                <AlertDescription>{event.details.importantNotice}</AlertDescription>
              </Alert>

              <div className="grid gap-3 md:grid-cols-2">
                {serviceFacts.map((fact) => (
                  <div key={fact.label} className="rounded-lg bg-background px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{fact.label}</p>
                    <p className="mt-2 text-sm font-medium leading-6 text-foreground">{fact.value}</p>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="setores">
            <AccordionTrigger className="text-left text-base font-semibold text-foreground">
              <span className="inline-flex items-center gap-2">
                <Ticket className="h-4 w-4 text-primary" />
                Setores e valores
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <Table>
                <TableCaption>Capacidade e valores simulados a partir da estrutura atual desta base.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Setor</TableHead>
                    <TableHead className="text-right">Capacidade</TableHead>
                    <TableHead className="text-right">Inteira</TableHead>
                    <TableHead className="text-right">Meia</TableHead>
                    <TableHead className="text-right">Disponiveis</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {event.seatMap.sections.map((section) => (
                    <TableRow key={section.id}>
                      <TableCell className="font-medium text-foreground">{section.name}</TableCell>
                      <TableCell className="text-right">{getSectionCapacity(event, section.id)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(section.price)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(section.price / 2)}</TableCell>
                      <TableCell className="text-right">{getSelectableSeatCount(event, section.id)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="politicas">
            <AccordionTrigger className="text-left text-base font-semibold text-foreground">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Politicas de ingresso
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                {event.details.ticketPolicies.map((policy) => (
                  <div key={policy} className="rounded-lg bg-background px-4 py-3 text-sm leading-6 text-muted-foreground">
                    {policy}
                  </div>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {event.seatMap.notes.map((note) => (
                  <div key={note} className="rounded-lg bg-background px-4 py-3 text-sm leading-6 text-muted-foreground">
                    {note}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default EventInfoAccordion;
