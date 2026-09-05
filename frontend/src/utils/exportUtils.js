import React from 'react';
import { pdf } from '@react-pdf/renderer';
import IncidentPdfDocument from '../components/IncidentPdfDocument';

/**
 * Utility functions for exporting incidents to PDF and CSV formats.
 */

export function exportIncidentsCSV(incidents) {
  if (!incidents || incidents.length === 0) return;

  const headers = ['ID', 'Title', 'Severity', 'Priority', 'Category', 'Status', 'Risk Score', 'Reported By', 'Assigned To', 'Created At'];
  
  const rows = incidents.map(inc => [
    `"${inc.id || ''}"`,
    `"${(inc.title || '').replaceAll('"', '""')}"`,
    `"${inc.severity || ''}"`,
    `"${inc.priority || ''}"`,
    `"${inc.category || ''}"`,
    `"${inc.status || ''}"`,
    inc.riskScore || 0,
    `"${inc.reportedBy || ''}"`,
    `"${inc.assignedToName || inc.assignedTo || 'Unassigned'}"`,
    `"${inc.createdAt ? new Date(inc.createdAt).toLocaleString() : ''}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `threat_incidents_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function exportIncidentsPDF(incidents, reportName = 'Incident Report') {
  if (!incidents || incidents.length === 0) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate PDF report.');
    return;
  }

  const rows = incidents.map(incident => `
    <tr>
      <td>${incident.id || ''}</td>
      <td>${incident.title || ''}</td>
      <td>${incident.severity || ''}</td>
      <td>${incident.status || ''}</td>
      <td>${incident.assignedToName || incident.assignedTo || 'Unassigned'}</td>
      <td>${incident.riskScore || 0}</td>
      <td>${incident.createdAt ? new Date(incident.createdAt).toLocaleString() : ''}</td>
    </tr>
  `).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${reportName}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; color: #1e293b; padding: 32px; }
        h1 { border-bottom: 2px solid #3b82f6; padding-bottom: 16px; }
        .meta { color: #64748b; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
        th { background: #e2e8f0; }
      </style>
    </head>
    <body>
      <h1>ThreatGuard SOC — ${reportName}</h1>
      <p class="meta">${incidents.length} incident(s) in the selected report scope &bull; Generated on ${new Date().toLocaleString()}</p>
      <table>
        <thead><tr><th>ID</th><th>Title</th><th>Severity</th><th>Status</th><th>Assigned To</th><th>Risk Score</th><th>Created At</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <script>window.onload = function() { window.print(); };</script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

export async function exportIncidentPDF(incident) {
  if (!incident) return;

  try {
    const blob = await pdf(React.createElement(IncidentPdfDocument, { incident })).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const sanitizedTitle = (incident.title || 'incident')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .slice(0, 30);

    link.download = `incident_report_${incident.id || 'export'}_${sanitizedTitle}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to generate PDF report:', error);
    alert('Failed to generate PDF report. Please try again.');
  }
}
