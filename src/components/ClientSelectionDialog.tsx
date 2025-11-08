import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ClientDataDialog } from "./ClientDataDialog";
import { supabase } from "@/integrations/supabase/client";
import * as Select from "@radix-ui/react-select";

interface ClientSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientSelected: (client: any) => void;
  proposalId: string;
}

export const ClientSelectionDialog: React.FC<ClientSelectionDialogProps> = ({
  open,
  onOpenChange,
  onClientSelected,
  proposalId,
}) => {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    if (open) fetchClients();
  }, [open]);

  const fetchClients = async () => {
    const { data, error } = await supabase.from("clients").select("*");
    if (!error) setClients(data || []);
  };

  const handleSelectClient = () => {
    const client = clients.find((c) => c.id === selectedClientId);
    if (client) {
      onClientSelected(client);
      onOpenChange(false);
    }
  };

  const handleNewClientSaved = async (client: any) => {
    setClients((prev) => [...prev, client]);
    onClientSelected(client);
    setShowCreateDialog(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Selecione ou Crie um Cliente</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <Select.Root value={selectedClientId || ""} onValueChange={setSelectedClientId}>
            <Select.Trigger className="w-full border rounded px-3 py-2 text-left">
                <Select.Value placeholder="Selecione um cliente..." />
            </Select.Trigger>

            <Select.Portal>
                <Select.Content
                position="popper"
                sideOffset={5}
                className="z-50 bg-white border rounded-md shadow-md max-h-64 overflow-y-auto"
                >
                <Select.Viewport>
                    {clients.map((c) => (
                    <Select.Item
                        key={c.id}
                        value={c.id}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                        <Select.ItemText>
                        {c.name} {c.company ? `(${c.company})` : ""}
                        </Select.ItemText>
                    </Select.Item>
                    ))}
                </Select.Viewport>
                </Select.Content>
            </Select.Portal>
            </Select.Root>
            
            <div className="flex gap-2 mt-4">
              <Button onClick={handleSelectClient} disabled={!selectedClientId}>
                Confirmar Cliente
              </Button>
              <Button
                onClick={() => setShowCreateDialog(true)}
                variant="outline"
              >
                Criar Novo Cliente
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para criar novo cliente */}
      <ClientDataDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onClientSaved={handleNewClientSaved}
        proposalId={proposalId}
      />
    </>
  );
};