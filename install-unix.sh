#!/bin/bash
# Unix/Linux/macOS Installation Script for editly-mcp

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Platform detection
OS=$(uname -s)
ARCH=$(uname -m)

echo "==========================================="
echo "     Editly MCP - Unix/Linux/macOS Setup"
echo "==========================================="
echo
echo "Platform: $OS ($ARCH)"
echo

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install dependencies based on platform
install_dependencies() {
    echo "Installing system dependencies..."
    
    case "$OS" in
        "Darwin")
            # macOS
            echo "Detected macOS"
            
            # Check for Homebrew
            if ! command_exists brew; then
                echo "Installing Homebrew..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi
            
            # Install Xcode Command Line Tools
            if ! command_exists xcode-select; then
                echo "Installing Xcode Command Line Tools..."
                xcode-select --install
                echo "Please complete the Xcode installation and run this script again."
                exit 1
            fi
            
            # Install dependencies
            echo "Installing Python 3, FFmpeg, and Node.js..."
            brew install python3 ffmpeg node
            ;;
            
        "Linux")
            # Linux
            echo "Detected Linux"
            
            # Detect Linux distribution
            if [ -f /etc/os-release ]; then
                . /etc/os-release
                DISTRO=$ID
            else
                echo "Cannot detect Linux distribution"
                exit 1
            fi
            
            case "$DISTRO" in
                "ubuntu"|"debian")
                    echo "Installing dependencies for Ubuntu/Debian..."
                    sudo apt-get update
                    sudo apt-get install -y \
                        build-essential \
                        pkg-config \
                        python3-dev \
                        python3-pip \
                        libcairo2-dev \
                        libpango1.0-dev \
                        libjpeg-dev \
                        libgif-dev \
                        librsvg2-dev \
                        ffmpeg \
                        nodejs \
                        npm
                    ;;
                    
                "fedora"|"centos"|"rhel")
                    echo "Installing dependencies for Fedora/CentOS/RHEL..."
                    sudo dnf install -y \
                        gcc \
                        gcc-c++ \
                        make \
                        pkg-config \
                        python3-devel \
                        python3-pip \
                        cairo-devel \
                        pango-devel \
                        libjpeg-turbo-devel \
                        giflib-devel \
                        librsvg2-devel \
                        ffmpeg \
                        nodejs \
                        npm
                    ;;
                    
                "arch")
                    echo "Installing dependencies for Arch Linux..."
                    sudo pacman -S --needed \
                        base-devel \
                        python \
                        cairo \
                        pango \
                        libjpeg-turbo \
                        giflib \
                        librsvg \
                        ffmpeg \
                        nodejs \
                        npm
                    ;;
                    
                *)
                    echo "Unsupported Linux distribution: $DISTRO"
                    echo "Please install dependencies manually:"
                    echo "- Build tools (gcc, make, pkg-config)"
                    echo "- Python 3.8+ development headers"
                    echo "- Cairo development libraries"
                    echo "- FFmpeg"
                    echo "- Node.js 16+"
                    exit 1
                    ;;
            esac
            ;;
            
        *)
            echo "Unsupported operating system: $OS"
            exit 1
            ;;
    esac
}

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    echo -e "${GREEN}✓${NC} Node.js found: v$NODE_VERSION"
    
    # Check if version is adequate (16+)
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
    if [ "$MAJOR_VERSION" -lt 16 ]; then
        echo -e "${YELLOW}⚠${NC} Node.js version is too old. Upgrading..."
        install_dependencies
    fi
else
    echo -e "${RED}✗${NC} Node.js not found"
    install_dependencies
fi

# Check Python
if command_exists python3; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    echo -e "${GREEN}✓${NC} Python found: $PYTHON_VERSION"
else
    echo -e "${RED}✗${NC} Python 3 not found"
    install_dependencies
fi

# Check FFmpeg
if command_exists ffmpeg; then
    echo -e "${GREEN}✓${NC} FFmpeg found"
else
    echo -e "${RED}✗${NC} FFmpeg not found"
    install_dependencies
fi

# Check build tools
if command_exists gcc || command_exists clang; then
    echo -e "${GREEN}✓${NC} C compiler found"
else
    echo -e "${RED}✗${NC} C compiler not found"
    install_dependencies
fi

# Check for Cairo libraries (Linux only)
if [ "$OS" = "Linux" ]; then
    if pkg-config --exists cairo; then
        echo -e "${GREEN}✓${NC} Cairo libraries found"
    else
        echo -e "${RED}✗${NC} Cairo libraries not found"
        install_dependencies
    fi
fi

# Install editly-mcp
echo
echo "Installing editly-mcp..."
if npm install -g editly-mcp; then
    echo -e "${GREEN}✓${NC} editly-mcp installed successfully"
else
    echo -e "${RED}✗${NC} Installation failed"
    
    echo
    echo "Trying alternative installation methods..."
    
    # Try with --unsafe-perm for permissions issues
    if npm install -g editly-mcp --unsafe-perm; then
        echo -e "${GREEN}✓${NC} editly-mcp installed with --unsafe-perm"
    else
        echo -e "${RED}✗${NC} Installation failed with --unsafe-perm"
        
        # Try local installation
        echo "Trying local installation..."
        if npm install editly-mcp; then
            echo -e "${GREEN}✓${NC} editly-mcp installed locally"
            echo -e "${YELLOW}Note:${NC} Package installed locally. You may need to use npx editly-mcp"
        else
            echo -e "${RED}✗${NC} All installation methods failed"
            echo
            echo "Manual installation required:"
            echo "1. Check your Node.js and npm installation"
            echo "2. Make sure you have all system dependencies"
            echo "3. Try: npm cache clean --force"
            echo "4. Check the README.md for troubleshooting"
            exit 1
        fi
    fi
fi

# Test installation
echo
echo "Testing installation..."
if command_exists editly-mcp; then
    echo -e "${GREEN}✓${NC} editly-mcp is available in PATH"
    echo
    echo -e "${GREEN}Installation successful!${NC}"
    echo
    echo "Next steps:"
    echo "1. Configure your MCP client to use editly-mcp"
    echo "2. Test with: editly-mcp"
    echo "3. Run diagnostics: npm run diagnose"
    echo "4. Check the README.md for usage examples"
else
    echo -e "${YELLOW}⚠${NC} editly-mcp not found in PATH"
    echo "Installation completed but command not available globally"
    echo "Try using: npx editly-mcp"
fi

echo
echo -e "${BLUE}Installation complete!${NC}"