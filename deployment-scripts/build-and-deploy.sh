#!/bin/bash

# CallDefender Build and Deployment Script
# Comprehensive build and deployment automation for iOS and Android

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="CallDefender"
PACKAGE_NAME="com.callexample.calldefender"
BUNDLE_ID="com.callexample.calldefender"
BUILD_NUMBER=${BUILD_NUMBER:-1}
VERSION=${VERSION:-1.0.0}

# Environment detection
ENVIRONMENT=${1:-development}
PLATFORM=${2:-all}

echo -e "${BLUE}🚀 CallDefender Build & Deployment${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Platform: ${PLATFORM}${NC}"
echo -e "${BLUE}Version: ${VERSION} (${BUILD_NUMBER})${NC}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 16+."
        exit 1
    fi

    # Check npm/yarn
    if ! command -v npm &> /dev/null && ! command -v yarn &> /dev/null; then
        print_error "npm or yarn is required but not installed."
        exit 1
    fi

    # Check EAS CLI
    if ! command -v eas &> /dev/null; then
        print_warning "EAS CLI not found. Installing..."
        npm install -g @expo/eas-cli
    fi

    # Check Expo CLI
    if ! command -v expo &> /dev/null; then
        print_warning "Expo CLI not found. Installing..."
        npm install -g @expo/cli
    fi

    # Check environment variables
    if [[ "$ENVIRONMENT" == "production" ]]; then
        if [[ -z "$EAS_PROJECT_ID" ]]; then
            print_error "EAS_PROJECT_ID environment variable is required for production builds."
            exit 1
        fi

        if [[ -z "$APPLE_ID" || -z "$APPLE_TEAM_ID" ]]; then
            print_warning "Apple credentials not found. iOS builds may fail."
        fi
    fi

    print_status "Prerequisites check completed."
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."

    if command -v yarn &> /dev/null; then
        yarn install
    else
        npm install
    fi

    print_status "Dependencies installed successfully."
}

# Run tests
run_tests() {
    print_status "Running tests..."

    # Run unit tests
    if command -v yarn &> /dev/null; then
        yarn test --passWithNoTests
    else
        npm test --passWithNoTests
    fi

    # Run linting
    if command -v yarn &> /dev/null; then
        yarn lint
    else
        npm run lint
    fi

    print_status "Tests completed successfully."
}

# Type checking
run_type_check() {
    print_status "Running type checking..."

    if command -v yarn &> /dev/null; then
        yarn type-check
    else
        npm run type-check
    fi

    print_status "Type checking completed."
}

# Security audit
run_security_audit() {
    print_status "Running security audit..."

    if command -v yarn &> /dev/null; then
        yarn audit --level moderate
    else
        npm audit --audit-level moderate
    fi

    print_status "Security audit completed."
}

# Build for iOS
build_ios() {
    print_status "Building for iOS..."

    # Update iOS build number
    if command -v agvtool &> /dev/null; then
        cd ios
        agvtool new-marketing-version $VERSION
        agvtool new-version -all $BUILD_NUMBER
        cd ..
    fi

    # Build using EAS
    eas build --platform ios --profile $ENVIRONMENT --non-interactive

    print_status "iOS build completed successfully."
}

# Build for Android
build_android() {
    print_status "Building for Android..."

    # Update Android version
    if [[ -f "android/app/build.gradle" ]]; then
        sed -i.tmp "s/versionCode [0-9]*/versionCode $BUILD_NUMBER/" android/app/build.gradle
        sed -i.tmp "s/versionName \"[0-9.]*\"/versionName \"$VERSION\"/" android/app/build.gradle
        rm android/app/build.gradle.tmp
    fi

    # Build using EAS
    eas build --platform android --profile $ENVIRONMENT --non-interactive

    print_status "Android build completed successfully."
}

# Submit to App Store
submit_ios() {
    print_status "Submitting to App Store..."

    eas submit --platform ios --profile production --non-interactive

    print_status "iOS submission completed successfully."
}

# Submit to Google Play Store
submit_android() {
    print_status "Submitting to Google Play Store..."

    eas submit --platform android --profile production --non-interactive

    print_status "Android submission completed successfully."
}

# Generate build artifacts
generate_build_artifacts() {
    print_status "Generating build artifacts..."

    # Create build directory
    mkdir -p build

    # Copy important files
    cp app.config.js build/
    cp eas.json build/
    cp package.json build/

    # Generate changelog
    if [[ -f "CHANGELOG.md" ]]; then
        cp CHANGELOG.md build/
    fi

    # Generate build info
    cat > build/build-info.json << EOF
{
  "buildTime": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "$VERSION",
  "buildNumber": $BUILD_NUMBER,
  "environment": "$ENVIRONMENT",
  "commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')",
  "node": "$(node --version)",
  "npm": "$(npm --version)"
}
EOF

    print_status "Build artifacts generated successfully."
}

# Clean up
cleanup() {
    print_status "Cleaning up..."

    # Remove temporary files
    find . -name "*.tmp" -delete 2>/dev/null || true
    find . -name "*.log" -delete 2>/dev/null || true

    # Clear node modules if needed
    if [[ "$CLEAN_BUILD" == "true" ]]; then
        rm -rf node_modules
        print_status "Node modules cleaned."
    fi

    print_status "Cleanup completed."
}

# Main build process
main() {
    echo -e "${BLUE}🔨 Starting build process...${NC}"

    # Check prerequisites
    check_prerequisites

    # Install dependencies
    install_dependencies

    # Run quality checks
    run_tests
    run_type_check
    run_security_audit

    # Generate build artifacts
    generate_build_artifacts

    # Build based on platform
    case $PLATFORM in
        "ios")
            build_ios
            ;;
        "android")
            build_android
            ;;
        "all")
            build_ios
            build_android
            ;;
        *)
            print_error "Invalid platform: $PLATFORM. Use 'ios', 'android', or 'all'."
            exit 1
            ;;
    esac

    # Submit to stores if production environment
    if [[ "$ENVIRONMENT" == "production" ]]; then
        case $PLATFORM in
            "ios")
                submit_ios
                ;;
            "android")
                submit_android
                ;;
            "all")
                submit_ios
                submit_android
                ;;
        esac
    fi

    # Cleanup
    cleanup

    echo -e "${GREEN}✅ Build and deployment completed successfully!${NC}"

    # Show build information
    echo -e "${BLUE}Build Summary:${NC}"
    echo -e "  • Version: $VERSION"
    echo -e "  • Build Number: $BUILD_NUMBER"
    echo -e "  • Environment: $ENVIRONMENT"
    echo -e "  • Platform: $PLATFORM"
    echo -e "  • Build Time: $(date)"

    # Display download links if available
    if [[ "$ENVIRONMENT" == "development" || "$ENVIRONMENT" == "staging" ]]; then
        echo -e "${BLUE}📱 Download links will be available in the EAS dashboard.${NC}"
    fi
}

# Handle script interruption
trap 'print_error "Build interrupted!"; cleanup; exit 1' INT

# Run main function
main "$@"