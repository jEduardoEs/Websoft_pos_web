const fs = require('fs');
const path = 'src/app/(dashboard)/config/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Renombrar la funcion principal
content = content.replace('export default function ConfigPage()', 'export default function ConfiguracionModule()');

// Agregar el import del hook
content = content.replace("import { toast } from 'sonner'", "import { toast } from 'sonner'\nimport { useConfiguracion } from '../../hooks/use-configuracion'");

// Reemplazar la logica de estado por el hook
const stateStart = content.indexOf('  const [cfg, setCfg] = useState<Cfg>({})');
const saveEnd = content.indexOf('const inp = (k: string, placeholder?: string, type = \'text\') =>');

if (stateStart !== -1 && saveEnd !== -1) {
  const before = content.slice(0, stateStart);
  const after = content.slice(saveEnd);
  const hookInjection = `  const { cfg, loading, saved, asignando, resultadoAsignacion, setConfigValue: set, saveConfiguracion: save, asignarCodigos } = useConfiguracion();\n  const [activeTab, setActiveTab] = useState('empresa');\n\n  `;
  content = before + hookInjection + after;
}

fs.writeFileSync('src/modules/configuracion/components/ConfiguracionModule.tsx', content);
