const fs = require('fs');
let c = fs.readFileSync('src/components/dashboard/DashboardPageClient.tsx', 'utf8');
c = c.replace(/export default function DashboardPageClient/g, 'export default function DashboardModule');
c = c.replace(/import \{ useState, useEffect \} from 'react'/g, `import { useDashboard } from '../hooks/use-dashboard'`);
c = c.replace(/const \[data, setData\] = useState<any>\(null\)/, `const { data, loading } = useDashboard()`);
c = c.replace(/useEffect\(\(\) => \{\n\s*fetch\('\/api\/dashboard'\)\.then\(r => r\.json\(\)\)\.then\(setData\)\n\s*\}, \[\]\)/, '');
c = c.replace(/if \(!data\)/, 'if (loading || !data)');
fs.writeFileSync('src/modules/dashboard/components/DashboardModule.tsx', c);
