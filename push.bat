@echo off
cd /d E:\husepersonalizate.ro

echo.
echo  ========================================
echo   husepersonalizate.ro - Push to GitHub
echo  ========================================
echo.

echo  [*] Adaugare fisiere...
git add -A

echo  [*] Commit...
git commit -m "Update"

echo  [*] Push la GitHub...
git push origin main

echo.
echo  ========================================
echo   GATA! Fisierele au fost urcate.
echo   Vercel va face deploy automat.
echo  ========================================
pause
