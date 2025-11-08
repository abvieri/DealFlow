// src/pages/ProposalView.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { Edit, Download, ArrowLeft, Clock, DollarSign, Package, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { pdf } from '@react-pdf/renderer';
import { ProposalDocument } from '@/components/pdf/ProposalDocument';
import { ClientSelectionDialog } from "@/components/ClientSelectionDialog";
import { ProposalObservations } from "@/components/ui/Observations";

interface ProposalData {
  id: string;
  created_at: string;
  status: string;
  total_monthly: number;
  total_setup: number;
  discount_value: number;
  client?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
  };
  proposal_items: Array<{
    id: string;
    service_plans: {
      plan_name: string;
      monthly_fee: number;
      setup_fee: number;
      deliverables: string;
      delivery_time_days: number;
      services: {
        name: string;
      };
    };
  }>;
}

const ProposalView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showClientDialog, setShowClientDialog] = useState(false);

  useEffect(() => {
    if (id) fetchProposal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProposal = async () => {
    setIsLoadingPage(true);
    try {
      const { data, error } = await supabase
      .from("proposals")
      .select(`
        *,
        clients(*),
        proposal_items(
          id, 
          service_plans(
            *,
            services(name)
          )
        )
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    
    if (data && (data as any).clients) {
      (data as any).client = (data as any).clients;
      delete (data as any).clients;
    }

    setProposal(data);
    return data;

    } catch (error: any) {
      toast.error("Erro ao carregar proposta", { description: error.message });
      return null;
    } finally {
      setIsLoadingPage(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!proposal) return;

    if (newStatus === "Rascunho") {
      toast.error("Não é possível voltar para Rascunho.");
      return;
    }

    if (proposal.status === "Rascunho" && newStatus === "Salva" && !proposal.client) {
      setShowClientDialog(true);
      return;
    }

    try {
      const { error } = await supabase
        .from("proposals")
        .update({ status: newStatus })
        .eq("id", proposal.id);

      if (error) throw error;

      setProposal(prev => prev ? { ...prev, status: newStatus } : prev);
      toast.success("Status atualizado!");
    } catch (err: any) {
      console.error("Erro ao atualizar status:", err);
      toast.error("Erro ao atualizar status: " + (err?.message ?? ""));
    }
  };

  const handleClientSelected = async (client: any) => {
    if (!proposal) {
      toast.error("Proposta não carregada.");
      return;
    }

    try {
      const { error } = await supabase
        .from("proposals")
        .update({ client_id: client.id, status: "Salva" })
        .eq("id", proposal.id);

      if (error) throw error;

      setProposal(prev => prev ? { ...prev, client: { id: client.id, name: client.name, email: client.email, phone: client.phone, company: client.company }, status: "Salva" } : prev);

      setShowClientDialog(false);
      toast.success("Cliente vinculado e proposta salva!");
    } catch (err: any) {
      console.error("Erro ao vincular cliente:", err);
      toast.error("Erro ao vincular cliente à proposta.");
    }
  };

  const handleDownloadClick = async () => {
    if (!proposal) return;

    if (proposal.status == "Rascunho") {
      toast.error("Você precisa salvar a proposta antes de baixar o PDF.");
      return;
    }

    if (!proposal.client) {
      toast.error("Cliente não encontrado para esta proposta.");
      return;
    }

    setIsDownloading(true);
    toast.info("Gerando PDF...");

    try {
      const blob = await pdf(
        <ProposalDocument 
          proposalData={proposal} 
          clientData={proposal.client} 
          items={proposal.proposal_items.map(item => ({
            id: item.id,
            service_name: item.service_plans.services.name,
            plan_name: item.service_plans.plan_name,
            description: item.service_plans.deliverables,
            monthly_fee: item.service_plans.monthly_fee,
            setup_fee: item.service_plans.setup_fee,
            delivery_time_days: item.service_plans.delivery_time_days,
          }))} 
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Proposta - ${proposal.client.company || proposal.client.name}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("PDF baixado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  const extendedProposal = proposal as any;

  if (isLoadingPage) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!proposal) {
    return <div>Proposta não encontrada</div>;
  }

  const oneTimeServices = proposal.proposal_items.filter(
    item => item.service_plans.setup_fee > 0 && item.service_plans.monthly_fee === 0
  );
  const totalDeliveryTime = oneTimeServices.length > 0
    ? oneTimeServices.reduce((max, item) => Math.max(max, item.service_plans.delivery_time_days), 0)
    : 0;

  const finalTotal = proposal.total_monthly + proposal.total_setup - (proposal.discount_value || 0);

  return (
    <>
      <ClientSelectionDialog
        open={showClientDialog}
        onOpenChange={setShowClientDialog}
        onClientSelected={handleClientSelected}
        proposalId={proposal.id}
      />

      <div id="proposal-content" className="container mx-auto px-6 py-8 space-y-8">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground rounded-2xl overflow-hidden shadow-elegant">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzR2LTRoLTJ2NGgtNHYyaDR2NGgydi00aDR2LTJoLTR6bTAtMzBWMGgtMnY0aC00djJoNHY0aDJWNmg0VjRoLTR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0ySDZ6TTYgNFYwSDR2NEgwdjJoNHY0aDJWNmg0VjRINnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10" />
          
          <div className="relative z-10 p-8">
            {/* Header Actions */}
            <div className="flex items-center justify-between mb-8">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/")} 
                className="text-primary-foreground hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div className="flex gap-3">
                <Button 
                  variant="secondary"
                  onClick={() => navigate(`/proposal/${id}/edit`)}
                  className="shadow-sm"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button
                  onClick={handleDownloadClick}
                  disabled={isDownloading || isLoadingPage}
                  className="bg-background text-foreground hover:bg-background/90 shadow-sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isDownloading ? "Gerando..." : "Baixar PDF"}
                </Button>
              </div>
            </div>

            {/* Title Section */}
            <div className="text-center mb-10 max-w-3xl mx-auto">
              <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight">
                Proposta Comercial
              </h1>
              <p className="text-xl text-primary-foreground/90 mb-6">
                {proposal.client?.company || proposal.client?.name || 'Cliente'}
              </p>
              <div className="inline-block">
                <Select value={proposal.status} onValueChange={(v) => updateStatus(v)}>
                  <SelectTrigger className="w-48 bg-white/20 border-white/30 text-primary-foreground backdrop-blur-sm hover:bg-white/30 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {proposal.status === "Rascunho" && !proposal.client && (
                      <SelectItem value="Rascunho">Rascunho</SelectItem>
                    )}
                    <SelectItem value="Salva">Salva</SelectItem>
                    <SelectItem value="Enviada">Enviada</SelectItem>
                    <SelectItem value="Aceita">Aceita</SelectItem>
                    <SelectItem value="Recusada">Recusada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <Card className="bg-white/15 backdrop-blur-md border-white/20 shadow-lg hover:shadow-xl transition-all hover:bg-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <DollarSign className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <p className="text-sm font-medium text-primary-foreground/80">Valor Total</p>
                  </div>
                  <p className="text-3xl font-bold text-primary-foreground">
                    R$ {finalTotal.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              {/* {oneTimeServices.length > 0 && (
                <Card className="bg-white/15 backdrop-blur-md border-white/20 shadow-lg hover:shadow-xl transition-all hover:bg-white/20">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-3 bg-white/20 rounded-xl">
                        <Clock className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <p className="text-sm font-medium text-primary-foreground/80">Prazo de Entrega</p>
                    </div>
                    <p className="text-3xl font-bold text-primary-foreground">
                      {totalDeliveryTime} dias
                    </p>
                  </CardContent>
                </Card>
              )} */}

              <Card className="bg-white/15 backdrop-blur-md border-white/20 shadow-lg hover:shadow-xl transition-all hover:bg-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <Package className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <p className="text-sm font-medium text-primary-foreground/80">Total de Serviços</p>
                  </div>
                  <p className="text-3xl font-bold text-primary-foreground">
                    {proposal.proposal_items.length}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Client Info */}
        {proposal.client && (
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-2xl font-bold mb-1">Informações do Cliente</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Proposta criada em {format(new Date(proposal.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
                <Button variant="outline" onClick={() => setShowClientDialog(true)} size="sm">
                  <Edit className="h-4 w-4 mr-2" /> Editar Cliente
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Nome do Cliente</p>
                    <p className="text-lg font-semibold">{proposal.client.name}</p>
                  </div>
                  {proposal.client.company && (
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Empresa</p>
                      <p className="text-lg font-semibold">{proposal.client.company}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {proposal.client.email && (
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Email</p>
                      <p className="text-lg font-semibold break-all">{proposal.client.email}</p>
                    </div>
                  )}
                  {proposal.client.phone && (
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Telefone</p>
                      <p className="text-lg font-semibold">{proposal.client.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Services Grid */}
        <div>
          <div className="mb-6">
            <h2 className="text-3xl font-bold mb-2">Serviços Incluídos</h2>
            <p className="text-muted-foreground">Visão geral dos serviços contratados</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proposal.proposal_items.map((item, index) => (
              <Card 
                key={index} 
                className="shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group border-muted hover:border-primary/50"
              >
                <div className="h-28 bg-gradient-to-br from-primary/90 to-primary relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                    <CheckCircle className="h-14 w-14 text-primary-foreground" />
                  </div>
                </div>
                <CardContent className="p-5">
                  <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors line-clamp-2">
                    {item.service_plans.services.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 font-medium">
                    {item.service_plans.plan_name}
                  </p>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between items-center p-2 bg-muted/30 rounded-md">
                      <span className="text-muted-foreground font-medium">Mensal:</span>
                      <span className="font-bold text-base">R$ {item.service_plans.monthly_fee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted/30 rounded-md">
                      <span className="text-muted-foreground font-medium">Setup:</span>
                      <span className="font-bold text-base">R$ {item.service_plans.setup_fee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted/30 rounded-md">
                      <span className="text-muted-foreground font-medium">Prazo:</span>
                      <Badge variant="secondary" className="font-semibold">
                        {item.service_plans.delivery_time_days} dias
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Service Details Accordion */}
        <Card className="shadow-md">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-2xl font-bold">Detalhes dos Serviços</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Entregáveis e valores detalhados</p>
          </CardHeader>
          <CardContent className="p-6">
            <Accordion type="single" collapsible className="w-full space-y-2">
              {proposal.proposal_items.map((item, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="border rounded-lg px-4 bg-muted/20 hover:bg-muted/30 transition-colors"
                >
                  <AccordionTrigger className="text-base font-semibold hover:text-primary hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Package className="h-4 w-4 text-primary" />
                      </div>
                      <span>{item.service_plans.services.name} - {item.service_plans.plan_name}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="space-y-4 pt-2 pl-12">
                      {item.service_plans.deliverables && (
                        <div className="p-4 bg-background rounded-lg border">
                          <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                            Entregáveis
                          </h4>
                          <p className="text-foreground leading-relaxed">
                            {item.service_plans.deliverables}
                          </p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-background rounded-lg border">
                          <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Valor Mensal</p>
                          <p className="text-xl font-bold text-primary">
                            R$ {item.service_plans.monthly_fee.toFixed(2)}
                          </p>
                        </div>
                        <div className="p-4 bg-background rounded-lg border">
                          <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Taxa de Setup</p>
                          <p className="text-xl font-bold text-primary">
                            R$ {item.service_plans.setup_fee.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Observations Section */}
        <Card className="shadow-md">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-2xl font-bold">Observações</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Notas e informações adicionais</p>
          </CardHeader>
          <CardContent className="p-6">
            <ProposalObservations proposal={extendedProposal} setProposal={setProposal as any} />
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card className="shadow-lg border-2 border-primary/20">
          <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
            <CardTitle className="text-2xl font-bold">Resumo Financeiro</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Valores e totalizadores da proposta</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 space-y-3">
                <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg border">
                  <span className="font-medium text-muted-foreground">Total Mensal:</span>
                  <span className="font-bold text-xl">R$ {proposal.total_monthly.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg border">
                  <span className="font-medium text-muted-foreground">Total Setup:</span>
                  <span className="font-bold text-xl">R$ {proposal.total_setup.toFixed(2)}</span>
                </div>
                {proposal.discount_value > 0 && (
                  <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border-2 border-green-200 dark:border-green-800">
                    <span className="font-medium text-green-700 dark:text-green-400">Desconto Aplicado:</span>
                    <span className="font-bold text-xl text-green-700 dark:text-green-400">
                      - R$ {proposal.discount_value.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
              <div className="lg:col-span-2 flex items-center justify-center">
                <div className="text-center p-8 bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-2xl shadow-elegant w-full">
                  <p className="text-sm font-medium mb-3 opacity-90 uppercase tracking-wide">
                    Valor Total
                  </p>
                  <p className="text-5xl font-bold mb-2">
                    R$ {finalTotal.toFixed(2)}
                  </p>
                  <p className="text-xs opacity-80">
                    {proposal.discount_value > 0 ? "Já com desconto aplicado" : "Valor final da proposta"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ProposalView;
