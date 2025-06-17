#!/bin/bash

# Virtual Varsity Installation Script for Linux/Mac
# Fully automated setup for non-technical users

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Helper functions
print_success() { echo -e "${GREEN}$1${NC}"; }
print_warning() { echo -e "${YELLOW}$1${NC}"; }
print_error() { echo -e "${RED}$1${NC}"; }
print_info() { echo -e "${CYAN}$1${NC}"; }

print_info "=== Virtual Varsity Setup Script ==="
print_info "This script will automatically set up your Virtual Varsity project."
echo ""

# Detect OS
OS="unknown"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    # Detect Linux distribution
    if [ -f /etc/debian_version ]; then
        DISTRO="debian"
    elif [ -f /etc/redhat-release ]; then
        DISTRO="redhat"
    elif [ -f /etc/arch-release ]; then
        DISTRO="arch"
    else
        DISTRO="unknown"
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="mac"
fi

print_info "Detected OS: $OS"

# Function to install Node.js on different systems
install_nodejs() {
    print_info "Installing Node.js..."
    
    case $OS in
        "mac")
            # Try Homebrew first
            if command -v brew &> /dev/null; then
                print_info "Installing Node.js using Homebrew..."
                brew install node@18 || {
                    print_warning "Homebrew installation failed, trying direct download..."
                    install_nodejs_direct_mac
                }
            else
                print_info "Homebrew not found, installing Node.js directly..."
                install_nodejs_direct_mac
            fi
            ;;
        "linux")
            case $DISTRO in
                "debian")
                    install_nodejs_debian
                    ;;
                "redhat")
                    install_nodejs_redhat
                    ;;
                "arch")
                    install_nodejs_arch
                    ;;
                *)
                    print_warning "Unknown Linux distribution, trying generic installation..."
                    install_nodejs_generic
                    ;;
            esac
            ;;
        *)
            print_error "Unsupported operating system: $OSTYPE"
            exit 1
            ;;
    esac
}

# Direct Node.js installation for Mac
install_nodejs_direct_mac() {
    print_info "Downloading Node.js for macOS..."
    NODE_VERSION="18.19.0"
    
    # Detect architecture
    ARCH=$(uname -m)
    if [[ "$ARCH" == "arm64" ]]; then
        NODE_PKG="node-v${NODE_VERSION}-darwin-arm64.tar.gz"
    else
        NODE_PKG="node-v${NODE_VERSION}-darwin-x64.tar.gz"
    fi
    
    NODE_URL="https://nodejs.org/dist/v${NODE_VERSION}/${NODE_PKG}"
    TEMP_DIR=$(mktemp -d)
    
    curl -fsSL "$NODE_URL" -o "$TEMP_DIR/$NODE_PKG" || {
        print_error "Failed to download Node.js"
        return 1
    }
    
    cd "$TEMP_DIR"
    tar -xzf "$NODE_PKG"
    
    # Install to /usr/local (requires sudo)
    print_info "Installing Node.js (may require password)..."
    sudo cp -R "node-v${NODE_VERSION}-darwin-"*"/"* /usr/local/ || {
        # Fallback to user directory
        print_warning "System installation failed, installing to user directory..."
        mkdir -p "$HOME/.local"
        cp -R "node-v${NODE_VERSION}-darwin-"*"/"* "$HOME/.local/"
        export PATH="$HOME/.local/bin:$PATH"
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc"
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.zshrc" 2>/dev/null || true
    }
    
    cd - > /dev/null
    rm -rf "$TEMP_DIR"
}

# Node.js installation for Debian/Ubuntu
install_nodejs_debian() {
    print_info "Installing Node.js on Debian/Ubuntu..."
    
    # Update package list
    sudo apt-get update -qq || {
        print_warning "Failed to update package list, continuing anyway..."
    }
    
    # Install curl if not present
    if ! command -v curl &> /dev/null; then
        print_info "Installing curl..."
        sudo apt-get install -y curl
    fi
    
    # Install Node.js from NodeSource
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - || {
        print_error "Failed to add NodeSource repository"
        return 1
    }
    
    sudo apt-get install -y nodejs || {
        print_error "Failed to install Node.js"
        return 1
    }
}

# Node.js installation for RedHat/CentOS/Fedora
install_nodejs_redhat() {
    print_info "Installing Node.js on RedHat/CentOS/Fedora..."
    
    # Install curl if not present
    if ! command -v curl &> /dev/null; then
        print_info "Installing curl..."
        if command -v dnf &> /dev/null; then
            sudo dnf install -y curl
        else
            sudo yum install -y curl
        fi
    fi
    
    # Install Node.js from NodeSource
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash - || {
        print_error "Failed to add NodeSource repository"
        return 1
    }
    
    if command -v dnf &> /dev/null; then
        sudo dnf install -y nodejs npm
    else
        sudo yum install -y nodejs npm
    fi
}

# Node.js installation for Arch Linux
install_nodejs_arch() {
    print_info "Installing Node.js on Arch Linux..."
    sudo pacman -Sy nodejs npm --noconfirm || {
        print_error "Failed to install Node.js"
        return 1
    }
}

