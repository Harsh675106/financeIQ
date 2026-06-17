# PowerShell script to install ML service dependencies
# Run this from ml-service directory

Write-Host "Installing ML Service Dependencies..." -ForegroundColor Green

# Check if venv exists
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate venv
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& "venv\Scripts\Activate.ps1"

# Upgrade pip
Write-Host "Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip setuptools wheel

# Install numpy first (often causes issues)
Write-Host "Installing numpy..." -ForegroundColor Yellow
python -m pip install numpy --upgrade

# Install other packages
Write-Host "Installing other dependencies..." -ForegroundColor Yellow
python -m pip install fastapi uvicorn[standard] pydantic pandas scikit-learn scipy joblib python-multipart python-dotenv

Write-Host "Installation complete!" -ForegroundColor Green
Write-Host "Run: python app.py" -ForegroundColor Cyan
