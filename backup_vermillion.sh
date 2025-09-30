#!/bin/bash

# Vermillion Project Backup Script
# This script creates a comprehensive backup of the entire project

# Set variables
PROJECT_NAME="Vermillion"
BACKUP_DIR="/Users/markmariano/Documents/Vermillion_Backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="${PROJECT_NAME}_Backup_${TIMESTAMP}"
FULL_BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  Vermillion Project Backup${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Create backup directory if it doesn't exist
echo -e "${YELLOW}Creating backup directory...${NC}"
mkdir -p "${BACKUP_DIR}"
echo -e "${GREEN}✓ Backup directory: ${BACKUP_DIR}${NC}"

# Create project backup directory
mkdir -p "${FULL_BACKUP_PATH}"
echo -e "${GREEN}✓ Project backup directory: ${FULL_BACKUP_PATH}${NC}"

echo ""

# 1. Backup the entire project code
echo -e "${YELLOW}1. Backing up project code...${NC}"
rsync -av --exclude='node_modules' --exclude='__pycache__' --exclude='*.pyc' --exclude='.git' --exclude='venv' --exclude='.env' . "${FULL_BACKUP_PATH}/"
echo -e "${GREEN}✓ Project code backed up${NC}"

echo ""

# 2. Backup database
echo -e "${YELLOW}2. Backing up database...${NC}"
cd app
if [ -f "vermillion.db" ]; then
    cp vermillion.db "${FULL_BACKUP_PATH}/vermillion.db"
    echo -e "${GREEN}✓ Database backed up (vermillion.db)${NC}"
else
    echo -e "${RED}⚠ Database file not found${NC}"
fi

# Check for PostgreSQL connection and create dump if possible
echo -e "${YELLOW}   Checking for PostgreSQL database...${NC}"
if command -v psql &> /dev/null; then
    echo -e "${BLUE}   PostgreSQL client found, attempting database dump...${NC}"
    # You may need to adjust these connection parameters
    PGPASSWORD="your_password" pg_dump -h localhost -U postgres -d vermillion > "${FULL_BACKUP_PATH}/vermillion_postgres.sql" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ PostgreSQL database dumped (vermillion_postgres.sql)${NC}"
    else
        echo -e "${YELLOW}⚠ PostgreSQL dump failed (connection issues or database doesn't exist)${NC}"
    fi
else
    echo -e "${YELLOW}   PostgreSQL client not found, skipping dump${NC}"
fi

cd ..

echo ""

# 3. Backup environment and configuration
echo -e "${YELLOW}3. Backing up configuration files...${NC}"
if [ -f ".env" ]; then
    cp .env "${FULL_BACKUP_PATH}/.env"
    echo -e "${GREEN}✓ Environment file backed up${NC}"
fi

if [ -f "requirements.txt" ]; then
    cp requirements.txt "${FULL_BACKUP_PATH}/requirements.txt"
    echo -e "${GREEN}✓ Python requirements backed up${NC}"
fi

if [ -f "package.json" ]; then
    cp package.json "${FULL_BACKUP_PATH}/package.json"
    echo -e "${GREEN}✓ Node.js package.json backed up${NC}"
fi

echo ""

# 4. Create backup info file
echo -e "${YELLOW}4. Creating backup information...${NC}"
cat > "${FULL_BACKUP_PATH}/BACKUP_INFO.txt" << EOF
Vermillion Project Backup
========================
Backup Date: $(date)
Backup Time: $(date +"%H:%M:%S")
Project Version: $(git describe --tags --always 2>/dev/null || echo "Unknown")
Backup Type: Full Project Backup

Contents:
- Complete project source code
- Database files (SQLite/PostgreSQL)
- Configuration files
- Dependencies lists

Restore Instructions:
1. Extract this backup to a new directory
2. Install Python dependencies: pip install -r requirements.txt
3. Install Node.js dependencies: npm install
4. Copy database files to appropriate location
5. Update configuration files as needed
6. Start the application

Notes:
- This backup excludes node_modules, __pycache__, and virtual environments
- Database files are included for easy restoration
- All source code and configuration is preserved
EOF

echo -e "${GREEN}✓ Backup information file created${NC}"

echo ""

# 5. Create compressed archive
echo -e "${YELLOW}5. Creating compressed archive...${NC}"
cd "${BACKUP_DIR}"
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"
echo -e "${GREEN}✓ Compressed archive created: ${BACKUP_NAME}.tar.gz${NC}"

# Remove the uncompressed directory to save space
rm -rf "${BACKUP_NAME}"
echo -e "${GREEN}✓ Cleaned up uncompressed backup${NC}"

echo ""

# 6. Display backup summary
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  Backup Complete!${NC}"
echo -e "${BLUE}================================${NC}"
echo ""
echo -e "${GREEN}Backup Location: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz${NC}"
echo -e "${GREEN}Backup Size: $(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)${NC}"
echo -e "${GREEN}Timestamp: ${TIMESTAMP}${NC}"
echo ""
echo -e "${BLUE}Backup Contents:${NC}"
echo "  ✓ Complete project source code"
echo "  ✓ Database files"
echo "  ✓ Configuration files"
echo "  ✓ Dependencies lists"
echo "  ✓ Backup information and restore instructions"
echo ""
echo -e "${YELLOW}To restore: tar -xzf ${BACKUP_NAME}.tar.gz${NC}"
echo ""
echo -e "${GREEN}Backup completed successfully! 🎉${NC}"

