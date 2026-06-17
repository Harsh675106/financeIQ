#!/bin/bash
# Complete Setup Script for Finance App with Google OAuth

set -e  # Exit on error

echo "🚀 Finance App Complete Setup"
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Install backend dependencies
echo -e "\n${YELLOW}Step 1: Installing backend dependencies...${NC}"
cd backend
npm install axios
npm install
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Step 2: Install frontend dependencies
echo -e "\n${YELLOW}Step 2: Installing frontend dependencies...${NC}"
cd ../frontend
npm install
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

# Step 3: ML Service dependencies
echo -e "\n${YELLOW}Step 3: Setting up ML service...${NC}"
cd ../ml-service
pip install -r requirements.txt
echo -e "${GREEN}✓ ML service dependencies installed${NC}"

# Step 4: Environment setup instructions
echo -e "\n${YELLOW}Step 4: Environment Setup${NC}"
echo "Creating environment files..."

# Backend .env
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo -e "${GREEN}✓ Created backend/.env (please edit with your values)${NC}"
else
    echo -e "${GREEN}✓ backend/.env already exists${NC}"
fi

# Frontend .env.local
if [ ! -f frontend/.env.local ]; then
    cp frontend/.env.example frontend/.env.local
    echo -e "${GREEN}✓ Created frontend/.env.local (please edit with your values)${NC}"
else
    echo -e "${GREEN}✓ frontend/.env.local already exists${NC}"
fi

# ML Service .env
if [ ! -f ml-service/.env ]; then
    cp ml-service/.env.example ml-service/.env
    echo -e "${GREEN}✓ Created ml-service/.env${NC}"
else
    echo -e "${GREEN}✓ ml-service/.env already exists${NC}"
fi

# Step 5: Database migration instructions
echo -e "\n${YELLOW}Step 5: Database Migration${NC}"
echo "To add OAuth support to your database, run:"
echo "  psql -U postgres -d finance -f database/migrations/001_add_oauth_support.sql"

# Step 6: Final instructions
echo -e "\n${GREEN}======================================"
echo "✅ Setup Complete!"
echo "======================================${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo ""
echo "1. ${YELLOW}Get Google OAuth Credentials:${NC}"
echo "   - Visit: https://console.cloud.google.com"
echo "   - Create OAuth 2.0 credentials"
echo "   - Copy Client ID and Client Secret"
echo ""
echo "2. ${YELLOW}Configure Environment Variables:${NC}"
echo "   - Edit: backend/.env"
echo "     - Add GOOGLE_CLIENT_ID"
echo "     - Add GOOGLE_CLIENT_SECRET"
echo "     - Set JWT_SECRET"
echo "     - Set DATABASE_URL"
echo ""
echo "   - Edit: frontend/.env.local"
echo "     - Add NEXT_PUBLIC_GOOGLE_CLIENT_ID"
echo ""
echo "3. ${YELLOW}Update Database Schema:${NC}"
echo "   psql -U postgres -d finance -f database/migrations/001_add_oauth_support.sql"
echo ""
echo "4. ${YELLOW}Start Services:${NC}"
echo "   Terminal 1 (Backend):  cd backend && npm start"
echo "   Terminal 2 (Frontend): cd frontend && npm run dev"
echo "   Terminal 3 (ML):       cd ml-service && python app.py"
echo ""
echo "5. ${YELLOW}Open in Browser:${NC}"
echo "   http://localhost:3000"
echo ""
echo -e "${GREEN}For detailed setup guide, see: GOOGLE_OAUTH_SETUP.md${NC}"
echo ""
