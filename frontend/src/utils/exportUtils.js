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

export function exportIncidentPDF(incident) {
  if (!incident) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate PDF report.');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Incident Report - #${incident.id}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; padding: 40px; line-height: 1.6; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #1e293b; display: flex; align-items: center; gap: 8px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-weight: 600; font-size: 13px; text-transform: uppercase; }
        .badge-critical { background: #fef2f2; color: #ef4444; border: 1px solid #fca5a5; }
        .badge-high { background: #fff7ed; color: #f97316; border: 1px solid #ffedd5; }
        .badge-medium { background: #fefce8; color: #eab308; border: 1px solid #fef08a; }
        .badge-low { background: #f0fdf4; color: #22c55e; border: 1px solid #bbf7d0; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 8px; }
        .label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
        .value { font-size: 15px; font-weight: 600; color: #0f172a; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 18px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px; }
        .risk-bar { background: #e2e8f0; height: 12px; border-radius: 6px; overflow: hidden; margin-top: 6px; }
        .risk-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #ef4444); border-radius: 6px; }
        .footer { margin-top: 50px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">🛡️ ThreatGuard SOC</div>
        <div>
          <span class="badge badge-${(incident.severity || 'low').toLowerCase()}">${incident.severity || 'LOW'} SEVERITY</span>
          <span class="badge" style="background: #e0f2fe; color: #0369a1; margin-left: 8px;">${incident.priority || 'P3'}</span>
        </div>
      </div>

      <h1 style="margin: 0 0 10px 0; font-size: 24px;">${incident.title}</h1>
      <p style="color: #64748b; margin-bottom: 25px;">Incident ID: #${incident.id} &bull; Generated on ${new Date().toLocaleString()}</p>

      <div class="grid">
        <div>
          <div class="label">Status</div>
          <div class="value">${incident.status}</div>
        </div>
        <div>
          <div class="label">Category</div>
          <div class="value">${incident.category}</div>
        </div>
        <div>
          <div class="label">Assigned Analyst</div>
          <div class="value">${incident.assignedToName || incident.assignedTo || 'Unassigned'} (${incident.department || 'SOC Team'})</div>
        </div>
        <div>
          <div class="label">Reported By</div>
          <div class="value">${incident.reportedBy || 'System'}</div>
        </div>
        <div>
          <div class="label">Location</div>
          <div class="value">${incident.location || 'N/A'}</div>
        </div>
        <div>
          <div class="label">Created Date</div>
          <div class="value">${new Date(incident.createdAt).toLocaleString()}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Risk Assessment Score: ${incident.riskScore || 0} / 100</div>
        <div class="risk-bar">
          <div class="risk-fill" style="width: ${Math.min(100, incident.riskScore || 0)}%;"></div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Incident Overview & Description</div>
        <p style="white-space: pre-wrap; font-size: 14px; background: #fff; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px;">${incident.description}</p>
      </div>

      ${incident.aiSummary ? `
      <div class="section">
        <div class="section-title">AI Security Summary</div>
        <p style="font-size: 14px; background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; padding: 16px; border-radius: 8px;">${incident.aiSummary}</p>
      </div>
      ` : ''}

      <div class="footer">
        Confidential Security Incident Report &bull; ThreatGuard Security Operations Center (SOC)
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
