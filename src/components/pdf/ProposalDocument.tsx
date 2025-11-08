// src/components/pdf/ProposalDocument.tsx
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- DEFINIÇÃO DE CORES (Baseado no seu PDF) ---
const colors = {
  textPrimary: '#2d2d2d', // Cinza bem escuro
  textSecondary: '#7c7c7c', // Cinza médio
  line: '#e0e0e0',         // Cinza claro para linhas
  bgHeader: '#f9f9f9',      // Fundo leve para cabeçalho da tabela
};

// --- DEFINIÇÃO DE ESTILOS ---
const styles = StyleSheet.create({
  page: {
    paddingTop: 35,
    paddingBottom: 65, // Espaço para o rodapé
    paddingHorizontal: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: colors.textSecondary,
  },
  // --- CABEÇALHO DA PÁGINA ---
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottom: `1px solid ${colors.line}`,
  },
  headerLogo: {
    // TODO: Adicionar o seu <Image /> aqui. 
    // Por agora, um texto de placeholder.
    width: 100,
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.textPrimary,
  },
  headerTitleBlock: {
    textAlign: 'right',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: colors.textPrimary,
  },
  headerClient: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  
  // --- BLOCO DO CLIENTE ---
  clientBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  clientName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: colors.textPrimary,
  },
  date: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // --- SECÇÕES ---
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  paragraph: {
    lineHeight: 1.5,
  },

  // --- SECÇÃO 2: LAYOUT DE COLUNAS ---
  twoColumnRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  twoColumnLeft: {
    width: '35%',
    paddingRight: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.textPrimary,
  },
  twoColumnRight: {
    width: '65%',
    lineHeight: 1.4,
  },

  // --- SECÇÃO 3: TABELA DE INVESTIMENTO ---
  table: {
    border: `1px solid ${colors.line}`,
    borderRadius: 3,
    overflow: 'hidden', // Para o borderRadius funcionar
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: colors.bgHeader,
    borderBottom: `1px solid ${colors.line}`,
  },
  tableHeaderCell: {
    padding: 8,
    fontFamily: 'Helvetica-Bold',
    color: colors.textPrimary,
    fontSize: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: `1px solid ${colors.line}`,
  },
  tableCell: {
    padding: 8,
  },
  // Larguras da tabela
  colService: {
    width: '50%',
  },
  colMonthly: {
    width: '25%',
    textAlign: 'right',
  },
  colSetup: {
    width: '25%',
    textAlign: 'right',
  },

  // --- TOTAIS ---
  totalsContainer: {
    marginTop: 20,
    marginLeft: 'auto', // Alinha o bloco à direita
    width: '40%',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalsLabel: {
    color: colors.textSecondary,
  },
  totalsValue: {
    fontFamily: 'Helvetica-Bold',
    color: colors.textPrimary,
  },
  totalsFinalRow: {
    marginTop: 5,
    paddingTop: 5,
    borderTop: `1px solid ${colors.line}`,
  },
  totalsFinalLabel: {
    fontFamily: 'Helvetica-Bold',
    color: colors.textPrimary,
    fontSize: 12,
  },
  totalsFinalValue: {
    fontFamily: 'Helvetica-Bold',
    color: colors.textPrimary,
    fontSize: 12,
  },

  // --- RODAPÉ FIXO ---
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: `1px solid ${colors.line}`,
    paddingTop: 10,
    fontSize: 9,
    color: colors.textSecondary,
    fontFamily: 'Helvetica-Oblique',
  },
  footerLogo: {
    // TODO: Adicionar o seu <Image /> do logo aqui
    width: 60,
    textAlign: 'right',
    fontFamily: 'Helvetica-Bold',
  }
});

// --- TIPAGEM (A sua interface original) ---
interface ProposalDocumentProps {
  proposalData: {
    id: string;
    created_at: string;
    total_monthly: number;
    total_setup: number;
    discount_value: number;
  };
  clientData: {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
  };
  items: Array<{
    id: string;
    service_name: string;
    plan_name: string;
    description?: string | null;
    monthly_fee: number;
    setup_fee: number;
    delivery_time_days: number;
  }>;
}

