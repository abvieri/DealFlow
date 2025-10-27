import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Edit, Download, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
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
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/proposal/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button onClick={() => toast.info("Funcionalidade em desenvolvimento")}>
            <Download className="h-4 w-4 mr-2" />
            Baixar PDF
          </Button>
        </div>
      </div>

      {/* Header Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">Proposta Comercial</CardTitle>
              <p className="text-sm text-muted-foreground">
                Criada em {format(new Date(proposal.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            <div className="space-y-2">
              <Select value={proposal.status} onValueChange={updateStatus}>
                <SelectTrigger className="w-40">
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
        </CardHeader>
      </Card>

      {/* Client Info */}
      {proposal.client && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Dados do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nome</p>
              <p className="font-medium">{proposal.client.name}</p>
            </div>
            {proposal.client.company && (
              <div>
                <p className="text-sm text-muted-foreground">Empresa</p>
                <p className="font-medium">{proposal.client.company}</p>
              </div>
            )}
            {proposal.client.email && (
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{proposal.client.email}</p>
              </div>
            )}
            {proposal.client.phone && (
              <div>
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-medium">{proposal.client.phone}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Financial Summary */}
      <Card className="shadow-md bg-gradient-subtle">
        <CardHeader>
          <CardTitle className="text-lg">Resumo Financeiro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fee Mensal:</span>
            <span className="font-semibold text-lg">R$ {proposal.total_monthly.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Implementação:</span>
            <span className="font-semibold text-lg">R$ {proposal.total_setup.toFixed(2)}</span>
          </div>
          {proposal.discount_value > 0 && (
            <div className="flex justify-between text-destructive">
              <span>Desconto:</span>
              <span className="font-semibold">- R$ {proposal.discount_value.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between pt-3 border-t text-xl">
            <span className="font-bold">Valor Total:</span>
            <span className="font-bold text-primary">R$ {finalTotal.toFixed(2)}</span>
          </div>
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Prazo de Entrega Estimado:</span>
              <Badge variant="outline" className="text-base">
                {totalDeliveryTime} dias
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Details */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Serviços Incluídos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {proposal.proposal_items.map((item, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-lg">{item.service_plans.services.name}</h4>
                  <p className="text-sm text-muted-foreground">{item.service_plans.plan_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Mensal</p>
                  <p className="font-semibold">R$ {item.service_plans.monthly_fee.toFixed(2)}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Setup:</span>{" "}
                  <span className="font-medium">R$ {item.service_plans.setup_fee.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Prazo:</span>{" "}
                  <span className="font-medium">{item.service_plans.delivery_time_days} dias</span>
                </div>
                {item.service_plans.deliverables && (
                  <div className="pt-2 border-t">
                    <p className="font-medium mb-1">Entregáveis:</p>
                    <p className="text-muted-foreground">{item.service_plans.deliverables}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProposalView;
