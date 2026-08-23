import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 9,
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
    paddingBottom: 10,
    marginBottom: 14,
  },
  logo: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  title: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 8,
    color: '#64748b',
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 6,
    marginBottom: 14,
  },
  gridItem: {
    width: '50%',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 7,
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 2,
    fontFamily: 'Helvetica-Bold',
  },
  fieldValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 3,
    marginBottom: 6,
  },
  contentBox: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 8,
    lineHeight: 1.4,
  },
  aiBox: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    color: '#1e40af',
    fontSize: 8,
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: '#94a3b8',
  },
});

export default function IncidentPdfDocument({ incident = {} }) {
  const severity = (incident.severity || 'LOW').toUpperCase();
  const priority = (incident.priority || 'P3').toUpperCase();
  const status = (incident.status || 'OPEN').replace(/_/g, ' ');
  const riskScore = incident.riskScore ?? 0;
  const createdDate = incident.createdAt
    ? new Date(incident.createdAt).toLocaleString()
    : 'N/A';

  const severityStyle = {
    backgroundColor:
      severity === 'CRITICAL' ? '#fee2e2' :
      severity === 'HIGH' ? '#ffedd5' :
      severity === 'MEDIUM' ? '#fef9c3' : '#dcfce7',
    color:
      severity === 'CRITICAL' ? '#ef4444' :
      severity === 'HIGH' ? '#ea580c' :
      severity === 'MEDIUM' ? '#ca8a04' : '#16a34a',
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* 1. Header Banner */}
        <View style={styles.header}>
          <Text style={styles.logo}>ThreatGuard SOC - Executive Report</Text>
          <View style={styles.badgeRow}>
            <Text style={[styles.badge, severityStyle]}>{severity} SEVERITY</Text>
            <Text style={[styles.badge, { backgroundColor: '#e0f2fe', color: '#0369a1' }]}>{priority}</Text>
          </View>
        </View>

        {/* 2. Title & ID */}
        <Text style={styles.title}>{incident.title || 'Untitled Incident'}</Text>
        <Text style={styles.subtitle}>
          Incident ID: #{incident.id || 'N/A'} • Generated: {new Date().toLocaleString()}
        </Text>

        {/* 3. Metadata Grid */}
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={styles.fieldLabel}>Status</Text>
            <Text style={styles.fieldValue}>{status}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.fieldLabel}>Category</Text>
            <Text style={styles.fieldValue}>{(incident.category || 'N/A').replace(/_/g, ' ')}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.fieldLabel}>Assigned Analyst</Text>
            <Text style={styles.fieldValue}>
              {incident.assignedToName || incident.assignedTo || 'Unassigned'} ({incident.department || 'SOC Team'})
            </Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.fieldLabel}>Reported By</Text>
            <Text style={styles.fieldValue}>{incident.reportedBy || 'System'}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.fieldLabel}>Location</Text>
            <Text style={styles.fieldValue}>{incident.location || 'Not Specified'}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.fieldLabel}>Created Date</Text>
            <Text style={styles.fieldValue}>{createdDate}</Text>
          </View>
        </View>

        {/* 4. Risk Assessment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Risk Assessment Score: {riskScore} / 100</Text>
          <View style={styles.contentBox}>
            <Text>
              Assessed Risk Level: {riskScore >= 70 ? 'CRITICAL' : riskScore >= 50 ? 'HIGH' : riskScore >= 30 ? 'MEDIUM' : 'LOW'}
            </Text>
          </View>
        </View>

        {/* 5. Incident Overview & Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Incident Overview & Description</Text>
          <View style={styles.contentBox}>
            <Text>{incident.description || 'No detailed description provided.'}</Text>
          </View>
        </View>

        {/* 6. AI Security Summary */}
        {incident.aiSummary ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Executive Analysis</Text>
            <View style={styles.aiBox}>
              <Text>{incident.aiSummary}</Text>
            </View>
          </View>
        ) : null}

        {/* 7. Footer */}
        <View style={styles.footer} fixed>
          <Text>Confidential Security Incident Report • ThreatGuard Security Operations Center (SOC)</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
