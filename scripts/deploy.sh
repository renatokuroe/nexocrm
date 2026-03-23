#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 NexoCRM Deployment Script${NC}"
echo -e "${BLUE}================================${NC}\n"

# Check Docker installation
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1/5: Checking environment${NC}"

# Check if .env exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ .env.production file not found!${NC}"
    echo "Please create .env.production with the following variables:"
    echo "  DATABASE_URL=mysql://..."
    echo "  JWT_SECRET=..."
    echo "  FRONTEND_URL=https://yourdomain.com"
    echo "  NEXT_PUBLIC_API_URL=https://api.yourdomain.com"
    exit 1
fi

source .env.production

echo -e "${GREEN}✅ Environment variables loaded${NC}\n"

echo -e "${YELLOW}Step 2/5: Building Docker images${NC}"

docker build -t nexocrm-backend:latest ./backend
echo -e "${GREEN}✅ Backend image built${NC}"

docker build -t nexocrm-frontend:latest ./frontend
echo -e "${GREEN}✅ Frontend image built${NC}\n"

echo -e "${YELLOW}Step 3/5: Stopping existing containers${NC}"

docker-compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true
echo -e "${GREEN}✅ Containers stopped${NC}\n"

echo -e "${YELLOW}Step 4/5: Running database migrations${NC}"

# Create network if not exists
docker network create nexo-network 2>/dev/null || true

# Run migrations via backend container
docker run --rm \
  --network nexo-network \
  -e DATABASE_URL="${DATABASE_URL}" \
  nexocrm-backend:latest \
  npm run migrate

echo -e "${GREEN}✅ Migrations completed${NC}\n"

echo -e "${YELLOW}Step 5/5: Starting services${NC}"

docker-compose -f docker-compose.prod.yml up -d

# Wait for services to start
echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
sleep 10

# Check health
if curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
fi

if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ Frontend is healthy${NC}"
else
    echo -e "${RED}❌ Frontend health check failed${NC}"
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}🎉 Deployment completed!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Access your application at:"
echo -e "  ${BLUE}Frontend: http://localhost:3000${NC}"
echo -e "  ${BLUE}Backend API: http://localhost:3001/api${NC}"
echo ""
echo "View logs:"
echo -e "  ${YELLOW}docker logs -f nexocrm-backend${NC}"
echo -e "  ${YELLOW}docker logs -f nexocrm-frontend${NC}"
echo ""
echo "Stop services:"
echo -e "  ${YELLOW}docker-compose -f docker-compose.prod.yml down${NC}"
echo ""
