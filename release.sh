#!/bin/bash

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 ItemsJS Release Script${NC}"
echo ""

# Check if on master branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "master" ]; then
    echo -e "${RED}❌ You must be on master branch!${NC}"
    echo "   Current branch: $CURRENT_BRANCH"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}❌ You have uncommitted changes!${NC}"
    git status --short
    exit 1
fi

# Check if synchronized with origin
git fetch origin
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u})

if [ $LOCAL != $REMOTE ]; then
    echo -e "${RED}❌ Your branch is not synchronized with origin!${NC}"
    echo "   Run: git pull origin master"
    exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "Current version: ${YELLOW}$CURRENT_VERSION${NC}"
echo ""

# Ask for release type
echo "Select release type:"
echo "  1) patch (e.g. 2.1.25 -> 2.1.26) - bug fixes"
echo "  2) minor (e.g. 2.1.25 -> 2.2.0)  - new features"
echo "  3) major (e.g. 2.1.25 -> 3.0.0)  - breaking changes"
echo "  4) custom - specify your own version"
echo ""
read -p "Choice (1-4): " RELEASE_TYPE

case $RELEASE_TYPE in
    1)
        VERSION_TYPE="patch"
        ;;
    2)
        VERSION_TYPE="minor"
        ;;
    3)
        VERSION_TYPE="major"
        ;;
    4)
        read -p "Enter new version (e.g. 2.1.26): " NEW_VERSION
        VERSION_TYPE="custom"
        ;;
    *)
        echo -e "${RED}❌ Invalid choice!${NC}"
        exit 1
        ;;
esac

# Calculate new version
if [ "$VERSION_TYPE" != "custom" ]; then
    NEW_VERSION=$(npm version $VERSION_TYPE --no-git-tag-version | sed 's/v//')
else
    npm version $NEW_VERSION --no-git-tag-version > /dev/null
fi

echo ""
echo -e "New version: ${GREEN}$NEW_VERSION${NC}"
echo ""

# Show changes since last version
echo -e "${YELLOW}Changes since last version:${NC}"
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "HEAD~10")
git log $LAST_TAG..HEAD --oneline --no-decorate
echo ""

# Confirmation
read -p "Do you want to continue? (y/N): " CONFIRM
if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    echo -e "${RED}Cancelled.${NC}"
    git checkout package.json package-lock.json 2>/dev/null
    exit 1
fi

echo ""
echo -e "${GREEN}📋 Running tests...${NC}"
if ! npm test; then
    echo -e "${RED}❌ Tests failed!${NC}"
    git checkout package.json package-lock.json 2>/dev/null
    exit 1
fi

echo ""
echo -e "${GREEN}🔨 Building project...${NC}"
if ! npm run build; then
    echo -e "${RED}❌ Build failed!${NC}"
    git checkout package.json package-lock.json 2>/dev/null
    exit 1
fi

echo ""
echo -e "${GREEN}📝 Creating commit...${NC}"
git add package.json package-lock.json
git commit -m "bump to $NEW_VERSION version"

echo ""
echo -e "${GREEN}🏷️  Creating tag...${NC}"
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"

echo ""
echo -e "${GREEN}✅ Done!${NC}"
echo ""
echo "Next steps:"
echo -e "  1) Verify changes: ${YELLOW}git show HEAD${NC}"
echo -e "  2) Push to GitHub:  ${YELLOW}git push origin master --tags${NC}"
echo -e "  3) Publish to npm:  ${YELLOW}npm publish${NC}"
echo ""
echo -e "${YELLOW}Or all at once:${NC}"
echo -e "  ${YELLOW}git push origin master --tags && npm publish${NC}"
echo ""
