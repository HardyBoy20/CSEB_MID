# Docker Deployment Guide for Skill Exchange

This guide will help you deploy your Skill Exchange application using Docker with proper volumes for data persistence.

## Prerequisites

Make sure you have Docker and Docker Compose installed on your system:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) for Windows/Mac
- Or Docker Engine + Docker Compose for Linux

## Quick Start

1. **Build and start all services:**
   ```bash
   docker-compose up --build
   ```

2. **Access your application:**
   - Open your browser and go to: `http://localhost:3000`
   - Your frontend and backend will be running together

3. **Stop the services:**
   ```bash
   docker-compose down
   ```

## Services Overview

### 🚀 Application Service (`skillexchange-app`)
- **Port:** 3000
- **Purpose:** Runs your Node.js backend and serves static frontend files
- **Volumes:**
  - `app_uploads`: Stores user-uploaded files (profile pictures, etc.)
  - `app_logs`: Stores application logs
- **Dependencies:** Waits for MongoDB to be healthy before starting

### 🗄️ MongoDB Service (`skillexchange-mongodb`)
- **Port:** 27017
- **Purpose:** Database for storing user data, posts, and application data
- **Volumes:**
  - `mongodb_data`: Persistent storage for database data
  - `mongodb_config`: Persistent storage for MongoDB configuration
- **Database Name:** `skillExchange`

## Volume Management

### Available Volumes
All volumes are named for easy identification:
- `skillexchange_mongodb_data`: MongoDB database files
- `skillexchange_mongodb_config`: MongoDB configuration files
- `skillexchange_app_uploads`: User uploaded files (profile pics, post images)
- `skillexchange_app_logs`: Application log files

### Backup Volumes
To backup your data:
```bash
# List all volumes
docker volume ls

# Backup MongoDB data
docker run --rm -v skillexchange_mongodb_data:/data -v $(pwd):/backup alpine tar czf /backup/mongodb-backup.tar.gz -C /data .

# Backup uploaded files
docker run --rm -v skillexchange_app_uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz -C /data .
```

### Restore Volumes
To restore from backup:
```bash
# Restore MongoDB data
docker run --rm -v skillexchange_mongodb_data:/data -v $(pwd):/backup alpine tar xzf /backup/mongodb-backup.tar.gz -C /data

# Restore uploaded files
docker run --rm -v skillexchange_app_uploads:/data -v $(pwd):/backup alpine tar xzf /backup/uploads-backup.tar.gz -C /data
```

## Useful Docker Commands

### Development Commands
```bash
# Build and start in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f app
docker-compose logs -f mongodb

# Stop services
docker-compose down

# Stop services and remove volumes (⚠️ DANGER: This will delete all data)
docker-compose down -v
```

### Maintenance Commands
```bash
# Access MongoDB shell
docker exec -it skillexchange-mongodb mongosh skillExchange

# Access application container bash
docker exec -it skillexchange-app sh

# Check container status
docker-compose ps

# Restart specific service
docker-compose restart app
```

### Image Management
```bash
# Rebuild application image
docker-compose build app

# Remove unused images
docker image prune

# View all images
docker images
```

## Environment Configuration

The application uses environment variables for configuration:
- **Production Mode:** Uses `MONGO_URI=mongodb://mongodb:27017/skillExchange`
- **Development Mode:** Use your local `.env` file

## Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   # Check what's using port 3000
   netstat -ano | findstr :3000
   # Kill the process or change the port in docker-compose.yml
   ```

2. **MongoDB connection issues:**
   ```bash
   # Check MongoDB logs
   docker-compose logs mongodb
   # Restart MongoDB service
   docker-compose restart mongodb
   ```

3. **File upload issues:**
   ```bash
   # Check if uploads volume is properly mounted
   docker volume inspect skillexchange_app_uploads
   ```

### Health Checks
Both services have health checks configured:
- **App:** Checks if HTTP server responds on port 3000
- **MongoDB:** Checks database connectivity using mongosh

### Data Persistence
Even if containers are deleted, your data remains safe in Docker volumes:
- User registrations and login data
- All skill posts and listings  
- Uploaded profile pictures and post images
- Application logs for debugging

## Security Notes
- MongoDB runs without authentication for development
- For production, consider adding MongoDB authentication
- The application runs in production mode inside containers
- Static files are served directly by the Node.js application

## Performance Tips
- Use `docker-compose up -d` to run in background
- Monitor resource usage with `docker stats`
- Clean up unused images/containers regularly
- Consider using Docker BuildKit for faster builds
