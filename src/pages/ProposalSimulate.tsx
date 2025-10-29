import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Lightbulb, Target, Zap, CheckCircle2 } from "lucide-react";

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

  const features = [
    {
      icon: Lightbulb,
      title: "Planejamento",
      subtitle: "Não se o que vou ser",
      description: "Escolha da nossa lista de diagnósticos e configure toda solução técnica que desejar.",
      color: "from-pink-500 to-pink-600"
    },
    {
      icon: Target,
      title: "Objetivos",
      subtitle: "Sei o que preciso, mas não tenho",
      description: "Defina as necessidades, avalie tendências e oportunidades e crie soluções organizadas.",
      color: "from-green-500 to-green-600"
    },
    {
      icon: Zap,
      title: "Execução",
      subtitle: "Tenho tudo, mas preciso fazer melhor",
      description: "Configure sua operação de maneira eficiente, use dos que oferecem a execução das tarefas.",
      color: "from-orange-500 to-orange-600"
    },
    {
      icon: CheckCircle2,
      title: "Resultado",
      subtitle: "Consigo tudo, quero continuar otimizando",
      description: "Continue evoluindo, expanda recursos, aprimore cada detalhe do seu performance financeiro.",
      color: "from-purple-500 to-purple-600"
    }
  ];

  return (
    <div className="space-y-0 -mx-4 -my-8">
      {/* Hero Section */}
      <div className="bg-gradient-dark text-white py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Introdução ao Modelo STEP™ - A Solução Certa para o Momento Certo
            </h1>
            <p className="text-lg text-white/80 max-w-3xl mx-auto leading-relaxed">
              Toda empresa passa por 4 momentos distintos em sua jornada de crescimento. Cada um exige uma abordagem diferente e 
              uma solução sob medida. O modelo STEP™ guia você a identificar em que momento o seu negócio está, que aspecto ele 
              mostra e qual fase de pulsão você já está vivenciando - para que você possa escolher a estratégia e entrega certa 
              para esse momento.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {features.map((feature, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all">
                <CardContent className="p-6 text-center">
                  <div className={`mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm font-semibold text-white/90 mb-3">"{feature.subtitle}"</p>
                  <p className="text-sm text-white/70 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <div className="bg-white/10 backdrop-blur-sm border-white/20 rounded-lg p-8 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold mb-4">Simular Proposta</h3>
              <p className="text-white/80 mb-6">
                Crie uma simulação de proposta sem vincular a um cliente específico. 
                Você poderá salvar os dados do cliente mais tarde, se desejar.
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleStartSimulation}
                  className="bg-white text-foreground hover:bg-white/90"
                >
                  Iniciar Simulação
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalSimulate;
