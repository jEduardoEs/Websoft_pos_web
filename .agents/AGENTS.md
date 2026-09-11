# Golden Rules for WebSoft POS

- **NO EMOJIS**: Under no circumstances should emojis be used in the source code (UI text, comments, variables, or console logs). Take this as a golden rule.
- **NO ALTERAR EL DISEÑO DEL POS**: No alterar de ninguna manera el diseño visual, componentes, distribución o estilos del POS (Nueva Venta / Punto de Venta), a menos que el usuario lo solicite explícitamente. Bajo ninguna circunstancia modificar el POS por cuenta propia.
- **NO PARCHES SUPERFICIALES NI DEUDA TÉCNICA**: Bajo ninguna circunstancia realizar parches superficiales, enmascarar errores o implementar soluciones temporales. Siempre implementar soluciones reales, robustas, profesionales y de arquitectura limpia que no generen deuda técnica.
- **NO HARDCODEAR/QUEMAR INFORMACIÓN SENSIBLE O VALIOSA**: Jamás quemar (hardcodear) en el código fuente credenciales, llaves API, tokens, contraseñas, NITs corporativos fijos ni información sensible o valiosa. Toda información sensible debe ser leída dinámicamente desde variables de entorno (.env) o desde la configuración de base de datos (`config`).


