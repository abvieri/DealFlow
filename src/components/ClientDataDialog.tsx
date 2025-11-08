import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ClientDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposalId?: string;
  onClientSaved: (client: any) => void; // 🔹 Agora recebe o cliente criado
}

export const ClientDataDialog: React.FC<ClientDataDialogProps> = ({
  open,
  onOpenChange,
  proposalId,
  onClientSaved,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveClient = async () => {
    if (!name) {
      toast.error("O nome do cliente é obrigatório!");
      return;
    }

    setIsSaving(true);

    try {
      // 🔹 1. Inserir cliente
      const { data: clientData, error: insertError } = await supabase
        .from("clients")
        .insert({ name, email, phone, company })
        .select("*")
        .single();

      if (insertError) throw insertError;

      // 🔹 2. Se tiver uma proposta, vincular automaticamente
      if (proposalId) {
        const { error: updateError } = await supabase
          .from("proposals")
          .update({ client_id: clientData.id })
          .eq("id", proposalId);

        if (updateError) throw updateError;
      }

      toast.success("Cliente criado com sucesso!");
      onClientSaved(clientData);
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao salvar cliente: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Cliente</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label>Nome</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do cliente"
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email do cliente"
            />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Telefone do cliente"
            />
          </div>
          <div>
            <Label>Empresa</Label>
            <Input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Empresa do cliente"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSaveClient} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar Cliente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};