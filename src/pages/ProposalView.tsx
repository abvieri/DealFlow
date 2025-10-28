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

interface ProposalData {
  id: string;
  created_at: string;
  status: string;
  total_monthly: number;
  total_setup: number;
  discount_value: number;
  client?: {
    name: string;
    email: string;
    phone: string;
    company: string;
  };
  proposal_items: Array<{
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProposal();
  }, [id]);

  const fetchProposal = async () => {
    try {
      const { data, error } = await supabase
        .from("proposals")
        .select(`
          *,
          clients(*),
          proposal_items(
            service_plans(
              *,
              services(name)
            )
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setProposal(data);
    } catch (error: any) {
      toast.error("Erro ao carregar proposta", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from("proposals")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Status atualizado!");
      fetchProposal();
    } catch (error: any) {
      toast.error("Erro ao atualizar status", { description: error.message });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!proposal) {
    return <div>Proposta não encontrada</div>;
  }

  const totalDeliveryTime = proposal.proposal_items.reduce(
    (max, item) => Math.max(max, item.service_plans.delivery_time_days),
    0
  );

  const finalTotal = proposal.total_monthly + proposal.total_setup - (proposal.discount_value || 0);

  return (
    <div className="space-y-0 -mx-4 -my-8">
      {/* Hero Section with Gradient Background */}
      <div className="relative bg-gradient-dark text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ 
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }} />
        </div>
        
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <Button variant="ghost" onClick={() => navigate("/")} className="text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate(`/proposal/${id}/edit`)} className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button onClick={() => toast.info("Funcionalidade em desenvolvimento")} className="bg-white text-foreground hover:bg-white/90">
                <Download className="h-4 w-4 mr-2" />
                Baixar PDF
              </Button>
            </div>
          </div>

          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight">
              Proposta
            </h1>
            <p className="text-xl text-white/80 mb-6">
              {proposal.client?.company || proposal.client?.name || 'Cliente'}
            </p>
            <div className="inline-block">
              <Select value={proposal.status} onValueChange={updateStatus}>
                <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Rascunho">Rascunho</SelectItem>
                  <SelectItem value="Salva">Salva</SelectItem>
                  <SelectItem value="Enviada">Enviada</SelectItem>
                  <SelectItem value="Aceita">Aceita</SelectItem>
                  <SelectItem value="Recusada">Recusada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Key Stats Cards */}
          <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-white/70">Valor Total</p>
                </div>
                <p className="text-3xl font-bold">R$ {finalTotal.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Clock className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-white/70">Prazo</p>
                </div>
                <p className="text-3xl font-bold">{totalDeliveryTime} dias</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Package className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-white/70">Serviços</p>
                </div>
                <p className="text-3xl font-bold">{proposal.proposal_items.length}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Client Info */}
        {proposal.client && (
          <Card className="shadow-lg mb-8 overflow-hidden">
            <div className="bg-gradient-subtle p-6 border-b">
              <h2 className="text-2xl font-bold">Informações do Cliente</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Proposta criada em {format(new Date(proposal.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Nome do Cliente</p>
                    <p className="text-lg font-semibold">{proposal.client.name}</p>
                  </div>
                  {proposal.client.company && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Empresa</p>
                      <p className="text-lg font-semibold">{proposal.client.company}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {proposal.client.email && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Email</p>
                      <p className="text-lg font-semibold">{proposal.client.email}</p>
                    </div>
                  )}
                  {proposal.client.phone && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Telefone</p>
                      <p className="text-lg font-semibold">{proposal.client.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Services Grid */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-6">Serviços Incluídos</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proposal.proposal_items.map((item, index) => (
              <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow overflow-hidden group">
                <div className="h-32 bg-gradient-accent relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <CheckCircle className="h-16 w-16 text-white/80" />
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {item.service_plans.services.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">{item.service_plans.plan_name}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mensal:</span>
                      <span className="font-semibold">R$ {item.service_plans.monthly_fee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Setup:</span>
                      <span className="font-semibold">R$ {item.service_plans.setup_fee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Prazo:</span>
                      <Badge variant="outline">{item.service_plans.delivery_time_days} dias</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Service Details Accordion */}
        <Card className="shadow-lg mb-8">
          <CardHeader className="bg-gradient-subtle">
            <CardTitle className="text-2xl">Detalhes dos Serviços</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Accordion type="single" collapsible className="w-full">
              {proposal.proposal_items.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-lg font-semibold hover:text-primary">
                    {item.service_plans.services.name} - {item.service_plans.plan_name}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      {item.service_plans.deliverables && (
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Package className="h-4 w-4 text-primary" />
                            Entregáveis
                          </h4>
                          <p className="text-muted-foreground pl-6">{item.service_plans.deliverables}</p>
                        </div>
                      )}
                      <div className="grid md:grid-cols-3 gap-4 pl-6">
                        <div>
                          <p className="text-sm text-muted-foreground">Investimento Mensal</p>
                          <p className="text-lg font-bold text-primary">R$ {item.service_plans.monthly_fee.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Taxa de Setup</p>
                          <p className="text-lg font-bold">R$ {item.service_plans.setup_fee.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Tempo de Entrega</p>
                          <p className="text-lg font-bold">{item.service_plans.delivery_time_days} dias úteis</p>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Financial Summary - Large Card */}
        <Card className="shadow-lg bg-gradient-subtle overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-3xl">Investimento Total</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-background rounded-lg">
                  <span className="text-lg">Fee Mensal</span>
                  <span className="text-2xl font-bold">R$ {proposal.total_monthly.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-background rounded-lg">
                  <span className="text-lg">Implementação</span>
                  <span className="text-2xl font-bold">R$ {proposal.total_setup.toFixed(2)}</span>
                </div>
                {proposal.discount_value > 0 && (
                  <div className="flex justify-between items-center p-4 bg-destructive/10 rounded-lg">
                    <span className="text-lg text-destructive">Desconto</span>
                    <span className="text-2xl font-bold text-destructive">- R$ {proposal.discount_value.toFixed(2)}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-center">
                <div className="text-center p-8 bg-primary/10 rounded-2xl border-2 border-primary/20">
                  <p className="text-sm text-muted-foreground mb-2">Valor Total</p>
                  <p className="text-5xl font-bold text-primary mb-4">R$ {finalTotal.toFixed(2)}</p>
                  <Badge variant="secondary" className="text-base px-4 py-2">
                    <Clock className="h-4 w-4 mr-2" />
                    Entrega em {totalDeliveryTime} dias
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProposalView;