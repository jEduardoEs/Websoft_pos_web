# Guia para generar y publicar el instalador .exe
# WebSoft POS System - WebSoft Solutions Guatemala

## PASO 1 - Subir cambios a GitHub
```
git add .
git commit -m "release: v1.0.0 - version estable"
git push
```

## PASO 2 - Generar el instalador en tu PC

Abre CMD en la carpeta del proyecto y ejecuta:
```
npm install
npm run build
```

Esto genera:
```
dist/
  POS System Setup 1.0.0.exe   <- Este es el instalador
```

## PASO 3 - Publicar en GitHub Releases

1. Ve a: https://github.com/jEduardoEs/websoft-pos/releases
2. Click "Draft a new release"
3. Tag version: v1.0.0
4. Release title: POS System v1.0.0
5. Descripcion:
   ```
   ## POS System v1.0.0 - Version estable
   
   ### Que incluye:
   - Sistema POS completo
   - Inventario con Kardex
   - Clientes con consulta NIT automatica
   - Proveedores y Compras
   - Codigos de descuento
   - Reportes profesionales
   - Backup automatico diario
   - Seguridad con contrasenas cifradas
   - Log de auditoria completo
   
   ### Instalacion:
   1. Descarga POS.System.Setup.1.0.0.exe
   2. Ejecuta como Administrador
   3. Sigue el asistente
   4. Acceso directo en Escritorio
   
   ### Credenciales iniciales:
   - admin / admin123
   - cajero / cajero123
   ```
6. Adjunta el archivo: dist/POS System Setup 1.0.0.exe
7. Click "Publish release"

## PASO 4 - Link de descarga permanente

Una vez publicado, el link de descarga directa sera:
```
https://github.com/jEduardoEs/websoft-pos/releases/latest/download/POS.System.Setup.1.0.0.exe
```

O la pagina de releases:
```
https://github.com/jEduardoEs/websoft-pos/releases
```

## PASO 5 - Para versiones futuras

Cuando hagas cambios:
1. Actualiza la version en package.json: "version": "1.0.1"
2. git add . && git commit -m "v1.0.1" && git push
3. npm run build
4. Publica nueva release en GitHub
