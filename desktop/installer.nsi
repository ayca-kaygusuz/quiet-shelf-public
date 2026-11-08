Unicode true
!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "x64.nsh"

Name "Quiet Shelf"
OutFile "${OUTPUT_FILE}"
InstallDir "$LOCALAPPDATA\Programs\Quiet Shelf"
InstallDirRegKey HKCU "Software\QuietShelf" "InstallDir"
RequestExecutionLevel user
SetCompressor /SOLID lzma
SetCompressorDictSize 32
VIProductVersion "${APP_VERSION}.0"
VIAddVersionKey /LANG=1033 "ProductName" "Quiet Shelf"
VIAddVersionKey /LANG=1033 "FileDescription" "Quiet Shelf installer"
VIAddVersionKey /LANG=1033 "FileVersion" "${APP_VERSION}"
VIAddVersionKey /LANG=1033 "LegalCopyright" "Quiet Shelf contributors"
!define MUI_ICON "${APP_ICON}"
!define MUI_UNICON "${APP_ICON}"
!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_RUN "$INSTDIR\Quiet Shelf.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Open Quiet Shelf"
!insertmacro MUI_PAGE_WELCOME
!define MUI_PAGE_CUSTOMFUNCTION_LEAVE CheckInstallDirectory
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"

Function CheckInstallDirectory
  IfFileExists "$INSTDIR\quiet-shelf.install" allowed
  ClearErrors
  FindFirst $0 $1 "$INSTDIR\*"
  ${IfNot} ${Errors}
    check_next:
    ${If} $1 != "."
    ${AndIf} $1 != ".."
      FindClose $0
      MessageBox MB_OK|MB_ICONEXCLAMATION "Choose an empty folder or an existing Quiet Shelf installation folder."
      Abort
    ${EndIf}
    ClearErrors
    FindNext $0 $1
    ${IfNot} ${Errors}
      Goto check_next
    ${EndIf}
    FindClose $0
  ${EndIf}
  allowed:
FunctionEnd

Function .onInit
  ${IfNot} ${RunningX64}
    MessageBox MB_OK|MB_ICONSTOP "This installer needs 64-bit Windows."
    Abort
  ${EndIf}
  SetShellVarContext current
  FindWindow $0 "Chrome_WidgetWin_1" "Quiet Shelf"
  ${If} $0 != 0
    MessageBox MB_OK|MB_ICONINFORMATION "Close Quiet Shelf, then run this installer again."
    Abort
  ${EndIf}
FunctionEnd

Section "Install"
  Call CheckInstallDirectory
  SetShellVarContext current
  SetOutPath "$INSTDIR"
  File /r "${APP_DIR}\*.*"
  FileOpen $0 "$INSTDIR\quiet-shelf.install" w
  FileWrite $0 "com.quietshelf.desktop"
  FileClose $0
  WriteUninstaller "$INSTDIR\Uninstall Quiet Shelf.exe"
  CreateDirectory "$SMPROGRAMS\Quiet Shelf"
  CreateShortcut "$SMPROGRAMS\Quiet Shelf\Quiet Shelf.lnk" "$INSTDIR\Quiet Shelf.exe"
  CreateShortcut "$DESKTOP\Quiet Shelf.lnk" "$INSTDIR\Quiet Shelf.exe"
  WriteRegStr HKCU "Software\QuietShelf" "InstallDir" "$INSTDIR"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\QuietShelf" "DisplayName" "Quiet Shelf"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\QuietShelf" "DisplayVersion" "${APP_VERSION}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\QuietShelf" "Publisher" "Quiet Shelf contributors"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\QuietShelf" "DisplayIcon" "$INSTDIR\Quiet Shelf.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\QuietShelf" "UninstallString" '$\"$INSTDIR\Uninstall Quiet Shelf.exe$\"'
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\QuietShelf" "QuietUninstallString" '$\"$INSTDIR\Uninstall Quiet Shelf.exe$\" /S'
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\QuietShelf" "NoModify" 1
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\QuietShelf" "NoRepair" 1
SectionEnd

Function un.onInit
  SetShellVarContext current
  FindWindow $0 "Chrome_WidgetWin_1" "Quiet Shelf"
  ${If} $0 != 0
    MessageBox MB_OK|MB_ICONINFORMATION "Close Quiet Shelf, then uninstall it again."
    Abort
  ${EndIf}
FunctionEnd

Section "Uninstall"
  SetShellVarContext current
  Delete "$DESKTOP\Quiet Shelf.lnk"
  Delete "$SMPROGRAMS\Quiet Shelf\Quiet Shelf.lnk"
  RMDir "$SMPROGRAMS\Quiet Shelf"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\QuietShelf"
  DeleteRegKey HKCU "Software\QuietShelf"
  ; Remove application binaries only. The separate app-data profile is preserved.
  !include "${UNINSTALL_FILES}"
  Delete "$INSTDIR\quiet-shelf.install"
  Delete "$INSTDIR\Uninstall Quiet Shelf.exe"
  RMDir "$INSTDIR"
SectionEnd
