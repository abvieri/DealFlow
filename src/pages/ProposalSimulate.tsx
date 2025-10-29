import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Calculator } from "lucide-react";

const ProposalSimulate = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleStartSimulation = async () => {
    try {
      // Create a simulation proposal without client
      const { data: proposalData, error } = await supabase
        .from("proposals")
        .insert({
          user_id: user?.id,
          client_id: null,
          status: "Rascunho",
          total_monthly: 0,
          total_setup: 0,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Simulação iniciada!");
      navigate(`/proposal/${proposalData.id}/build`);
    } catch (error: any) {
      toast.error("Erro ao iniciar simulação", {
        description: error.message,
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-gradient-dark py-16 -m-8 px-8 flex items-center justify-center">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Calculator className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Simular Proposta</CardTitle>
          <CardDescription>
            Crie uma simulação de proposta sem vincular a um cliente específico. 
            Você poderá salvar os dados do cliente mais tarde, se desejar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold">O que você pode fazer na simulação:</h3>
            <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
              <li>Selecionar serviços e planos da biblioteca</li>
              <li>Calcular valores totais em tempo real</li>
              <li>Aplicar descontos e ajustes</li>
              <li>Visualizar o resumo completo da proposta</li>
              <li>Salvar como template para uso futuro</li>
            </ul>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="flex-1"
            >
              Voltar
            </Button>
            <Button
              onClick={handleStartSimulation}
              className="flex-1"
            >
              Iniciar Simulação
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProposalSimulate;
