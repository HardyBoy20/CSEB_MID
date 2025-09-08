# PowerShell script to start Skill Exchange Docker application
# Run this script to build and start your application

Write-Host "🚀 Starting Skill Exchange Docker Application..." -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Check if Docker is running
Write-Host "Checking Docker status..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running or not installed" -ForegroundColor Red
    Write-Host "Please install Docker Desktop and make sure it's running" -ForegroundColor Yellow
    exit 1
}

# Check if Docker Compose is available
Write-Host "Checking Docker Compose..." -ForegroundColor Yellow
try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not available" -ForegroundColor Red
    exit 1
}

# Build and start the application
Write-Host "Building and starting services..." -ForegroundColor Yellow
Write-Host "This may take a few minutes on first run..." -ForegroundColor Cyan

try {
    docker-compose up --build -d
    
    Write-Host ""
    Write-Host "🎉 Application started successfully!" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "🌐 Open your browser and go to: http://localhost:3000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 Useful commands:" -ForegroundColor Yellow
    Write-Host "  • View logs:     docker-compose logs -f" -ForegroundColor White
    Write-Host "  • Stop services: docker-compose down" -ForegroundColor White
    Write-Host "  • Check status:  docker-compose ps" -ForegroundColor White
    Write-Host ""
    Write-Host "📁 Data is persisted in Docker volumes even if containers are deleted" -ForegroundColor Cyan
    
    # Wait a moment for services to fully start
    Write-Host "Waiting for services to fully initialize..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Check if services are healthy
    $status = docker-compose ps --format json | ConvertFrom-Json
    $allHealthy = $true
    
    foreach ($service in $status) {
        if ($service.State -ne "running") {
            $allHealthy = $false
            Write-Host "⚠️  Service $($service.Service) is not running" -ForegroundColor Yellow
        }
    }
    
    if ($allHealthy) {
        Write-Host "✅ All services are running properly!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Some services may need more time to start. Check with: docker-compose logs" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Failed to start the application" -ForegroundColor Red
    Write-Host "Check the error above or run: docker-compose logs" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📖 For more details, see DOCKER-DEPLOYMENT.md" -ForegroundColor Cyan
