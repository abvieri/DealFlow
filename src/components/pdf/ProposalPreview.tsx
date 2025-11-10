import { PDFViewer } from "@react-pdf/renderer";
import { ProposalDocument } from "@/components/pdf/ProposalDocument";

export default function ProposalPreview() {
  const fakeProposal = {
    id: "1",
    created_at: new Date().toISOString(),
    discount_value: 100,
  };

  const fakeClient = {
    name: "Luana Santos",
    company: "Clínica Estética BellaVitta",
  };

  const fakeItems = [
    { id: "1", service_name: "Gestão de Mídia Paga", monthly_fee: 1200, setup_fee: 300 },
    { id: "2", service_name: "Social Media", monthly_fee: 900, setup_fee: 0 },
    { id: "3", service_name: "CRM e Automação", monthly_fee: 700, setup_fee: 150 },
  ];

  return (
    <div className="w-screen h-screen">
      <PDFViewer width="100%" height="100%">
        <ProposalDocument
          proposalData={fakeProposal}
          clientData={fakeClient}
          items={fakeItems}
          brandLogo="/logo-vierigroup.png"
        />
      </PDFViewer>
    </div>
  );
}