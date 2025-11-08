// src/pages/ProposalNew.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Plus, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import * as Select from "@radix-ui/react-select";

const ProposalNew = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
  });

  // Carrega clientes existentes
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
    if (error) console.error(error);
    setClients(data || []);
  };

  const handleCreateProposal = async (clientId: string) => {
    setLoading(true);
    try {
      const { data: proposalData, error } = await supabase
        .from("proposals")
        .insert({
          user_id: user?.id,
          client_id: clientId,
          status: "Salvo", // Já começa como salvo
          total_monthly: 0,
          total_setup: 0,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Proposta criada com sucesso!");
      navigate(`/proposal/${proposalData.id}/build`);
    } catch (error: any) {
      toast.error("Erro ao criar proposta", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExisting = async () => {
    if (!selectedClient) {
      toast.error("Selecione um cliente antes de continuar.");
      return;
    }
    await handleCreateProposal(selectedClient);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: clientData, error } = await supabase
        .from("clients")
        .insert(formData)
        .select()
        .single();

      if (error) throw error;

      toast.success("Cliente criado!");
      await handleCreateProposal(clientData.id);
    } catch (error: any) {
      toast.error("Erro ao criar cliente", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Nova Proposta</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {!creatingNew ? (
            <>
              <div className="space-y-2">
                <Label>Selecione um cliente existente</Label>
                <Select.Root
                  value={selectedClient || ""}
                  onValueChange={(val) => setSelectedClient(val)}
                >
                  <Select.Trigger className="w-full border rounded px-3 py-2 text-left">
                    <Select.Value placeholder="Selecione um cliente..." />
                  </Select.Trigger>
                  <Select.Content className="bg-white border rounded shadow-md">
                    <Select.Viewport>
                      {clients.map((client) => (
                        <Select.Item key={client.id} value={client.id} className="px-3 py-2 cursor-pointer hover:bg-gray-100">
                          <Select.ItemText>
                            {client.name} {client.company ? `(${client.company})` : ""}
                          </Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Root>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setCreatingNew(true)} className="flex-1">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Cliente
                </Button>
                <Button onClick={handleSelectExisting} disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Users className="mr-2 h-4 w-4" />
                      Usar Cliente Selecionado
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <form onSubmit={handleCreateClient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Empresa</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreatingNew(false)}
                  disabled={loading}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Salvar Cliente e Criar Proposta"
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProposalNew;
