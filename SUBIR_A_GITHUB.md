# Cómo subir correctamente a GitHub

## El problema
GitHub tiene archivos viejos que Vercel sigue usando.
El error `./src/src/app/...` significa que hay carpetas duplicadas en GitHub.

## Solución — ejecuta esto en PowerShell desde la carpeta ws-pos-web:

```powershell
# Paso 1: Borra el repositorio local de git y empieza de cero
Remove-Item -Recurse -Force .git

# Paso 2: Inicializa git nuevo
git init
git branch -M main

# Paso 3: Conecta con tu repositorio
git remote add origin https://github.com/jEduardoEs/Websoft_pos_web.git

# Paso 4: Agrega todo
git add .
git commit -m "reset: estructura limpia v1.0"

# Paso 5: Fuerza el push (sobreescribe todo en GitHub)
git push --force origin main
```

## Esto hará que Vercel tome el código correcto.