// --- COMPONENTE DO DOCUMENTO ---
export const ProposalDocument: React.FC<ProposalDocumentProps> = ({ proposalData, clientData, items }) => {
  // Os seus cálculos originais
  const totalMonthly = items.reduce((sum, item) => sum + item.monthly_fee, 0);
  const totalSetup = items.reduce((sum, item) => sum + item.setup_fee, 0);
  const discount = proposalData.discount_value || 0;
  // O seu PDF de exemplo soma mensal + setup no "Total Geral"
  const finalTotal = totalMonthly + totalSetup - discount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* --- CABEÇALHO --- */}
        <View style={styles.header}>
          <View style={styles.headerLogo}>
            {/* REMOVA ESTE TEXTO E ADICIONE O SEU LOGO
              Ex: <Image src="/logo-vieri.png" style={{ width: 100 }} /> 
              NOTA: O logo precisa estar acessível publicamente ou
              ser importado e "bundleado" com o seu app.
            */}
            <Text>Vieri Group</Text>
          </View>
          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerTitle}>PROPOSTA COMERCIAL</Text>
            <Text style={styles.headerClient}>CLIENTE: {clientData.company || clientData.name}</Text>
          </View>
        </View>

        {/* --- INFORMAÇÕES DO CLIENTE --- */}
        <View style={styles.clientBlock}>
          <Text style={styles.clientName}>{clientData.company || clientData.name}</Text>
          <Text style={styles.date}>
            {format(new Date(proposalData.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </Text>
        </View>

        {/* --- 1º INTRODUÇÃO --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1º INTRODUÇÃO</Text>
          <Text style={styles.paragraph}>
            A Vieri Group é uma empresa de marketing e tecnologia focada em soluções personalizadas para cada cliente, visando resultados tangíveis e estratégicos.
          </Text>
        </View>

        {/* --- 2º SERVIÇOS E BENEFÍCIOS --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2º SERVIÇOS E BENEFÍCIOS</Text>
          {items.map(item => (
            <View key={item.id} style={styles.twoColumnRow}>
              <Text style={styles.twoColumnLeft}>{item.service_name}</Text>
              <Text style={styles.twoColumnRight}>{item.description || item.plan_name}</Text>
            </View>
          ))}
        </View>

        {/* --- 3º INVESTIMENTO --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3º INVESTIMENTO</Text>
          
          {/* Tabela de Preços */}
          <View style={styles.table}>
            {/* Cabeçalho */}
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, styles.colService]}>SERVIÇO</Text>
              <Text style={[styles.tableHeaderCell, styles.colMonthly]}>MENSAL</Text>
              <Text style={[styles.tableHeaderCell, styles.colSetup]}>SETUP</Text>
            </View>

            {/* Itens */}
            {items.map(item => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colService]}>{item.service_name} ({item.plan_name})</Text>
                <Text style={[styles.tableCell, styles.colMonthly]}>R$ {item.monthly_fee.toFixed(2)}</Text>
                <Text style={[styles.tableCell, styles.colSetup]}>R$ {item.setup_fee.toFixed(2)}</Text>
              </View>
            ))}
          </View>

          {/* Bloco de Totais */}
          <View style={styles.totalsContainer}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Total Mensal:</Text>
              <Text style={styles.totalsValue}>R$ {totalMonthly.toFixed(2)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Total Setup:</Text>
              <Text style={styles.totalsValue}>R$ {totalSetup.toFixed(2)}</Text>
            </View>
            {discount > 0 && (
              <View style={styles.totalsRow}>
                <Text style={[styles.totalsLabel, { color: 'red' }]}>Desconto:</Text>
                <Text style={[styles.totalsValue, { color: 'red' }]}>- R$ {discount.toFixed(2)}</Text>
              </View>
            )}
            <View style={[styles.totalsRow, styles.totalsFinalRow]}>
              <Text style={styles.totalsFinalLabel}>Total Geral:</Text>
              <Text style={styles.totalsFinalValue}>R$ {finalTotal.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* --- RODAPÉ FIXO --- */}
        <View style={styles.footer} fixed>
          <Text 
            render={({ pageNumber, totalPages }) => (
              `PÁGINA ${pageNumber} de ${totalPages}`
            )}
          />
          <Text>contato@vierigroup.com | (48) 99999-9999</Text>
          <Text style={styles.footerLogo}>Vieri</Text>
        </View>
      </Page>
    </Document>
  );
};