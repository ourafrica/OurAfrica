<#
Virtual Varsity Installation Script for Windows
Fully automated setup for non-technical users
#>

param(
    [switch]$SkipNodeCheck = $false
)

# Set error handling
$ErrorActionPreference = "Stop"

# Colors for output
function Write-Success { param($Message) Write-Host $Message -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host $Message -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host $Message -ForegroundColor Red }
function Write-Info { param($Message) Write-Host $Message -ForegroundColor Cyan }

Write-Info "=== Virtual Varsity Setup Script ==="
Write-Info "This script will automatically set up your Virtual Varsity project."
Write-Host ""

# Check PowerShell execution policy
$executionPolicy = Get-ExecutionPolicy
if ($executionPolicy -eq "Restricted") {
    Write-Warning "PowerShell execution policy is restricted. Attempting to change it temporarily..."
    try {
        Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
        Write-Success "Execution policy updated successfully."
    }
    catch {
        Write-Error "Failed to update execution policy. Please run PowerShell as Administrator and try again."
        exit 1
    }
}

# Function to download and install Node.js directly
function Install-NodeJS {
    Write-Info "Downloading Node.js installer..."
    
    $nodeVersion = "18.19.0"
    $nodeUrl = "https://nodejs.org/dist/v$nodeVersion/node-v$nodeVersion-x64.msi"
    $installerPath = "$env:TEMP\nodejs-installer.msi"
    
    try {
        # Download Node.js installer
        $webClient = New-Object System.Net.WebClient
        $webClient.DownloadFile($nodeUrl, $installerPath)
        Write-Success "Node.js installer downloaded successfully."
        
        # Install Node.js silently
        Write-Info "Installing Node.js... (this may take a few minutes)"
        $installProcess = Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$installerPath`" /quiet /norestart" -Wait -PassThru
        
        if ($installProcess.ExitCode -eq 0) {
            Write-Success "Node.js installed successfully."
            
            # Refresh environment variables
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
            
            # Clean up installer
            Remove-Item $installerPath -Force -ErrorAction SilentlyContinue
            return $true
        }
        else {
            Write-Error "Node.js installation failed with exit code: $($installProcess.ExitCode)"
            return $false
        }
    }
    catch {
        Write-Error "Failed to download or install Node.js: $($_.Exception.Message)"
        return $false
    }
}

# Check if Node.js is installed
if (-not $SkipNodeCheck) {
    Write-Info "Checking for Node.js installation..."
    
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Warning "Node.js is not installed."
        
        # Try Chocolatey first (faster if available)
        if (Get-Command choco -ErrorAction SilentlyContinue) {
            Write-Info "Installing Node.js using Chocolatey..."
            try {
                choco install nodejs --version=18.19.0 -y
                # Refresh PATH
                $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
            }
            catch {
                Write-Warning "Chocolatey installation failed. Trying direct download..."
                if (-not (Install-NodeJS)) {
                    exit 1
                }
            }
        }
        else {
            # Direct download and install
            if (-not (Install-NodeJS)) {
                Write-Error "All Node.js installation methods failed."
                Write-Info "Please manually install Node.js from: https://nodejs.org/"
                exit 1
            }
        }
    }
    
    # Wait a moment for PATH to update
    Start-Sleep -Seconds 2
    
    # Verify Node.js installation
    $maxRetries = 5
    $retryCount = 0
    $nodeInstalled = $false
    
    while ($retryCount -lt $maxRetries -and -not $nodeInstalled) {
        if (Get-Command node -ErrorAction SilentlyContinue) {
            $nodeInstalled = $true
        }
        else {
            $retryCount++
            Write-Info "Waiting for Node.js to be available... (attempt $retryCount/$maxRetries)"
            Start-Sleep -Seconds 3
            # Refresh PATH again
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        }
    }
    
    if (-not $nodeInstalled) {
        Write-Error "Node.js installation verification failed. Please restart your command prompt and try again."
        exit 1
    }
    
    # Check Node.js version
    try {
        $nodeVersionOutput = node -v
        $nodeVersion = $nodeVersionOutput.Substring(1).Split('.')[0]
        if ([int]$nodeVersion -lt 18) {
            Write-Error "Node.js version 18 or higher is required. Found version $nodeVersion"
            Write-Info "Please update Node.js from: https://nodejs.org/"
            exit 1
        }
        Write-Success "Node.js version $nodeVersionOutput detected."
    }
    catch {
        Write-Error "Failed to check Node.js version: $($_.Exception.Message)"
        exit 1
    }
}

# Check if we're in the right directory (has package.json)
if (-not (Test-Path "package.json")) {
    Write-Error "package.json not found. Please run this script from your project root directory."
    exit 1
}

# Install dependencies with retry logic
Write-Info "Installing project dependencies..."
$maxRetries = 3
$retryCount = 0
$installSuccess = $false

while ($retryCount -lt $maxRetries -and -not $installSuccess) {
    try {
        npm install
        if ($LASTEXITCODE -eq 0) {
            $installSuccess = $true
            Write-Success "Dependencies installed successfully."
        }
        else {
            throw "npm install failed with exit code $LASTEXITCODE"
        }
    }
    catch {
        $retryCount++
        if ($retryCount -lt $maxRetries) {
            Write-Warning "Dependency installation failed. Retrying... (attempt $retryCount/$maxRetries)"
            # Clear npm cache and try again
            npm cache clean --force 2>$null
            Start-Sleep -Seconds 2
        }
        else {
            Write-Error "Failed to install dependencies after $maxRetries attempts."
            Write-Info "Try running 'npm install' manually or check your internet connection."
            exit 1
        }
    }
}

# Initialize database
Write-Info "Initializing database..."
try {
    npm run db:init
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database initialized successfully."
    }
    else {
        Write-Warning "Database initialization completed with warnings (exit code: $LASTEXITCODE)"
    }
}
catch {
    Write-Error "Failed to initialize database: $($_.Exception.Message)"
    Write-Info "You may need to run 'npm run db:init' manually later."
}

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Info "Creating environment configuration file..."
    try {
        @"
# Application Configuration
PORT=3000

# Database Configuration
DB_PATH=./database/virtual-varsity.db

# Generated on $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@ | Out-File -FilePath ".env" -Encoding utf8
        Write-Success "Environment file created successfully."
    }
    catch {
        Write-Warning "Failed to create .env file. You may need to create it manually."
    }
}
else {
    Write-Info ".env file already exists. Skipping creation."
}

# Verify the setup by checking if we can start the dev server (dry run)
Write-Info "Verifying setup..."
try {
    # Just check if the start script exists
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    if ($packageJson.scripts -and $packageJson.scripts.dev) {
        Write-Success "Development script found."
    }
    else {
        Write-Warning "Development script not found in package.json"
    }
}
catch {
    Write-Warning "Could not verify package.json structure."
}

# Final success message
Write-Host ""
Write-Success "=== Setup Complete ==="
Write-Info "Virtual Varsity has been set up successfully!"
Write-Host ""
Write-Info "Next steps:"
Write-Host "1. To start the development server: " -NoNewline
Write-Host "npm run dev" -ForegroundColor Yellow
Write-Host "2. Open your browser to: " -NoNewline
Write-Host "http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Info "If you encounter any issues, try:"
Write-Host "- Restarting your command prompt"
Write-Host "- Running the script as Administrator"
Write-Host "- Checking your internet connection"
Write-Host ""

# Offer to start the dev server
$startNow = Read-Host "Would you like to start the development server now? (y/N)"
if ($startNow -eq "y" -or $startNow -eq "Y" -or $startNow -eq "yes") {
    Write-Info "Starting development server..."
    npm run dev
}