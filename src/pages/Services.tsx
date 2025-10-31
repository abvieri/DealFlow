import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Package } from "lucide-react";
import { toast } from "sonner";

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

const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    plans: [{ plan_name: "", monthly_fee: 0, setup_fee: 0, deliverables: "", delivery_time_days: 0 }],
  });

  useEffect(() => {
    fetchServices();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingService) {
        const { error: serviceError } = await supabase
          .from("services")
          .update({ name: formData.name, description: formData.description })
          .eq("id", editingService.id);

        if (serviceError) throw serviceError;

        await supabase.from("service_plans").delete().eq("service_id", editingService.id);
      } else {
        const { data: serviceData, error: serviceError } = await supabase
          .from("services")
          .insert({ name: formData.name, description: formData.description })
          .select()
          .single();

        if (serviceError) throw serviceError;

        const plans = formData.plans.map((plan) => ({
          ...plan,
          service_id: serviceData.id,
        }));

        const { error: plansError } = await supabase.from("service_plans").insert(plans);
        if (plansError) throw plansError;
      }

      if (editingService) {
        const plans = formData.plans.map((plan) => ({
          ...plan,
          service_id: editingService.id,
        }));

        const { error: plansError } = await supabase.from("service_plans").insert(plans);
        if (plansError) throw plansError;
      }

      toast.success(editingService ? "Serviço atualizado!" : "Serviço criado!");
      setDialogOpen(false);
      resetForm();
      fetchServices();
    } catch (error: any) {
      toast.error("Erro ao salvar serviço", { description: error.message });
    }
  };

  const deleteService = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este serviço?")) return;

    try {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
      toast.success("Serviço removido!");
      fetchServices();
    } catch (error: any) {
      toast.error("Erro ao remover serviço", { description: error.message });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      plans: [{ plan_name: "", monthly_fee: 0, setup_fee: 0, deliverables: "", delivery_time_days: 0 }],
    });
    setEditingService(null);
  };

  const addPlan = () => {
    setFormData({
      ...formData,
      plans: [...formData.plans, { plan_name: "", monthly_fee: 0, setup_fee: 0, deliverables: "", delivery_time_days: 0 }],
    });
  };

  const removePlan = (index: number) => {
    const newPlans = formData.plans.filter((_, i) => i !== index);
    setFormData({ ...formData, plans: newPlans });
  };

  const updatePlan = (index: number, field: string, value: any) => {
    const newPlans = [...formData.plans];
    newPlans[index] = { ...newPlans[index], [field]: value };
    setFormData({ ...formData, plans: newPlans });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Serviços</h1>
          <p className="text-muted-foreground">Configure serviços e planos disponíveis</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={resetForm}>
              <Plus className="h-4 w-4" />
              Novo Serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingService ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Serviço</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base font-semibold">Planos</Label>
                  <Button type="button" onClick={addPlan} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Plano
                  </Button>
                </div>
                
                {formData.plans.map((plan, index) => (
                  <Card key={index} className="mb-4">
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">Plano {index + 1}</Label>
                        {formData.plans.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removePlan(index)}
                            size="sm"
                            variant="ghost"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Nome do Plano</Label>
                          <Input
                            value={plan.plan_name}
                            onChange={(e) => updatePlan(index, "plan_name", e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Prazo de Entrega (dias)</Label>
                          <Input
                            type="number"
                            value={plan.delivery_time_days}
                            onChange={(e) => updatePlan(index, "delivery_time_days", parseInt(e.target.value) || 0)}
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            Aplicável apenas a serviços de pagamento único
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>Fee Mensal (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={plan.monthly_fee}
                            onChange={(e) => updatePlan(index, "monthly_fee", parseFloat(e.target.value) || 0)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Implementação (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={plan.setup_fee}
                            onChange={(e) => updatePlan(index, "setup_fee", parseFloat(e.target.value) || 0)}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Entregáveis</Label>
                        <Textarea
                          value={plan.deliverables}
                          onChange={(e) => updatePlan(index, "deliverables", e.target.value)}
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button type="submit" className="w-full">
                {editingService ? "Atualizar Serviço" : "Criar Serviço"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : services.length === 0 ? (
        <Card className="shadow-lg">
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum serviço cadastrado ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {services.map((service) => (
            <Card key={service.id} className="shadow-lg hover:shadow-purple transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{service.name}</CardTitle>
                    {service.description && (
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingService(service);
                        setFormData({
                          name: service.name,
                          description: service.description || "",
                          plans: service.service_plans.map((p) => ({
                            plan_name: p.plan_name,
                            monthly_fee: p.monthly_fee,
                            setup_fee: p.setup_fee,
                            deliverables: p.deliverables || "",
                            delivery_time_days: p.delivery_time_days,
                          })),
                        });
                        setDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteService(service.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {service.service_plans.map((plan) => (
                    <Card key={plan.id} className="bg-secondary/30">
                      <CardContent className="pt-6">
                        <h4 className="font-semibold mb-3">{plan.plan_name}</h4>
                        <div className="space-y-2 text-sm">
                          <p>
                            <span className="text-muted-foreground">Fee Mensal:</span>{" "}
                            <span className="font-medium">R$ {plan.monthly_fee.toFixed(2)}</span>
                          </p>
                          <p>
                            <span className="text-muted-foreground">Implementação:</span>{" "}
                            <span className="font-medium">R$ {plan.setup_fee.toFixed(2)}</span>
                          </p>
                          <p>
                            <span className="text-muted-foreground">Prazo:</span>{" "}
                            <span className="font-medium">{plan.delivery_time_days} dias</span>
                          </p>
                          {plan.deliverables && (
                            <p className="text-xs text-muted-foreground pt-2 border-t">
                              {plan.deliverables}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Services;
