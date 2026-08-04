const fs = require('fs');

const f1 = 'src/modules/reportes/components/ReportesDashboard.tsx';
let c1 = fs.readFileSync(f1, 'utf8');
c1 = c1.replace(/\\\$/g, '$').replace(/\\`/g, '`');
fs.writeFileSync(f1, c1);

const f2 = 'src/modules/reportes/utils/pdfGenerators.ts';
let c2 = fs.readFileSync(f2, 'utf8');
c2 = c2.replace(/\\\$/g, '$').replace(/\\`/g, '`');
fs.writeFileSync(f2, c2);
