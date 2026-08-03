# CLIENT_SERVER_RULES.md - REGLAS DE FRONTERA CLIENTE / SERVIDOR

## 1. CÓDIGO DEL CLIENTE ('use client')
- Componentes visuales (`views/`, `components/`, `src/ui/`).
- Custom Hooks (`hooks/`, `src/shared/hooks/`).
- ViewModels y manejadores de estado de presentación (`viewmodels/`).
- Clientes HTTP (`services/`).
- **Restricción**: Jamás importar `@prisma/client`, variables secretas del backend ni secretos de encriptación.

## 2. CÓDIGO DEL SERVIDOR (Server Side / Node.js)
- Handlers de la API REST (`src/app/api/`).
- Repositorios de datos (`repositories/`).
- Conexión Prisma (`src/core/database/`).
- Integraciones secretas (Llaves privadas de FEL, Stripe Secret Key, Resend API Key).
- **Restricción**: Jamás importar componentes visuales de React ni hooks de cliente.

## 3. CÓDIGO COMPARTIDO (Isomórfico)
- Dominio y Casos de Uso (`logic/`).
- DTOs, Mappers y Validadores Zod (`dto/`, `mappers/`, `validators/`).
- Utilidades y formateadores puros (`src/shared/utils/`, `formatters/`).
- Tipos de TypeScript (`types/`).
