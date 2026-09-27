const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

code = code.replace(
  "alert('Import failed. Please check the console for details.');",
  "alert(`Import failed: ${err?.message || 'Check console for details.'}`);"
);

code = code.replace(
  "alert('Risk engine calculation failed.');",
  "alert(`Risk engine calculation failed: ${err?.message || 'Check console.'}`);"
);

fs.writeFileSync('src/pages/Settings.tsx', code);
