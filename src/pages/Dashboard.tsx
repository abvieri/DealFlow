import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Edit, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Proposal {
  id: string;
  created_at: string;
  status: string;
  total_monthly: number;
  total_setup: number;
  client?: {
    name: string;
  };
}

const Dashboard = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchProposals();
    }
  }, [user]);

  const fetchProposals = async () => {
    try {
      const { data, error } = await supabase
        .from("proposals")
        .select("*, clients(name)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setProposals(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar propostas", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteProposal = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover esta proposta?")) return;

    try {
      const { error } = await supabase.from("proposals").delete().eq("id", id);

      if (error) throw error;

      toast.success("Proposta removida com sucesso!");
      fetchProposals();
    } catch (error: any) {
      toast.error("Erro ao remover proposta", {
        description: error.message,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      Rascunho: "secondary",
      Salva: "outline",
      Enviada: "default",
      Aceita: "default",
      Recusada: "destructive",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Propostas</h1>
          <p className="text-muted-foreground">Gerencie suas propostas comerciais</p>
        </div>
        <div className="flex gap-2">
          <Link to="/proposal/simulate">
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Simular Proposta
            </Button>
          </Link>
          <Link to="/proposal/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Nova Proposta
            </Button>
          </Link>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Todas as propostas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : proposals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma proposta encontrada. Crie sua primeira proposta!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Fee Mensal</TableHead>
                  <TableHead className="text-right">Implementação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposals.map((proposal) => (
                  <TableRow key={proposal.id}>
                    <TableCell className="font-medium">
                      {proposal.client?.name || "Sem Cliente"}
                    </TableCell>
                    <TableCell>
                      {format(new Date(proposal.created_at), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>{getStatusBadge(proposal.status)}</TableCell>
                    <TableCell className="text-right font-medium">
                      R$ {proposal.total_monthly.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      R$ {proposal.total_setup.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/proposal/${proposal.id}/view`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link to={`/proposal/${proposal.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteProposal(proposal.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
