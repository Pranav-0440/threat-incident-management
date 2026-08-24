const TECHNIQUES = {
  phishing: {
    id: 'T1566',
    name: 'Phishing',
    tactic: 'Initial Access',
    sourceUrl: 'https://attack.mitre.org/techniques/T1566/',
    evidence: /phish|malicious email|suspicious email/i,
    checklist: [
      'Preserve the original message, headers, links, and attachments.',
      'Detonate links or files in an isolated analysis environment.',
      'Search mail and proxy telemetry for other recipients or clicks.',
      'Contain affected accounts and reset exposed credentials.'
    ]
  },
  spearphishingAttachment: {
    id: 'T1566.001',
    name: 'Spearphishing Attachment',
    tactic: 'Initial Access',
    sourceUrl: 'https://attack.mitre.org/techniques/T1566/001/',
    evidence: /phish|malicious email|suspicious email/i,
    specificEvidence: /attachment|attached|document|invoice/i,
    checklist: [
      'Hash and quarantine the attachment across mailboxes and endpoints.',
      'Inspect the attachment in a sandbox and record observed behavior.',
      'Identify recipients, execution events, and persistence indicators.'
    ]
  },
  spearphishingLink: {
    id: 'T1566.002',
    name: 'Spearphishing Link',
    tactic: 'Initial Access',
    sourceUrl: 'https://attack.mitre.org/techniques/T1566/002/',
    evidence: /phish|malicious email|suspicious email/i,
    specificEvidence: /link|url|click|redirect/i,
    checklist: [
      'Extract and safely analyze every URL and redirect in the message.',
      'Search DNS, proxy, and endpoint telemetry for matching indicators.',
      'Block confirmed malicious domains and reset affected credentials.'
    ]
  },
  passwordSpraying: {
    id: 'T1110.003',
    name: 'Password Spraying',
    tactic: 'Credential Access',
    sourceUrl: 'https://attack.mitre.org/techniques/T1110/003/',
    evidence: /password spray|password spraying/i,
    checklist: [
      'Identify targeted accounts, source addresses, and authentication providers.',
      'Block or rate-limit abusive sources and enforce MFA where available.',
      'Review successful logins and reset credentials for affected accounts.'
    ]
  },
  credentialStuffing: {
    id: 'T1110.004',
    name: 'Credential Stuffing',
    tactic: 'Credential Access',
    sourceUrl: 'https://attack.mitre.org/techniques/T1110/004/',
    evidence: /credential stuff|credential reuse|breach dump/i,
    checklist: [
      'Correlate failed and successful logins across accounts and services.',
      'Force resets for confirmed exposed credentials and require MFA.',
      'Preserve authentication logs for affected accounts and source networks.'
    ]
  },
  bruteForce: {
    id: 'T1110',
    name: 'Brute Force',
    tactic: 'Credential Access',
    sourceUrl: 'https://attack.mitre.org/techniques/T1110/',
    evidence: /brute force|repeated login|multiple login attempt|password guess/i,
    checklist: [
      'Quantify attempts by account, source, service, and time window.',
      'Apply account protection, rate limiting, and MFA controls.',
      'Investigate any successful authentication after the attack sequence.'
    ]
  },
  dataEncryptedImpact: {
    id: 'T1486',
    name: 'Data Encrypted for Impact',
    tactic: 'Impact',
    sourceUrl: 'https://attack.mitre.org/techniques/T1486/',
    evidence: /ransomware|encrypted files?|data encryption|locked files?|decrypt/i,
    checklist: [
      'Isolate affected hosts and preserve volatile evidence where practical.',
      'Identify encryption scope, impacted shares, and the initial access path.',
      'Protect backups and begin recovery only after containment is verified.'
    ]
  }
};

function textFor(incident) {
  return `${incident.title || ''} ${incident.description || ''} ${incident.category || ''}`;
}

export function mapIncidentToMitre(incident) {
  const evidenceText = textFor(incident);
  const techniques = [];

  Object.values(TECHNIQUES).forEach((technique) => {
    if (!technique.evidence.test(evidenceText)) return;
    if (technique.specificEvidence && !technique.specificEvidence.test(evidenceText)) return;
    techniques.push({
      id: technique.id,
      name: technique.name,
      tactic: technique.tactic,
      sourceUrl: technique.sourceUrl,
      evidence: `Matched incident text for ${technique.name}.`
    });
  });

  const checklist = techniques.length > 0
    ? [...new Set(techniques.flatMap((technique) => {
      const definition = Object.values(TECHNIQUES).find((item) => item.id === technique.id);
      return definition?.checklist || [];
    }))]
    : [
      'Preserve incident evidence and record the analyst’s confidence and assumptions.',
      'Correlate identity, endpoint, network, and cloud telemetry before assigning a technique.',
      'Escalate uncertain mappings for peer review rather than treating them as confirmed.'
    ];

  return {
    incidentId: incident.id,
    incidentTitle: incident.title || 'Untitled incident',
    mappingMode: 'deterministic-evidence-match',
    techniques,
    checklist
  };
}

export function buildMitrePlaybook(incidents) {
  const target = [...incidents]
    .sort((left, right) => (right.riskScore || 0) - (left.riskScore || 0))[0];
  return target ? mapIncidentToMitre(target) : {
    incidentId: null,
    incidentTitle: null,
    mappingMode: 'deterministic-evidence-match',
    techniques: [],
    checklist: ['Load an incident before generating a technique mapping.']
  };
}
