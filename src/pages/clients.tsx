// src/pages/Clients.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Edit, Trash2, Eye, PlusCircle, Loader2, FileText } from "lucide-react";

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  created_at?: string;
}

interface Proposal {
  id: string;
  status: string;
  total_monthly: number;
  total_setup: number;
  discount_value?: number;
  created_at: string;
}

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const navigate = useNavigate();

  // --- Buscar clientes ---
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setClients(data || []);
    } catch (err: any) {
      toast.error("Erro ao carregar clientes", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  // --- Filtragem de busca ---
  const filteredClients = clients.filter((c) =>
    [c.name, c.email, c.company].some((field) =>
      field?.toLowerCase().includes(search.toLowerCase())
    )
  );

  // --- Editar Cliente ---
  const handleEditSave = async () => {
    if (!selectedClient) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("clients")
        .update({
          name: selectedClient.name,
          email: selectedClient.email,
          phone: selectedClient.phone,
          company: selectedClient.company,
        })
        .eq("id", selectedClient.id);

      if (error) throw error;
      toast.success("Cliente atualizado com sucesso!");
      setEditDialogOpen(false);
      fetchClients();
    } catch (err: any) {
      toast.error("Erro ao atualizar cliente", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  // --- Excluir Cliente ---
  const handleDelete = async () => {
    if (!selectedClient) return;
    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", selectedClient.id);
      if (error) throw error;
      toast.success("Cliente excluído com sucesso!");
      setDeleteDialogOpen(false);
      fetchClients();
    } catch (err: any) {
      toast.error("Erro ao excluir cliente", { description: err.message });
    }
  };

  // --- Abrir Detalhes ---
  const openDetails = async (client: Client) => {
    setSelectedClient(client);
    setDetailsDialogOpen(true);

    try {
      const { data, error } = await supabase
        .from("proposals")
        .select("id, status, total_monthly, total_setup, discount_value, created_at")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProposals(data || []);
    } catch (err: any) {
      toast.error("Erro ao carregar propostas", { description: err.message });
    }
  };

  const handleCreateClient = () => {
    navigate("/proposal/new");
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestão de Clientes</h1>
        <Button onClick={handleCreateClient}>
          <PlusCircle className="mr-2 h-4 w-4" /> Novo Cliente
        </Button>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Buscar por nome, email ou empresa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filteredClients.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">
          Nenhum cliente encontrado.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Card key={client.id} className="shadow-md border border-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  {client.name}
                </CardTitle>
                {client.company && (
                  <p className="text-sm text-muted-foreground">{client.company}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {client.email && (
                  <p>
                    <strong>Email:</strong> {client.email}
                  </p>
                )}
                {client.phone && (
                  <p>
                    <strong>Telefone:</strong> {client.phone}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDetails(client)}
                  >
                    <Eye className="h-4 w-4 mr-1" /> Detalhes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedClient(client);
                      setEditDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setSelectedClient(client);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* --- Modal de Edição --- */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-3 py-2">
              <div>
                <Label>Nome</Label>
                <Input
                  value={selectedClient.name}
                  onChange={(e) =>
                    setSelectedClient({ ...selectedClient, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={selectedClient.email || ""}
                  onChange={(e) =>
                    setSelectedClient({ ...selectedClient, email: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={selectedClient.phone || ""}
                  onChange={(e) =>
                    setSelectedClient({ ...selectedClient, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Empresa</Label>
                <Input
                  value={selectedClient.company || ""}
                  onChange={(e) =>
                    setSelectedClient({
                      ...selectedClient,
                      company: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Modal de Exclusão --- */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Cliente</DialogTitle>
          </DialogHeader>
          <p>
            Tem certeza que deseja excluir este cliente? Esta ação não pode ser
            desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Modal de Detalhes --- */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Cliente</DialogTitle>
          </DialogHeader>
          {selectedClient ? (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p>
                    <strong>Nome:</strong> {selectedClient.name}
                  </p>
                  {selectedClient.company && (
                    <p>
                      <strong>Empresa:</strong> {selectedClient.company}
                    </p>
                  )}
                  {selectedClient.email && (
                    <p>
                      <strong>Email:</strong> {selectedClient.email}
                    </p>
                  )}
                  {selectedClient.phone && (
                    <p>
                      <strong>Telefone:</strong> {selectedClient.phone}
                    </p>
                  )}
                </div>
                <div>
                  <p>
                    <strong>Cadastrado em:</strong>{" "}
                    {new Date(
                      selectedClient.created_at || ""
                    ).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

              <hr className="my-3" />

              <h3 className="font-semibold text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> Histórico de Propostas
              </h3>

              {proposals.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma proposta registrada para este cliente.
                </p>
              ) : (
                <div className="border rounded-md divide-y">
                  {proposals.map((p) => (
                    <div
                      key={p.id}
                      className="flex justify-between items-center p-3 text-sm"
                    >
                      <div>
                        <p>
                          <strong>Status:</strong> {p.status}
                        </p>
                        <p className="text-muted-foreground">
                          Criada em:{" "}
                          {new Date(p.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p>
                          <strong>Total:</strong>{" "}
                          R${" "}
                          {(
                            p.total_monthly +
                            p.total_setup -
                            (p.discount_value || 0)
                          ).toFixed(2)}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/proposal/${p.id}/view`)}
                        >
                          Visualizar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p>Carregando...</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Clients;