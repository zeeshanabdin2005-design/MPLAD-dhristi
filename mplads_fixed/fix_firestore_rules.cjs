const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

const newRules = `
    match /documents/{documentId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn();
    }
    match /images/{imageId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn();
    }
    match /verificationCases/{caseId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn();
    }
    match /auditLogs/{logId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if false; // Audit logs should be immutable
    }
`;

rules = rules.replace(
  "match /riskAssessments/{projectId} {",
  newRules + "\n    match /riskAssessments/{projectId} {"
);

fs.writeFileSync('firestore.rules', rules);
