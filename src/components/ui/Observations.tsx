import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type ExtendedProposal = {
  id: string;
  observations?: string | null;
  [key: string]: any;
};

interface ProposalObservationsProps {
  proposal: ExtendedProposal;
  setProposal: React.Dispatch<React.SetStateAction<ExtendedProposal>>;
}

export const ProposalObservations: React.FC<ProposalObservationsProps> = ({
  proposal,
  setProposal,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempObservation, setTempObservation] = useState(proposal.observations || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveObservation = async () => {
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from("proposals")
        .update({ observations: tempObservation } as any)
        .eq("id", proposal.id);

      if (error) throw error;

      setProposal((prev: any) => ({ ...prev, observations: tempObservation }));
      setIsEditing(false);
    } catch (err: any) {
      console.error("Erro ao salvar observação:", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTempObservation(proposal.observations || "");
    setIsEditing(false);
  };

  return (
    <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-base">Observações</h3>

        {!isEditing ? (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            Editar
          </Button>
        ) : (
          <div className="space-x-2">
            <Button
              size="sm"
              onClick={handleSaveObservation}
              disabled={isSaving}
            >
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancelar
            </Button>
          </div>
        )}
      </div>

      {!isEditing ? (
        <p className="text-base/80 whitespace-pre-line">
          {proposal.observations?.trim()
            ? proposal.observations
            : "Nenhuma observação adicionada ainda."}
        </p>
      ) : (
        <textarea
          className="w-full min-h-[120px] rounded-lg border border-white/10 bg-white/10 text-white p-3 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary resize-y"
          value={tempObservation}
          onChange={(e) => setTempObservation(e.target.value)}
          placeholder="Adicione observações sobre esta proposta..."
        />
      )}
    </div>
  );
};