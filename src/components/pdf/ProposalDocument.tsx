// src/components/pdf/ProposalDocument.tsx
import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// CORES
const COLORS = {
  purple: "#3b0f6f",
  purpleLight: "#efe6fb",
  textDark: "#222222", 
  textMuted: "#6e6e6e",
  line: "#d9d9d9",
  accent: "#6f2bd6",
  white: "#ffffff",
  tableHeaderBg: "#faf7fe",
};

// ESTILOS - Layout do PDF Premium Contábil
const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: COLORS.textDark,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 40,
    lineHeight: 1.3,
  },

  // CABEÇALHO - Simplificado como no PDF
  header: {
    marginBottom: 18,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textDark,
  },

  // TABELA CLIENTE/DATA - Estilo do PDF
  clientTable: {
    width: "100%",
    marginBottom: 18,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.textDark,
  },
  clientRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: COLORS.textDark,
  },
  clientCell: {
    flex: 1,
    padding: 8,
    borderRightWidth: 1,
    borderColor: COLORS.textDark,
  },
  clientCellLast: {
    flex: 1,
    padding: 8,
  },
  clientLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: COLORS.textDark,
    marginBottom: 2,
  },
  clientValue: {
    fontSize: 10,
    color: COLORS.textMuted,
  },

  // SEÇÕES
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: COLORS.textDark,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 6,
    lineHeight: 1.4,
  },

  // LAYOUT DE SERVIÇOS - Dois serviços por linha
  servicesContainer: {
    marginTop: 8,
  },
  serviceRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  serviceColumn: {
    width: "50%",
    paddingRight: 10,
  },
  serviceTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: COLORS.textDark,
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 9,
    color: COLORS.textMuted,
    lineHeight: 1.3,
  },

  // TABELA DE INVESTIMENTO - Layout específico do PDF
  investmentTable: {
    marginTop: 8,
    width: "100%",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.tableHeaderBg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.line,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: COLORS.line,
  },
  colService: {
    width: "60%",
    fontSize: 10,
  },
  colIndividual: {
    width: "20%",
    fontSize: 10,
    textAlign: "right",
  },
  colFinal: {
    width: "20%", 
    fontSize: 10,
    textAlign: "right",
  },

  // TOTAIS
  totalsSection: {
    marginTop: 12,
    alignItems: "flex-end",
  },
  totalFinalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "40%",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    fontFamily: "Helvetica-Bold",
  },

  // FOOTER
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 9,
    color: COLORS.textMuted,
  },
});

/**
 * Tipagem das props
 */
interface Item {
  id: string;
  service_name: string;
  plan_name: string;
  description?: string | null;
  monthly_fee: number;
  setup_fee: number;
  type?: "one_time" | "recurring" | "both";
}

interface ProposalDocumentProps {
  proposalData: {
    id: string;
    created_at: string;
    total_monthly?: number;
    total_setup?: number;
    discount_value?: number;
    observations?: string | null;
  };
  clientData: {
    name: string;
    company?: string;
    email?: string;
    phone?: string;
  };
  items: Item[];
  brandLogo?: string;
}

/**
 * Helper para formatar moeda BRL
 */
