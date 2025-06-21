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
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Function to refresh environment variables
function Refresh-Environment {
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    
    # Also refresh other common environment variables
    $env:NODE_PATH = [System.Environment]::GetEnvironmentVariable("NODE_PATH", "Machine")
    if (-not $env:NODE_PATH) {
        $env:NODE_PATH = [System.Environment]::GetEnvironmentVariable("NODE_PATH", "User")
    }
}

# Function to download and install Node.js directly
function Install-NodeJS {
    Write-Info "Downloading Node.js installer..."
    
    $nodeVersion = "18.19.0"
    $nodeUrl = "https://nodejs.org/dist/v$nodeVersion/node-v$nodeVersion-x64.msi"
    $installerPath = "$env:TEMP\nodejs-installer.msi"
    
    try {
        # Download Node.js installer with better error handling
        Write-Info "Downloading from: $nodeUrl"
        $progressPreference = 'SilentlyContinue'
        Invoke-WebRequest -Uri $nodeUrl -OutFile $installerPath -UseBasicParsing
        Write-Success "Node.js installer downloaded successfully."
        
        # Install Node.js silently
        Write-Info "Installing Node.js... (this may take a few minutes)"
        Write-Warning "Please wait, do not close this window..."
        
        $installArgs = @(
            "/i", "`"$installerPath`"",
            "/quiet",
            "/norestart",
            "ADDLOCAL=ALL"
        )
        
        $installProcess = Start-Process -FilePath "msiexec.exe" -ArgumentList $installArgs -Wait -PassThru -NoNewWindow
        
        if ($installProcess.ExitCode -eq 0) {
            Write-Success "Node.js installed successfully."
            
            # Clean up installer
            try {
                Remove-Item $installerPath -Force -ErrorAction SilentlyContinue
            } catch {
                # Ignore cleanup errors
            }
            
            # Force refresh environment
            Refresh-Environment
            
            # Wait for system to register the installation
            Write-Info "Waiting for system to register Node.js installation..."
            Start-Sleep -Seconds 5
            
            return $true
        }
        else {
            Write-Error "Node.js installation failed with exit code: $($installProcess.ExitCode)"
            return $false
        }
    }
    catch {
        Write-Error "Failed to download or install Node.js: $($_.Exception.Message)"
        Write-Info "You may need to:"
        Write-Info "1. Check your internet connection"
        Write-Info "2. Run PowerShell as Administrator"
        Write-Info "3. Manually download Node.js from https://nodejs.org/"
        return $false
    }
}

# Function to test Node.js installation
function Test-NodeJS {
    param([int]$MaxRetries = 10)
    
    $retryCount = 0
    while ($retryCount -lt $MaxRetries) {
        try {
            # Refresh environment variables
            Refresh-Environment
            
            # Test if node command exists
            $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
            if ($nodeCommand) {
                # Test if node actually runs
                $nodeVersionOutput = & node -v 2>&1
                if ($nodeVersionOutput -match "v\d+\.\d+\.\d+") {
                    Write-Success "Node.js is working: $nodeVersionOutput"
                    return $true
                }
            }
        }
        catch {
            # Continue trying
        }
        
        $retryCount++
        Write-Info "Checking Node.js availability... (attempt $retryCount/$MaxRetries)"
        Start-Sleep -Seconds 3
    }
    
    return $false
}

# Check if Node.js is installed
if (-not $SkipNodeCheck) {
    Write-Info "Checking for Node.js installation..."
    
    if (-not (Test-NodeJS -MaxRetries 3)) {
        Write-Warning "Node.js is not installed or not working properly."
        
        # Try Chocolatey first (faster if available)
        if (Get-Command choco -ErrorAction SilentlyContinue) {
            Write-Info "Installing Node.js using Chocolatey..."
            try {
                $chocoProcess = Start-Process -FilePath "choco" -ArgumentList "install", "nodejs", "--version=18.19.0", "-y" -Wait -PassThru -NoNewWindow
                if ($chocoProcess.ExitCode -eq 0) {
                    Refresh-Environment
                    Start-Sleep -Seconds 3
                    if (Test-NodeJS) {
                        Write-Success "Node.js installed successfully via Chocolatey."
                    } else {
                        throw "Chocolatey installation verification failed"
                    }
                } else {
                    throw "Chocolatey installation failed with exit code: $($chocoProcess.ExitCode)"
                }
            }
            catch {
                Write-Warning "Chocolatey installation failed: $($_.Exception.Message)"
                Write-Info "Trying direct download..."
                if (-not (Install-NodeJS)) {
                    Write-Error "All Node.js installation methods failed."
                    Write-Info "Please manually install Node.js from: https://nodejs.org/"
                    Read-Host "Press Enter to exit"
                    exit 1
                }
            }
        }
        else {
            # Direct download and install
            if (-not (Install-NodeJS)) {
                Write-Error "Node.js installation failed."
                Write-Info "Please manually install Node.js from: https://nodejs.org/"
                Read-Host "Press Enter to exit"
                exit 1
            }
        }
        
        # Final verification after installation
        if (-not (Test-NodeJS)) {
            Write-Error "Node.js installation verification failed."
            Write-Warning "This might be resolved by:"
            Write-Info "1. Restarting your command prompt"
            Write-Info "2. Restarting your computer"
            Write-Info "3. Running this script as Administrator"
            Read-Host "Press Enter to exit"
            exit 1
        }
    }
    
    # Check Node.js version requirement
    try {
        $nodeVersionOutput = & node -v
        $nodeVersion = $nodeVersionOutput.Substring(1).Split('.')[0]
        if ([int]$nodeVersion -lt 18) {
            Write-Error "Node.js version 18 or higher is required. Found version $nodeVersion"
            Write-Info "Please update Node.js from: https://nodejs.org/"
            Read-Host "Press Enter to exit"
            exit 1
        }
        Write-Success "Node.js version requirement satisfied: $nodeVersionOutput"
    }
    catch {
        Write-Error "Failed to check Node.js version: $($_.Exception.Message)"
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Check if we're in the right directory (has package.json)
if (-not (Test-Path "package.json")) {
    Write-Error "package.json not found. Please run this script from your project root directory."
    Write-Info "Current directory: $(Get-Location)"
    Read-Host "Press Enter to exit"
    exit 1
}

# Install dependencies with retry logic
Write-Info "Installing project dependencies..."
$maxRetries = 3
$retryCount = 0
$installSuccess = $false

while ($retryCount -lt $maxRetries -and -not $installSuccess) {
    try {
        Write-Info "Running npm install... (attempt $($retryCount + 1)/$maxRetries)"
        
        # Run npm install and capture output
        $npmProcess = Start-Process -FilePath "npm" -ArgumentList "install" -Wait -PassThru -NoNewWindow
        
        if ($npmProcess.ExitCode -eq 0) {
            $installSuccess = $true
            Write-Success "Dependencies installed successfully."
        }
        else {
            throw "npm install failed with exit code $($npmProcess.ExitCode)"
        }
    }
    catch {
        $retryCount++
        if ($retryCount -lt $maxRetries) {
            Write-Warning "Dependency installation failed: $($_.Exception.Message)"
            Write-Info "Retrying... (attempt $($retryCount + 1)/$maxRetries)"
            # Clear npm cache and try again
            try {
                & npm cache clean --force 2>$null
            } catch {
                # Ignore cache clean errors
            }
            Start-Sleep -Seconds 2
        }
        else {
            Write-Error "Failed to install dependencies after $maxRetries attempts."
            Write-Error "Error: $($_.Exception.Message)"
            Write-Info "Try running 'npm install' manually or check your internet connection."
            Read-Host "Press Enter to exit"
            exit 1
        }
    }
}

# Initialize database
Write-Info "Initializing database..."
try {
    $dbProcess = Start-Process -FilePath "npm" -ArgumentList "run", "db:init" -Wait -PassThru -NoNewWindow
    if ($dbProcess.ExitCode -eq 0) {
        Write-Success "Database initialized successfully."
    }
    else {
        Write-Warning "Database initialization completed with warnings (exit code: $($dbProcess.ExitCode))"
    }
}
catch {
    Write-Error "Failed to initialize database: $($_.Exception.Message)"
    Write-Info "You may need to run 'npm run db:init' manually later."
}

# Database directory will be created automatically by the init script
Write-Info "Database will be initialized automatically when running 'npm run db:init'"

# Verify the setup by checking if we can start the dev server (dry run)
Write-Info "Verifying setup..."
try {
    $packageJsonContent = Get-Content "package.json" -Raw | ConvertFrom-Json
    if ($packageJsonContent.scripts -and $packageJsonContent.scripts.dev) {
        Write-Success "Development script found in package.json."
    }
    else {
        Write-Warning "Development script not found in package.json"
    }
}
catch {
    Write-Warning "Could not verify package.json structure: $($_.Exception.Message)"
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
try {
    $startNow = Read-Host "Would you like to start the development server now? (y/N)"
    if ($startNow -eq "y" -or $startNow -eq "Y" -or $startNow -eq "yes") {
        Write-Info "Starting development server..."
        Write-Info "Press Ctrl+C to stop the server when you're done."
        & npm run dev
    }
}
catch {
    Write-Info "Skipping development server start."
}

Write-Host ""
Write-Success "Script completed successfully!"
Read-Host "Press Enter to exit"