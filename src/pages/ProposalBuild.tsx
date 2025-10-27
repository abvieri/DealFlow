import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, ShoppingCart, ChevronRight } from "lucide-react";

interface ServicePlan {
  id: string;
  plan_name: string;
  monthly_fee: number;
  setup_fee: number;
  deliverables: string | null;
  delivery_time_days: number;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  service_plans: ServicePlan[];
}

interface CartItem extends ServicePlan {
  service_name: string;
}

const ProposalBuild = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedService, setExpandedService] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
    fetchProposalItems();
  }, [id]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*, service_plans(*)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar serviços", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchProposalItems = async () => {
    try {
      const { data, error } = await supabase
        .from("proposal_items")
        .select("*, service_plans(*, services(name))")
        .eq("proposal_id", id);

      if (error) throw error;

      if (data) {
        const items = data.map((item: any) => ({
          ...item.service_plans,
          service_name: item.service_plans.services.name,
        }));
        setCart(items);
      }
    } catch (error: any) {
      toast.error("Erro ao carregar itens", { description: error.message });
    }
  };

  const addToCart = async (plan: ServicePlan, serviceName: string) => {
    try {
      const { error } = await supabase.from("proposal_items").insert({
        proposal_id: id,
        service_plan_id: plan.id,
      });

      if (error) throw error;

      setCart([...cart, { ...plan, service_name: serviceName }]);
      toast.success("Item adicionado ao carrinho!");
    } catch (error: any) {
      toast.error("Erro ao adicionar item", { description: error.message });
    }
  };

  const removeFromCart = async (planId: string) => {
    try {
      const { error } = await supabase
        .from("proposal_items")
        .delete()
        .eq("proposal_id", id)
        .eq("service_plan_id", planId);

      if (error) throw error;

      setCart(cart.filter((item) => item.id !== planId));
      toast.success("Item removido!");
    } catch (error: any) {
      toast.error("Erro ao remover item", { description: error.message });
    }
  };

  const calculateTotals = () => {
    const totalMonthly = cart.reduce((sum, item) => sum + item.monthly_fee, 0);
    const totalSetup = cart.reduce((sum, item) => sum + item.setup_fee, 0);
    const discountAmount = (totalMonthly + totalSetup) * (discount / 100);
    return {
      monthly: totalMonthly,
      setup: totalSetup,
      discount: discountAmount,
      final: totalMonthly + totalSetup - discountAmount,
    };
  };

  const handleFinalize = async () => {
    const totals = calculateTotals();
    
    try {
      const { error } = await supabase
        .from("proposals")
        .update({
          total_monthly: totals.monthly,
          total_setup: totals.setup,
          discount_value: totals.discount,
        })
        .eq("id", id);

      if (error) throw error;

      navigate(`/proposal/${id}/view`);
    } catch (error: any) {
      toast.error("Erro ao finalizar", { description: error.message });
    }
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Montar Proposta</h1>
          <p className="text-muted-foreground">Selecione serviços e planos da biblioteca</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Services Library */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </CardContent>
            </Card>
          ) : (
            services.map((service) => (
              <Card key={service.id} className="shadow-md hover:shadow-purple transition-shadow">
                <CardHeader
                  className="cursor-pointer"
                  onClick={() =>
                    setExpandedService(expandedService === service.id ? null : service.id)
                  }
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      {service.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {service.description}
                        </p>
                      )}
                    </div>
                    <ChevronRight
                      className={`h-5 w-5 transition-transform ${
                        expandedService === service.id ? "rotate-90" : ""
                      }`}
                    />
                  </div>
                </CardHeader>
                {expandedService === service.id && (
                  <CardContent>
                    <div className="grid gap-3">
                      {service.service_plans.map((plan) => (
                        <Card key={plan.id} className="bg-secondary/30">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold mb-2">{plan.plan_name}</h4>
                                <div className="space-y-1 text-sm">
                                  <p>
                                    <span className="text-muted-foreground">Mensal:</span>{" "}
                                    <span className="font-medium">
                                      R$ {plan.monthly_fee.toFixed(2)}
                                    </span>
                                  </p>
                                  <p>
                                    <span className="text-muted-foreground">Setup:</span>{" "}
                                    <span className="font-medium">
                                      R$ {plan.setup_fee.toFixed(2)}
                                    </span>
                                  </p>
                                  {plan.deliverables && (
                                    <p className="text-xs text-muted-foreground pt-2">
                                      {plan.deliverables}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => addToCart(plan, service.name)}
                                className="ml-2"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Cart */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Carrinho da Proposta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum item no carrinho
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-start justify-between text-sm border-b pb-2">
                      <div className="flex-1">
                        <p className="font-medium">{item.service_name}</p>
                        <p className="text-xs text-muted-foreground">{item.plan_name}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fee Mensal:</span>
                  <span className="font-medium">R$ {totals.monthly.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Implementação:</span>
                  <span className="font-medium">R$ {totals.setup.toFixed(2)}</span>
                </div>
                
                <div className="space-y-2 pt-2">
                  <Label className="text-xs">Desconto (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="h-8"
                  />
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-sm text-destructive">
                    <span>Desconto:</span>
                    <span>- R$ {totals.discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total:</span>
                  <span className="text-primary">R$ {totals.final.toFixed(2)}</span>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleFinalize}
                disabled={cart.length === 0}
              >
                Revisar e Fechar Proposta
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProposalBuild;
