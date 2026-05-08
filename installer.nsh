; installer.nsh - Personalización del instalador NSIS
; WebSoft Solutions Guatemala
; Fuerza instalacion en C:\Program Files (x86)\POS System

!macro preInit
  ; Forzar directorio de instalacion
  SetRegView 32
  WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "C:\Program Files (x86)\POS System"
  WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "C:\Program Files (x86)\POS System"
  SetRegView 64
  WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "C:\Program Files (x86)\POS System"
  WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "C:\Program Files (x86)\POS System"
!macroend

!macro customInstall
  ; Crear carpeta de datos del usuario
  CreateDirectory "$APPDATA\websoft-pos"
  
  ; Mensaje de credenciales
  DetailPrint "Instalacion completada."
  DetailPrint "Usuario: admin  |  Contrasena: admin123"
!macroend

!macro customUnInstall
  MessageBox MB_YESNO "Deseas eliminar los datos del sistema (base de datos y backups)?" IDNO end_uninstall
    RMDir /r "$APPDATA\websoft-pos"
  end_uninstall:
!macroend
