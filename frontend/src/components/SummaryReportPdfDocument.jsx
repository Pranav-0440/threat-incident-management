import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 8,
    marginBottom: 12,
  },
  logo: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  reportSubtitle: {
    fontSize: 8,
    color: '#64748b',
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 7,
    color: '#64748b',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  headerCell: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
    textTransform: 'uppercase',
  },
  colId: { width: '15%' },
  colTitle: { width: '32%' },
  colSeverity: { width: '11%' },
  colPriority: { width: '9%' },
  colStatus: { width: '13%' },
  colCategory: { width: '20%' },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 3,
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: '#94a3b8',
  },
});

const SEVERITY_COLORS = {
  CRITICAL: { backgroundColor: '#fee2e2', color: '#ef4444' },
  HIGH: { backgroundColor: '#ffedd5', color: '#ea580c' },
  MEDIUM: { backgroundColor: '#fef9c3', color: '#ca8a04' },
  LOW: { backgroundColor: '#dcfce7', color: '#16a34a' },
};

export default function SummaryReportPdfDocument({ incidents = [], reportTitle = 'SOC Summary Report' }) {
  const total = incidents.length;
  const criticalCount = incidents.filter(i => (i.severity || '').toUpperCase() === 'CRITICAL').length;
  const highCount = incidents.filter(i => (i.severity || '').toUpperCase() === 'HIGH').length;
  const openCount = incidents.filter(i => {
    const s = (i.status || '').toUpperCase();
    return s === 'OPEN' || s === 'INVESTIGATING';
  }).length;
  const resolvedCount = incidents.filter(i => {
    const s = (i.status || '').toUpperCase();
    return s === 'RESOLVED' || s === 'CLOSED';
  }).length;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>ThreatGuard SOC - {reportTitle}</Text>
            <Text style={styles.reportSubtitle}>
              Exported: {new Date().toLocaleString()} • Filtered Records: {total}
            </Text>
          </View>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{total}</Text>
            <Text style={styles.statLabel}>Total Incidents</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#ef4444' }]}>{criticalCount}</Text>
            <Text style={styles.statLabel}>Critical</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#ea580c' }]}>{highCount}</Text>
            <Text style={styles.statLabel}>High</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#2563eb' }]}>{openCount}</Text>
            <Text style={styles.statLabel}>Active (Open/Inv)</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#16a34a' }]}>{resolvedCount}</Text>
            <Text style={styles.statLabel}>Resolved / Closed</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.colId]}>Incident ID</Text>
            <Text style={[styles.headerCell, styles.colTitle]}>Title</Text>
            <Text style={[styles.headerCell, styles.colSeverity]}>Severity</Text>
            <Text style={[styles.headerCell, styles.colPriority]}>Priority</Text>
            <Text style={[styles.headerCell, styles.colStatus]}>Status</Text>
            <Text style={[styles.headerCell, styles.colCategory]}>Category</Text>
          </View>

          {incidents.slice(0, 45).map((inc, index) => {
            const sev = (inc.severity || 'LOW').toUpperCase();
            const sevStyle = SEVERITY_COLORS[sev] || SEVERITY_COLORS.LOW;
            return (
              <View key={inc.id || index} style={styles.tableRow} wrap={false}>
                <Text style={styles.colId}>{inc.id ? inc.id.substring(0, 14) : 'N/A'}</Text>
                <Text style={styles.colTitle} numberOfLines={1}>{inc.title || 'Untitled'}</Text>
                <View style={styles.colSeverity}>
                  <Text style={[styles.badge, sevStyle]}>{sev}</Text>
                </View>
                <Text style={styles.colPriority}>{inc.priority || 'P3'}</Text>
                <Text style={styles.colStatus}>{(inc.status || 'OPEN').replace('_', ' ')}</Text>
                <Text style={styles.colCategory} numberOfLines={1}>{(inc.category || 'N/A').replace('_', ' ')}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.footer} fixed>
          <Text>Confidential Security Operations Report • ThreatGuard SOC</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
