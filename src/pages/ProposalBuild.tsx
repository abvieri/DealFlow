import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShoppingCart, Search } from "lucide-react";

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
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allPlans = filteredServices.flatMap(service =>
    service.service_plans.map(plan => ({
      ...plan,
      service_name: service.name,
      service_id: service.id
    }))
  );

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Portfólio de Produtos e Serviços V4</h1>
        
        {/* Search Bar */}
        <div className="max-w-md mx-auto mt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Services Grid - 3 columns */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allPlans.map((plan) => {
                const isInCart = cart.some(item => item.id === plan.id);
                
                return (
                  <Card key={plan.id} className="shadow-md hover:shadow-lg transition-shadow flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-base leading-tight">
                          {plan.service_name} - {plan.plan_name}
                        </CardTitle>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="text-xs">
                          CRM
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between space-y-3 pt-0">
                      {plan.deliverables && (
                        <p className="text-xs text-muted-foreground line-clamp-3">
                          {plan.deliverables}
                        </p>
                      )}
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Valor:</span>
                          <span className="text-lg font-bold">
                            R$ {plan.monthly_fee.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Margem:</span>
                          <span className="text-sm font-semibold text-primary">
                            {((plan.setup_fee / plan.monthly_fee) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {isInCart ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeFromCart(plan.id)}
                          className="w-full"
                        >
                          Remover
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => addToCart(plan, plan.service_name)}
                          className="w-full"
                        >
                          Ver Detalhes
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart - 1 column */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingCart className="h-5 w-5" />
                Carrinho
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