const formatBRL = (n: number) =>
  `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;

/**
 * Componente principal - Modelo Premium Contábil com dados dinâmicos
 */
export const ProposalDocument: React.FC<ProposalDocumentProps> = ({
  proposalData,
  clientData,
  items,
  brandLogo,
}) => {
  // Calcular totais dinamicamente
  const totalMonthly = items.reduce((s, it) => s + (it.monthly_fee || 0), 0);
  const totalSetup = items.reduce((s, it) => s + (it.setup_fee || 0), 0);
  const discount = proposalData.discount_value || 0;
  const grandTotal = totalMonthly + totalSetup - discount;

  // Organizar serviços em pares para o layout de duas colunas
  const servicePairs = [];
  for (let i = 0; i < items.length; i += 2) {
    servicePairs.push(items.slice(i, i + 2));
  }

  // Determinar quais serviços devem ter asterisco (baseado no tipo ou nome)
  const shouldHaveAsterisk = (serviceName: string) => {
    const asteriskServices = ["Google Meu Negócio", "Social Selling", "Dashboard de Performance"];
    return asteriskServices.some(name => serviceName.includes(name));
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* CABEÇALHO */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Proposta Comercial</Text>
          <Text style={styles.headerSubtitle}>Prestação de Serviço de Marketing</Text>
        </View>

        {/* TABELA CLIENTE/DATA */}
        <View style={styles.clientTable}>
          <View style={styles.clientRow}>
            <View style={styles.clientCell}>
              <Text style={styles.clientLabel}>Cliente:</Text>
              <Text style={styles.clientValue}>
                {clientData.company || clientData.name}
              </Text>
            </View>
            <View style={styles.clientCellLast}>
              <Text style={styles.clientLabel}>Data de Emissão:</Text>
              <Text style={styles.clientValue}>
                {format(new Date(proposalData.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </Text>
            </View>
          </View>
        </View>

        {/* 1º Introdução */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1º Introdução</Text>
          <Text style={styles.paragraph}>
            A Vieri Group é uma empresa de marketing e tecnologia que ajuda pequenos e
            médios negócios a vender mais pela internet, construindo toda a estrutura digital
            necessária para crescer e performar no online.
          </Text>
        </View>

        {/* 2º Serviços e Benefícios */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2º Serviços e Benefícios</Text>
          
          <View style={styles.servicesContainer}>
            {servicePairs.map((pair, rowIndex) => (
              <View key={rowIndex} style={styles.serviceRow}>
                {pair.map((item, colIndex) => (
                  <View key={item.id} style={styles.serviceColumn}>
                    <Text style={styles.serviceTitle}>{item.service_name}</Text>
                    <Text style={styles.serviceDescription}>
                      {item.description || "Descrição do serviço."}
                    </Text>
                  </View>
                ))}
                {/* Se número ímpar de serviços, preencher coluna vazia */}
                {pair.length === 1 && <View style={styles.serviceColumn} />}
              </View>
            ))}
          </View>
        </View>

        {/* 3º Investimento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3º Investimento</Text>

          <View style={styles.investmentTable}>
            {/* Cabeçalho da tabela */}
            <View style={styles.tableHeader}>
              <Text style={[styles.colService, {fontFamily: "Helvetica-Bold"}]}>Serviço</Text>
              <Text style={[styles.colIndividual, {fontFamily: "Helvetica-Bold"}]}>Individual</Text>
              <Text style={[styles.colFinal, {fontFamily: "Helvetica-Bold"}]}>Valor Final</Text>
            </View>

            {/* Linhas da tabela - usando monthly_fee para Individual e setup_fee para Valor Final */}
            {items.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={styles.colService}>
                  {shouldHaveAsterisk(item.service_name) ? `*${item.service_name}` : item.service_name}
                </Text>
                <Text style={styles.colIndividual}>
                  {item.monthly_fee > 0 ? formatBRL(item.monthly_fee) : "—"}
                </Text>
                <Text style={styles.colFinal}>
                  {item.setup_fee > 0 ? formatBRL(item.setup_fee) : "—"}
                </Text>
              </View>
            ))}
          </View>

          {/* Totais */}
          <View style={styles.totalsSection}>
            <View style={styles.totalFinalRow}>
              <Text style={{fontFamily: "Helvetica-Bold"}}>Valor Final de Contratação</Text>
              <Text style={{fontFamily: "Helvetica-Bold"}}>{formatBRL(grandTotal)}</Text>
            </View>
          </View>
        </View>

        {/* RODAPÉ */}
        <View style={styles.footer} fixed>
          <Text>Vieri Group • contato@vierigroup.com • (48) 99999-9999</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};

export default ProposalDocument;