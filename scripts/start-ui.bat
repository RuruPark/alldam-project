@echo off
setlocal
cd /d "%~dp0.."
set CONDA_EXE=C:\Users\user\anaconda3\Scripts\conda.exe
if "%PORT%"=="" set PORT=8000
if not exist "%CONDA_EXE%" (
  echo Anaconda conda.exe not found: %CONDA_EXE%
  echo Open Anaconda Prompt and run: conda activate alldam
  exit /b 1
)
echo Starting Alldam UI at http://localhost:%PORT%
"%CONDA_EXE%" run -n alldam python -m http.server %PORT%
