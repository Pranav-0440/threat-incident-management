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
    `"${(inc.title || '').replace(/"/g, '""')}"`,
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
  document.body.removeChild(link);
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
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to generate PDF report:', error);
    alert('Failed to generate PDF report. Please try again.');
  }
}