# Generic Node.js installation (download binary)
install_nodejs_generic() {
    print_info "Installing Node.js using generic method..."
    NODE_VERSION="18.19.0"
    ARCH=$(uname -m)
    
    case $ARCH in
        "x86_64")
            NODE_ARCH="x64"
            ;;
        "aarch64"|"arm64")
            NODE_ARCH="arm64"
            ;;
        *)
            print_error "Unsupported architecture: $ARCH"
            return 1
            ;;
    esac
    
    NODE_PKG="node-v${NODE_VERSION}-linux-${NODE_ARCH}.tar.xz"
    NODE_URL="https://nodejs.org/dist/v${NODE_VERSION}/${NODE_PKG}"
    TEMP_DIR=$(mktemp -d)
    
    curl -fsSL "$NODE_URL" -o "$TEMP_DIR/$NODE_PKG" || {
        print_error "Failed to download Node.js"
        return 1
    }
    
    cd "$TEMP_DIR"
    tar -xf "$NODE_PKG"
    
    # Try system installation first
    if sudo cp -R "node-v${NODE_VERSION}-linux-${NODE_ARCH}/"* /usr/local/ 2>/dev/null; then
        print_success "Node.js installed system-wide"
    else
        # Fallback to user directory
        print_warning "System installation failed, installing to user directory..."
        mkdir -p "$HOME/.local"
        cp -R "node-v${NODE_VERSION}-linux-${NODE_ARCH}/"* "$HOME/.local/"
        export PATH="$HOME/.local/bin:$PATH"
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc"
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.zshrc" 2>/dev/null || true
    fi
    
    cd - > /dev/null
    rm -rf "$TEMP_DIR"
}

# Check if Node.js is installed
print_info "Checking for Node.js installation..."

if ! command -v node &> /dev/null; then
    print_warning "Node.js is not installed."
    
    # Try nvm first if available
    if [ -f "$HOME/.nvm/nvm.sh" ]; then
        print_info "Installing Node.js using nvm..."
        source "$HOME/.nvm/nvm.sh"
        nvm install 18 && nvm use 18 || {
            print_warning "nvm installation failed, trying system installation..."
            install_nodejs
        }
    else
        install_nodejs
    fi
    
    # Verify installation with retries
    MAX_RETRIES=5
    RETRY_COUNT=0
    NODE_INSTALLED=false
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ] && [ "$NODE_INSTALLED" = false ]; do
        if command -v node &> /dev/null; then
            NODE_INSTALLED=true
        else
            RETRY_COUNT=$((RETRY_COUNT + 1))
            print_info "Waiting for Node.js to be available... (attempt $RETRY_COUNT/$MAX_RETRIES)"
            sleep 2
            # Reload shell environment
            hash -r 2>/dev/null || true
            source ~/.bashrc 2>/dev/null || true
            source ~/.zshrc 2>/dev/null || true
        fi
    done
    
    if [ "$NODE_INSTALLED" = false ]; then
        print_error "Node.js installation verification failed."
        print_info "Please restart your terminal and try again, or install Node.js manually from: https://nodejs.org/"
        exit 1
    fi
fi

# Check Node.js version
NODE_VERSION_FULL=$(node -v)
NODE_VERSION=$(echo "$NODE_VERSION_FULL" | cut -d'v' -f2 | cut -d'.' -f1)

if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Found version $NODE_VERSION"
    print_info "Please update Node.js from: https://nodejs.org/"
    exit 1
fi

print_success "Node.js $NODE_VERSION_FULL detected."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from your project root directory."
    exit 1
fi

# Install dependencies with retry logic
print_info "Installing project dependencies..."
MAX_RETRIES=3
RETRY_COUNT=0
INSTALL_SUCCESS=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ] && [ "$INSTALL_SUCCESS" = false ]; do
    if npm install; then
        INSTALL_SUCCESS=true
        print_success "Dependencies installed successfully."
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            print_warning "Dependency installation failed. Retrying... (attempt $RETRY_COUNT/$MAX_RETRIES)"
            # Clear npm cache and try again
            npm cache clean --force 2>/dev/null || true
            sleep 2
        else
            print_error "Failed to install dependencies after $MAX_RETRIES attempts."
            print_info "Try running 'npm install' manually or check your internet connection."
            exit 1
        fi
    fi
done

# Initialize database
print_info "Initializing database..."
if npm run db:init; then
    print_success "Database initialized successfully."
else
    print_warning "Database initialization completed with warnings."
    print_info "You may need to run 'npm run db:init' manually later."
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    print_info "Creating environment configuration file..."
    cat > .env <<EOL
# Application Configuration
PORT=3000

# Database Configuration
DB_PATH=./database/virtual-varsity.db

# Generated on $(date)
EOL
    print_success "Environment file created successfully."
else
    print_info ".env file already exists. Skipping creation."
fi

# Verify setup
print_info "Verifying setup..."
if [ -f "package.json" ] && command -v node &> /dev/null && command -v npm &> /dev/null; then
    # Check if dev script exists
    if npm run --silent 2>/dev/null | grep -q "dev"; then
        print_success "Development script found."
    else
        print_warning "Development script not found in package.json"
    fi
else
    print_warning "Setup verification incomplete."
fi

# Final success message
echo ""
print_success "=== Setup Complete ==="
print_info "Virtual Varsity has been set up successfully!"
echo ""
print_info "Next steps:"
echo -e "1. To start the development server: ${YELLOW}npm run dev${NC}"
echo -e "2. Open your browser to: ${YELLOW}http://localhost:3000${NC}"
echo ""
print_info "If you encounter any issues, try:"
echo "- Restarting your terminal"
echo "- Running: source ~/.bashrc (or ~/.zshrc)"
echo "- Checking your internet connection"
echo ""

# Make the script executable for future use
chmod +x "$0" 2>/dev/null || true

# Offer to start the dev server
echo -n "Would you like to start the development server now? (y/N): "
read -r START_NOW
if [[ "$START_NOW" =~ ^[Yy]([Ee][Ss])?$ ]]; then
    print_info "Starting development server..."
    npm run dev
fi