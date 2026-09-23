# Setup Instructions for nexocrm Project

## Prerequisites

Before setting up the project, you'll need to install:

1. **Node.js** (version 18 or higher)
2. **npm** (usually comes with Node.js)
3. **Docker** (optional but recommended for full environment setup)

## Installation Steps

### 1. Install Node.js and npm
- Visit https://nodejs.org/ and download the LTS version
- Install it following the installer instructions
- Verify installation:
```bash
node --version
npm --version
```

### 2. Install Docker (Optional but Recommended)
- Visit https://www.docker.com/products/docker-desktop/
- Download and install Docker Desktop for Mac
- Start Docker Desktop application

### 3. Clone the Repository
```bash
git clone <repository-url>
cd nexocrm
```

### 4. Set up Environment Variables
Create a `.env` file in the root directory:
```bash
cp .env.production.example .env
# Edit .env with appropriate values for your local environment
```

### 5. Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 6. Install Backend Dependencies
```bash
cd ../backend
npm install
```

## Running the Application

### Option 1: Using Docker (Recommended)
If you have Docker installed:
```bash
# Build and start containers
docker-compose up --build
```

### Option 2: Local Development
#### Start the backend server:
```bash
cd backend
npm run dev
```

#### Start the frontend development server:
```bash
cd ../frontend
npm run dev
```

## Project Structure
- `frontend/` - Next.js React application
- `backend/` - Node.js Express API with Prisma ORM
- `docker-compose.yml` - Docker configuration for local environment

## Development Commands
- `npm run dev` - Start development server (frontend)
- `npm run build` - Build production version (frontend)
- `npm run lint` - Run code linting
- `npm run migrate` - Run database migrations (backend)
- `npm run prisma:generate` - Generate Prisma client (backend)

## Access the Application
Once running:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api