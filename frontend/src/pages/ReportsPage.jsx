import { useState, useEffect } from 'react';
import { incidentsAPI } from '../api/client';
import { exportIncidentPDF, exportIncidentsCSV } from '../utils/exportUtils';
import { FileText, Download, Filter, Calendar, Shield, Users, FileSpreadsheet } from 'lucide-react';

export default function ReportsPage() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('incident'); // incident, weekly, monthly, analyst
  const [selectedAnalyst, setSelectedAnalyst] = useState('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const res = await incidentsAPI.getAll();
        if (isMounted) setIncidents(res.data || []);
      } catch (err) {
        console.error('Failed to load incidents for reports:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, []);

  const filteredIncidents = incidents.filter(i => {
    if (selectedSeverity !== 'ALL' && i.severity !== selectedSeverity) return false;
    if (selectedAnalyst !== 'ALL' && i.assignedTo !== selectedAnalyst) return false;
    return true;
  });

  const handleExportPDF = () => {
    if (filteredIncidents.length === 0) return alert('No incidents match the selected report filter.');
    exportIncidentPDF(filteredIncidents[0]);
  };

  const handleExportCSV = () => {
    if (filteredIncidents.length === 0) return alert('No incidents match the selected report filter.');
    exportIncidentsCSV(filteredIncidents);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
        <h1>Reports & Export Center</h1>
        <p>Generate, filter, and export executive incident reports, weekly summaries, and analyst performance metrics</p>
      </div>

      {/* Report Type Selector Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-6)' }}>
        {[
          { id: 'incident', label: 'Incident Summaries', icon: FileText },
          { id: 'weekly', label: 'Weekly SOC Report', icon: Calendar },
          { id: 'monthly', label: 'Monthly Executive Overview', icon: Shield },
          { id: 'analyst', label: 'Analyst Performance Report', icon: Users },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setReportType(id)}
            className={`btn ${reportType === id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* Filters Toolbar */}
      <div className="card" style={{ marginBottom: 'var(--space-6)', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} style={{ color: '#60a5fa' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>Report Filters:</span>
          </div>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="form-select"
            style={{ width: 'auto', padding: '6px 32px 6px 12px', fontSize: '13px' }}
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Only</option>
            <option value="MEDIUM">Medium Only</option>
            <option value="LOW">Low Only</option>
          </select>

          <select
            value={selectedAnalyst}
            onChange={(e) => setSelectedAnalyst(e.target.value)}
            className="form-select"
            style={{ width: 'auto', padding: '6px 32px 6px 12px', fontSize: '13px' }}
          >
            <option value="ALL">All Assigned Analysts</option>
            {Array.from(new Set(incidents.map(i => i.assignedTo).filter(Boolean))).map(analyst => (
              <option key={analyst} value={analyst}>{analyst}</option>
            ))}
          </select>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
              <FileSpreadsheet size={14} /> Export CSV / Excel
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleExportPDF}>
              <Download size={14} /> Download PDF Report
            </button>
          </div>
        </div>
      </div>

      {/* Report Records Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '14px', color: '#f8fafc' }}>
            Matching Report Records ({filteredIncidents.length})
          </span>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Report Format: {reportType.toUpperCase()}
          </span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
              <th style={{ padding: '14px 16px', fontSize: '12px', color: '#94a3b8' }}>INCIDENT</th>
              <th style={{ padding: '14px 16px', fontSize: '12px', color: '#94a3b8' }}>SEVERITY</th>
              <th style={{ padding: '14px 16px', fontSize: '12px', color: '#94a3b8' }}>STATUS</th>
              <th style={{ padding: '14px 16px', fontSize: '12px', color: '#94a3b8' }}>ASSIGNED TO</th>
              <th style={{ padding: '14px 16px', fontSize: '12px', color: '#94a3b8' }}>RISK SCORE</th>
              <th style={{ padding: '14px 16px', fontSize: '12px', color: '#94a3b8', textAlign: 'right' }}>EXPORT</th>
            </tr>
          </thead>
          <tbody>
            {filteredIncidents.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                  No incidents match the active report criteria.
                </td>
              </tr>
            ) : (
              filteredIncidents.map((i) => (
                <tr key={i.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#f8fafc', fontSize: '13px' }}>{i.title}</td>
                  <td style={{ padding: '14px 16px', fontSize: '12px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 700,
                      backgroundColor: i.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(249, 115, 22, 0.2)',
                      color: i.severity === 'CRITICAL' ? '#ef4444' : '#f97316'
                    }}>
                      {i.severity}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '12px', color: '#60a5fa' }}>{i.status}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#cbd5e1' }}>{i.assignedTo || 'Unassigned'}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: i.riskScore >= 70 ? '#ef4444' : '#3b82f6' }}>{i.riskScore}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => exportIncidentPDF(i)} style={{ padding: '4px 8px', fontSize: '11px' }}>
                      <Download size={12} /> PDF
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
