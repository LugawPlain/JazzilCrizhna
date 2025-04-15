@echo off
echo ====================================
echo Portfolio Images Data Update Utility
echo ====================================
echo.
echo This will scan your public/categories folders and update the images-data.json file.
echo Each category folder should contain numbered image files (e.g., 1.webp, 2.webp, etc.)
echo.
echo Press any key to continue or CTRL+C to cancel...
pause > nul

npm run update-images

echo.
echo Process completed!
echo.
pause 