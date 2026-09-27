import React from 'react';
import { pdf } from '@react-pdf/renderer';
import IncidentPdfDocument from '../components/IncidentPdfDocument';

/**
 * Utility functions for exporting incidents to PDF and CSV formats.
 */

const sanitizeCsvField = (val) => {
  let str = String(val ?? '');
  // Mitigate CSV Formula Injection (CWE-1236)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  return `"${str.replaceAll('"', '""')}"`;
};

export function exportIncidentsCSV(incidents) {
  if (!incidents || incidents.length === 0) return;

  const headers = ['ID', 'Title', 'Severity', 'Priority', 'Category', 'Status', 'Risk Score', 'Reported By', 'Assigned To', 'Created At'];
  
  const rows = incidents.map(inc => [
    sanitizeCsvField(inc.id),
    sanitizeCsvField(inc.title),
    sanitizeCsvField(inc.severity),
    sanitizeCsvField(inc.priority),
    sanitizeCsvField(inc.category),
    sanitizeCsvField(inc.status),
    inc.riskScore || 0,
    sanitizeCsvField(inc.reportedBy),
    sanitizeCsvField(inc.assignedToName || inc.assignedTo || 'Unassigned'),
    sanitizeCsvField(inc.createdAt ? new Date(inc.createdAt).toLocaleString() : '')
  ]);

  const csvContent = headers.join(',') + '\n' + rows.map(e => e.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `threat_incidents_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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
