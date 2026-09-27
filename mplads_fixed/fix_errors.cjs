const fs = require('fs');

// Fix ProjectDetail
let pd = fs.readFileSync('src/pages/ProjectDetail.tsx', 'utf8');
pd = pd.replace(
  "Plus, History, User, Activity, MapPin, Search",
  "Plus, History, User, Activity, MapPin, Search, ArrowRight"
);
fs.writeFileSync('src/pages/ProjectDetail.tsx', pd);

// Fix GisIntelligence
let gis = fs.readFileSync('src/pages/GisIntelligence.tsx', 'utf8');
gis = gis.replace(
  "import { Map, MapPin, Layers, Filter, Maximize2, AlertTriangle, Loader2 } from 'lucide-react';",
  "import { Map as MapIcon, MapPin, Layers, Filter, Maximize2, AlertTriangle, Loader2 } from 'lucide-react';"
);
gis = gis.replace(
  "<Map className=\"h-8 w-8 text-emerald-600\" />",
  "<MapIcon className=\"h-8 w-8 text-emerald-600\" />"
);
fs.writeFileSync('src/pages/GisIntelligence.tsx', gis);
