// src/components/pdf/ProposalDocument.tsx
import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

// Estilos
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  clientInfo: {
    fontSize: 12,
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: '#f0f0f0',
    padding: 5,
    marginBottom: 10,
  },
  serviceItem: {
    marginBottom: 10,
  },
  serviceName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  serviceDescription: {
    fontSize: 10,
    marginBottom: 3,
  },
  investmentTable: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#cccccc',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    paddingVertical: 5,
  },
  tableHeader: {
    width: '70%',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tableCell: {
    width: '30%',
    fontSize: 12,
    textAlign: 'right',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    fontWeight: 'bold',
  }
});

// Tipagem das props
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

export const ProposalDocument: React.FC<ProposalDocumentProps> = ({ proposalData, clientData, items }) => {
  const totalMonthly = items.reduce((sum, item) => sum + item.monthly_fee, 0);
  const totalSetup = items.reduce((sum, item) => sum + item.setup_fee, 0);
  const discount = proposalData.discount_value || 0;
  const finalTotal = totalMonthly + totalSetup - discount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho */}
        <Text style={styles.title}>Proposta Comercial</Text>
        <Text style={styles.clientInfo}>Cliente: {clientData.name}{clientData.company ? ` - ${clientData.company}` : ''}</Text>
        <Text style={styles.clientInfo}>Data: {new Date(proposalData.created_at).toLocaleDateString('pt-BR')}</Text>

        {/* Introdução */}
        <Text style={styles.sectionTitle}>1º Introdução</Text>
        <Text style={{ fontSize: 10, marginBottom: 15 }}>
          A Vieri Group é uma empresa de marketing e tecnologia focada em soluções personalizadas para cada cliente, visando resultados tangíveis e estratégicos.
        </Text>

        {/* Serviços */}
        <Text style={styles.sectionTitle}>2º Serviços e Benefícios</Text>
        {items.map(item => (
          <View key={item.id} style={styles.serviceItem}>
            <Text style={styles.serviceName}>{item.service_name}</Text>
            <Text style={styles.serviceDescription}>{item.description || item.plan_name}</Text>
            <Text style={styles.serviceDescription}>Prazo de Entrega: {item.delivery_time_days} dias</Text>
          </View>
        ))}

        {/* Investimento */}
        <Text style={styles.sectionTitle}>3º Investimento</Text>
        <View style={styles.investmentTable}>
          {/* Cabeçalho */}
          <View style={styles.tableRow}>
            <Text style={styles.tableHeader}>Serviço</Text>
            <Text style={styles.tableCell}>Mensal</Text>
          </View>

          {/* Itens */}
          {items.map(item => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={{ ...styles.tableHeader, fontWeight: 'normal' }}>{item.service_name} ({item.plan_name})</Text>
              <Text style={styles.tableCell}>R$ {item.monthly_fee.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Totais */}
        <View style={{ marginTop: 10 }}>
          <View style={styles.totalsRow}>
            <Text>Total Mensal:</Text>
            <Text>R$ {totalMonthly.toFixed(2)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>Setup:</Text>
            <Text>R$ {totalSetup.toFixed(2)}</Text>
          </View>
          {discount > 0 && (
            <View style={styles.totalsRow}>
              <Text>Desconto:</Text>
              <Text>- R$ {discount.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.totalsRow}>
            <Text>Total Final:</Text>
            <Text>R$ {finalTotal.toFixed(2)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
