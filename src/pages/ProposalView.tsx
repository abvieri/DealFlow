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

  // Calculate delivery time only for one-time payment services (setup_fee > 0 and monthly_fee = 0)
  const oneTimeServices = proposal.proposal_items.filter(
    item => item.service_plans.setup_fee > 0 && item.service_plans.monthly_fee === 0
  );
  
  const totalDeliveryTime = oneTimeServices.length > 0
    ? oneTimeServices.reduce((max, item) => Math.max(max, item.service_plans.delivery_time_days), 0)
    : 0;

  const finalTotal = proposal.total_monthly + proposal.total_setup - (proposal.discount_value || 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Action Buttons - Fixed Top Right */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <Button variant="outline" onClick={() => navigate("/")} size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button variant="outline" onClick={() => navigate(`/proposal/${id}/edit`)} size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
        <Button 
          onClick={() => toast.info("Funcionalidade em desenvolvimento")} 
          disabled={proposal.status === 'Rascunho' && !proposal.client}
          size="sm"
        >
          <Download className="h-4 w-4 mr-2" />
          PDF
        </Button>
      </div>

      {/* PDF-Ready Layout */}
      <div className="max-w-4xl mx-auto bg-white shadow-2xl min-h-screen">
        {/* Header with decorative gradient */}
        <div className="relative bg-gradient-to-r from-primary via-accent-purple to-primary-hover text-white overflow-hidden">
          {/* Decorative wave pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" style={{ 
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M0 50 Q 25 30, 50 50 T 100 50 L 100 0 L 0 0 Z" fill="white" opacity="0.1"/%3E%3Cpath d="M0 60 Q 25 40, 50 60 T 100 60 L 100 10 L 0 10 Z" fill="white" opacity="0.1"/%3E%3Cpath d="M0 70 Q 25 50, 50 70 T 100 70 L 100 20 L 0 20 Z" fill="white" opacity="0.1"/%3E%3C/svg%3E")',
              backgroundRepeat: 'repeat-x',
              backgroundSize: '200px 100%',
            }} />
          </div>
          
          <div className="relative px-12 py-16 flex justify-between items-start">
            <div>
              <h1 className="text-5xl font-bold tracking-wide mb-2">PROPOSTA</h1>
              <h2 className="text-4xl font-bold tracking-wide">COMERCIAL</h2>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold mb-1">Sua Empresa</p>
              <p className="text-sm tracking-wider">SEU RAMO DE ATUAÇÃO</p>
            </div>
          </div>
        </div>

        {/* Client Info and Date */}
        <div className="px-12 py-8 grid grid-cols-2 gap-8 border-b">
          <div>
            <h3 className="text-primary font-bold text-xl mb-3">Cliente:</h3>
            {proposal.client ? (
              <>
                <p className="text-lg font-semibold">{proposal.client.name}</p>
                <p className="text-sm text-muted-foreground">{proposal.client.email}</p>
                <p className="text-sm text-muted-foreground">{proposal.client.phone}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground italic">Cliente não associado</p>
            )}
          </div>
          <div className="text-right">
            <h3 className="text-primary font-bold text-xl mb-3">Local / Data:</h3>
            <p className="text-lg font-semibold">{proposal.client?.company || 'Cidade Brasileira'}</p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(proposal.created_at), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="px-12 py-4 border-b">
          <Select value={proposal.status} onValueChange={updateStatus}>
            <SelectTrigger className="w-48">
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

        {/* Services Section */}
        <div className="px-12 py-8">
          <h3 className="text-primary font-bold text-2xl mb-6">Valores:</h3>
          
          {/* Services List as Table */}
          <div className="space-y-3 mb-8">
            {proposal.proposal_items.map((item, index) => (
              <div key={index} className="flex justify-between items-center pb-3 border-b border-border">
                <div className="flex-1">
                  <p className="font-medium">{item.service_plans.services.name}</p>
                  <p className="text-sm text-muted-foreground">{item.service_plans.plan_name}</p>
                </div>
                <div className="text-right">
                  {item.service_plans.monthly_fee > 0 && (
                    <p className="font-semibold">R$ {item.service_plans.monthly_fee.toFixed(2)}/mês</p>
                  )}
                  {item.service_plans.setup_fee > 0 && (
                    <p className="font-semibold">R$ {item.service_plans.setup_fee.toFixed(2)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-4 pt-6 border-t-2 border-border">
            <div className="flex justify-between items-center text-lg">
              <span className="font-semibold">Total:</span>
              <span className="font-bold">R$ {(proposal.total_monthly + proposal.total_setup).toFixed(2)}</span>
            </div>
            
            {proposal.discount_value > 0 && (
              <>
                <div className="flex justify-between items-center text-lg text-muted-foreground">
                  <span>Desconto de {((proposal.discount_value / (proposal.total_monthly + proposal.total_setup)) * 100).toFixed(0)}%</span>
                  <span>- R$ {proposal.discount_value.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-2xl pt-4">
                  <span className="font-bold text-primary">Valor Final:</span>
                  <span className="font-bold text-primary">R$ {finalTotal.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Payment Terms and Delivery */}
        <div className="px-12 py-8 space-y-6 border-t">
          <div>
            <h3 className="text-primary font-bold text-xl mb-2">Pagamento:</h3>
            <p className="text-muted-foreground">
              {proposal.total_monthly > 0 && proposal.total_setup > 0 
                ? `Investimento inicial de R$ ${proposal.total_setup.toFixed(2)} + mensalidade de R$ ${proposal.total_monthly.toFixed(2)}`
                : proposal.total_monthly > 0 
                  ? `Mensalidade de R$ ${proposal.total_monthly.toFixed(2)}`
                  : `Pagamento único de R$ ${proposal.total_setup.toFixed(2)}`
              }
            </p>
          </div>

          {oneTimeServices.length > 0 && (
            <div>
              <h3 className="text-primary font-bold text-xl mb-2">Prazo para execução:</h3>
              <p className="text-muted-foreground">{totalDeliveryTime} dias úteis</p>
            </div>
          )}

          <div>
            <h3 className="text-primary font-bold text-xl mb-2">Validade:</h3>
            <p className="text-muted-foreground">Este orçamento tem validade de 15 dias.</p>
          </div>
        </div>

        {/* Footer with gradient */}
        <div className="relative bg-gradient-to-r from-primary via-accent-purple to-primary-hover text-white overflow-hidden mt-12">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute bottom-0 w-full h-full" style={{ 
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M0 50 Q 25 70, 50 50 T 100 50 L 100 100 L 0 100 Z" fill="white" opacity="0.1"/%3E%3Cpath d="M0 60 Q 25 80, 50 60 T 100 60 L 100 100 L 0 100 Z" fill="white" opacity="0.1"/%3E%3C/svg%3E")',
              backgroundRepeat: 'repeat-x',
              backgroundPosition: 'bottom',
              backgroundSize: '200px 100%',
            }} />
          </div>
          
          <div className="relative px-12 py-8 text-center">
            <p className="text-sm">
              contato@suaempresa.com.br - (XX) XXXX-XXXX - Rua Exemplo, 123 - Cidade Brasileira
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalView;