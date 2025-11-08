// src/components/pdf/ProposalDocument.tsx
import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Versão revisada do ProposalDocument que tenta reproduzir o layout do modelo
 * fornecido: cabeçalho roxo com logo circular, seções numeradas, "pills" para
 * serviços e tabela de investimento com totais. O componente recebe dados
 * dinâmicos via props.
 *
 * Observação: para o logo circular, forneça uma URL pública em `brandLogo`.
 */

// (Opcional) Registrar fontes se quiser fontes específicas (comentado)
// Font.register({ family: "Inter", src: "/fonts/Inter-Regular.ttf" });

// CORES
const COLORS = {
  purple: "#3b0f6f", // header
  purpleLight: "#efe6fb",
  textDark: "#222222",
  textMuted: "#6e6e6e",
  line: "#d9d9d9",
  accent: "#6f2bd6",
  white: "#ffffff",
  tableHeaderBg: "#faf7fe",
};

// ESTILOS
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

  // CABEÇALHO ROXO COM BOLINHA DO LOGO
  headerWrap: {
    backgroundColor: COLORS.purple,
    height: 88,
    width: "100%",
    borderRadius: 6,
    padding: 18,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "column",
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  headerSubtitle: {
    color: COLORS.white,
    fontSize: 9,
    opacity: 0.95,
  },
  headerLogoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  headerLogoText: {
    color: COLORS.white,
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
  },

  // Caixa com cliente / data (outline preto/white)
  clientBox: {
    borderWidth: 1,
    borderColor: COLORS.textDark,
    borderRadius: 4,
    padding: 8,
    marginBottom: 18,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  clientLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: COLORS.textDark,
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
    color: COLORS.purple,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 6,
  },

  // Serviços (grid de "pills")
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  servicePill: {
    borderRadius: 12,
    backgroundColor: COLORS.purpleLight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 8,
    marginRight: 8,
    minWidth: 120,
  },
  servicePillText: {
    color: COLORS.purple,
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
  },
  serviceDesc: {
    width: "48%",
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 6,
    marginBottom: 6,
  },

  // Tabela de investimento
  tableWrap: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: COLORS.tableHeaderBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    paddingVertical: 6,
  },
  tableHeaderCell: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: COLORS.textDark,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  colService: {
    width: "55%",
    paddingRight: 8,
    fontSize: 10,
  },
  colMonthly: {
    width: "22.5%",
    textAlign: "right",
    fontSize: 10,
  },
  colSetup: {
    width: "22.5%",
    textAlign: "right",
    fontSize: 10,
  },

  // Totais
  totalsWrap: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  totalsBox: {
    width: "40%",
    paddingTop: 6,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalsLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  totalsValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  totalFinalRow: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  // footer
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
  monthly_fee: number; // 0 se não aplicável
  setup_fee: number; // 0 se não aplicável
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
  brandLogo?: string; // url opcional do logo circular
}

/**
 * Helper pequeno para formatar moeda BRL
 */
const formatBRL = (n: number) =>
  `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;

/**
 * Componente principal
 */
export const ProposalDocument: React.FC<ProposalDocumentProps> = ({
  proposalData,
  clientData,
  items,
  brandLogo,
}) => {
  // calcular somas
  const totalMonthly = items.reduce((s, it) => s + (it.monthly_fee || 0), 0);
  const totalSetup = items.reduce((s, it) => s + (it.setup_fee || 0), 0);
  const discount = proposalData.discount_value || 0;
  const grandTotal = totalMonthly + totalSetup - discount;

  // Para exibir serviços agrupados visualmente, criaremos um conjunto de "pills"
  const pillLabels = items.map((i) => i.service_name);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.headerWrap}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Proposta Comercial</Text>
            <Text style={styles.headerSubtitle}>Prestação de Serviço de Marketing</Text>
          </View>

          {/* logo circular: se brandLogo fornecido, usar Image; caso contrário, placeholder */}
          {brandLogo ? (
            <Image
              src={brandLogo}
              style={{ width: 56, height: 56, borderRadius: 28 }}
            />
          ) : (
            <View style={styles.headerLogoCircle}>
              <Text style={styles.headerLogoText}>VG</Text>
            </View>
          )}
        </View>

        {/* CAIXA CLIENTE / DATA */}
        <View style={styles.clientBox}>
          <View>
            <Text style={styles.clientLabel}>Cliente:</Text>
            <Text style={styles.clientValue}>
              {clientData.company ? `${clientData.company} — ${clientData.name}` : clientData.name}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.clientLabel}>Data de Emissão:</Text>
            <Text style={styles.clientValue}>
              {format(new Date(proposalData.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </Text>
          </View>
        </View>

        {/* 1º Introdução */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1º Introdução</Text>
          <Text style={styles.paragraph}>
            A Vieri Group é uma empresa de marketing e tecnologia que ajuda negócios a venderem mais pela
            internet, construindo toda a estrutura digital necessária para crescer e performar no online.
            Trabalhamos com foco em resultados mensuráveis, entregáveis claros e governança de projeto.
          </Text>
        </View>

        {/* 2º Serviços e Benefícios */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2º Serviços e Benefícios</Text>

          {/* Pills de serviços */}
          <View style={styles.servicesGrid}>
            {pillLabels.map((label, idx) => (
              <View key={idx} style={styles.servicePill}>
                <Text style={styles.servicePillText}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Descrições (dois por linha quando possível) */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 6 }}>
            {items.map((it) => (
              <View key={it.id} style={{ width: "50%", paddingRight: 8 }}>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10, color: COLORS.textDark }}>
                  {it.service_name} — {it.plan_name}
                </Text>
                <Text style={styles.serviceDesc}>
                  {it.description ? it.description : "Descrição não informada."}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 3º Investimento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3º Investimento</Text>

          <View style={styles.tableWrap}>
            {/* Cabeçalho */}
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, styles.colService]}>Serviço</Text>
              <Text style={[styles.tableHeaderCell, styles.colMonthly]}>Mensal</Text>
              <Text style={[styles.tableHeaderCell, styles.colSetup]}>Implementação</Text>
            </View>

            {/* Linhas */}
            {items.map((it) => (
              <View key={it.id} style={styles.tableRow}>
                <Text style={[styles.colService]}>{it.service_name}</Text>

                <Text style={[styles.colMonthly]}>
                  {it.monthly_fee && it.monthly_fee > 0 ? formatBRL(it.monthly_fee) : "—"}
                </Text>

                <Text style={[styles.colSetup]}>
                  {it.setup_fee && it.setup_fee > 0 ? formatBRL(it.setup_fee) : "—"}
                </Text>
              </View>
            ))}
          </View>

          {/* Observações (opcional) */}
          {proposalData.observations ? (
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10, color: COLORS.textDark }}>
                Observações
              </Text>
              <Text style={{ fontSize: 9, color: COLORS.textMuted, marginTop: 4 }}>
                {proposalData.observations}
              </Text>
            </View>
          ) : null}

          {/* Totais à direita */}
          <View style={styles.totalsWrap}>
            <View style={styles.totalsBox}>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Valor Mensal:</Text>
                <Text style={styles.totalsValue}>{formatBRL(totalMonthly)}</Text>
              </View>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Implementação:</Text>
                <Text style={styles.totalsValue}>{formatBRL(totalSetup)}</Text>
              </View>
              {discount > 0 && (
                <View style={styles.totalsRow}>
                  <Text style={[styles.totalsLabel, { color: "red" }]}>Desconto:</Text>
                  <Text style={[styles.totalsValue, { color: "red" }]}>- {formatBRL(discount)}</Text>
                </View>
              )}
              <View style={styles.totalFinalRow}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>Valor Final de Contratação</Text>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>{formatBRL(grandTotal)}</Text>
              </View>
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