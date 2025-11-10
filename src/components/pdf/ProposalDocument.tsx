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

// Paleta
const COLORS = {
  purple: "#460a67",
  purpleAccent: "#8113b2",
  bg: "#ffffff",
  textDark: "#222222",
  textMuted: "#6e6e6e",
  line: "#d8d8d8",
  white: "#ffffff",
};

// Estilos globais
const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.bg,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: COLORS.textDark,
    paddingTop: 130, // espaço pro header fixo
    paddingBottom: 80, // espaço pro footer fixo
    paddingHorizontal: 30,
  },

  // Header fixo (sem margem, colado no topo)
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.purple,
    color: COLORS.white,
    paddingVertical: 18,
    paddingHorizontal: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 5,
  },
  headerMeta: {
    fontSize: 10,
    color: COLORS.white,
    marginTop: 3,
  },
  logoImg: {
    height: 60,
    objectFit: "contain",
  },

  // Footer fixo
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.purple,
    color: COLORS.white,
    paddingVertical: 10,
    paddingHorizontal: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  footerText: {
    fontSize: 9,
    color: COLORS.white,
  },

  // Conteúdo
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 14,
    color: COLORS.purple,
    borderBottomWidth: 1,
    borderBottomColor: `${COLORS.purple}`,
    paddingBottom: 6,
    marginBottom: 10,
    fontFamily: "Helvetica-Bold",
  },
  paragraph: {
    fontSize: 10,
    color: COLORS.textDark,
    lineHeight: 1.5,
  },

  // Serviços
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  serviceItem: {
    width: "48%",
    backgroundColor: "#f9f9f9",
    borderLeftWidth: 5,
    borderLeftColor: COLORS.purpleAccent,
    padding: 10,
    marginBottom: 10,
    borderRadius: 4,
  },
  serviceTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 9,
    color: COLORS.textMuted,
    lineHeight: 1.3,
  },

  // Tabela de valores
  priceTable: {
    marginTop: 6,
    borderWidth: 0.5,
    borderColor: COLORS.line,
    borderRadius: 6,
  },
  tableHeader: {
    flexDirection: "row",
    // backgroundColor: "#f3f3f3",
    backgroundColor: COLORS.purpleAccent+'20',
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.line,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  thService: { width: "70%", fontFamily: "Helvetica-Bold" },
  thValue: {
    width: "30%",
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.line,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tdService: { width: "70%" },
  tdValue: { width: "30%", textAlign: "right" },

  // Totais
  totalsWrap: {
    alignItems: "flex-end",
    marginTop: 10,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "40%",
    marginTop: 5,
  },
  totalLabel: { fontFamily: "Helvetica-Bold" },
  totalValue: { fontFamily: "Helvetica-Bold" },
});

interface Item {
  id: string;
  service_name: string;
  description?: string | null;
  monthly_fee: number;
  setup_fee: number;
}

interface ProposalDocumentProps {
  proposalData: {
    id: string;
    created_at: string;
    discount_value?: number;
  };
  clientData: {
    name: string;
    company?: string;
  };
  items: Item[];
  brandLogo?: string;
}

const formatBRL = (n: number) =>
  `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;

export const ProposalDocument: React.FC<ProposalDocumentProps> = ({
  proposalData,
  clientData,
  items,
  brandLogo,
}) => {
  const totalMonthly = items.reduce((s, it) => s + (it.monthly_fee || 0), 0);
  const totalSetup = items.reduce((s, it) => s + (it.setup_fee || 0), 0);
  const discount = proposalData.discount_value || 0;
  const grandTotal = totalMonthly + totalSetup - discount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER FIXO */}
        <View style={styles.header} fixed>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Proposta Comercial</Text>
            <Text style={styles.headerMeta}>
              Cliente: {clientData.company || clientData.name}
            </Text>
            <Text style={styles.headerMeta}>
              Data:{" "}
              {format(new Date(proposalData.created_at), "dd 'de' MMMM yyyy", {
                locale: ptBR,
              })}
            </Text>
          </View>
          <Image src='/public/logovg.png' style={styles.logoImg} />
        </View>

        {/* CONTEÚDO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Introdução</Text>
          <Text style={styles.paragraph}>
            A Vieri Group é uma empresa de marketing e tecnologia que ajuda
            pequenos e médios negócios a vender mais pela internet,
            construindo toda a estrutura digital necessária para crescer e
            performar no online.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Serviços e Entregáveis</Text>
          <View style={styles.servicesGrid}>
            {items.map((item) => (
              <View key={item.id} style={styles.serviceItem}>
                <Text style={styles.serviceTitle}>{item.service_name}</Text>
                <Text style={styles.serviceDesc}>
                  {item.description || "Descrição do serviço."}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Investimento</Text>
          <View style={styles.priceTable}>
            <View style={styles.tableHeader}>
              <Text style={styles.thService}>Serviço</Text>
              <Text style={styles.thValue}>Valor</Text>
            </View>

            {items.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={styles.tdService}>{item.service_name}</Text>
                <Text style={styles.tdValue}>{formatBRL(item.monthly_fee)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.totalsWrap}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Mensal</Text>
              <Text style={styles.totalValue}>{formatBRL(totalMonthly)}</Text>
            </View>
            {totalSetup > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Setup</Text>
              <Text style={styles.totalValue}>{formatBRL(totalSetup)}</Text>
            </View>
            )}
            {discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Desconto</Text>
                <Text style={styles.totalValue}>{formatBRL(discount)}</Text>
              </View>
            )}
            <View style={[styles.totalRow, { marginTop: 10 }]}>
              <Text style={styles.totalLabel}>Valor Final</Text>
              <Text style={styles.totalValue}>{formatBRL(grandTotal)}</Text>
            </View>
          </View>
        </View>

        {/* FOOTER FIXO */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Vieri Group • contato@vierigroup.com
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
};

export default ProposalDocument;