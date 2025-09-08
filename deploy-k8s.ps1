# PowerShell script for quick Kubernetes deployment
# Run this script to deploy Skill Exchange to Kubernetes

param(
    [string]$Namespace = "skillexchange",
    [string]$ImageTag = "latest",
    [switch]$DryRun = $false
)

Write-Host "🚀 Deploying Skill Exchange to Kubernetes..." -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "Namespace: $Namespace" -ForegroundColor Cyan
Write-Host "Image Tag: $ImageTag" -ForegroundColor Cyan

# Check if kubectl is available
try {
    kubectl version --client=true | Out-Null
    Write-Host "✅ kubectl is available" -ForegroundColor Green
} catch {
    Write-Host "❌ kubectl is not available" -ForegroundColor Red
    Write-Host "Please install kubectl and configure kubeconfig" -ForegroundColor Yellow
    exit 1
}

# Check cluster connectivity
try {
    kubectl cluster-info | Out-Null
    Write-Host "✅ Connected to Kubernetes cluster" -ForegroundColor Green
} catch {
    Write-Host "❌ Cannot connect to Kubernetes cluster" -ForegroundColor Red
    Write-Host "Please check your kubeconfig" -ForegroundColor Yellow
    exit 1
}

$dryRunFlag = if ($DryRun) { "--dry-run=client" } else { "" }

try {
    # Create namespace
    Write-Host "📝 Creating namespace..." -ForegroundColor Yellow
    kubectl create namespace $Namespace $dryRunFlag 2>$null
    
    # Apply ConfigMap and Secrets
    Write-Host "🔧 Applying ConfigMap and Secrets..." -ForegroundColor Yellow
    kubectl apply -f k8s/app-configmap.yaml -n $Namespace $dryRunFlag
    kubectl apply -f k8s/app-secret.yaml -n $Namespace $dryRunFlag
    
    # Deploy MongoDB
    Write-Host "🗄️ Deploying MongoDB StatefulSet..." -ForegroundColor Yellow
    kubectl apply -f k8s/mongo-statefulset.yaml -n $Namespace $dryRunFlag
    kubectl apply -f k8s/mongo-service.yaml -n $Namespace $dryRunFlag
    
    if (!$DryRun) {
        Write-Host "⏳ Waiting for MongoDB to be ready..." -ForegroundColor Yellow
        kubectl wait --for=condition=ready pod -l app=mongodb --timeout=300s -n $Namespace
        Write-Host "✅ MongoDB is ready!" -ForegroundColor Green
    }
    
    # Update deployment with image tag
    Write-Host "🔄 Updating deployment with image tag: $ImageTag..." -ForegroundColor Yellow
    (Get-Content k8s/app-deployment.yaml) -replace 'IMAGE_TAG_PLACEHOLDER', $ImageTag | Set-Content k8s/app-deployment-temp.yaml
    
    # Deploy application
    Write-Host "🚀 Deploying application..." -ForegroundColor Yellow
    kubectl apply -f k8s/app-deployment-temp.yaml -n $Namespace $dryRunFlag
    kubectl apply -f k8s/app-service.yaml -n $Namespace $dryRunFlag
    
    # Cleanup temp file
    Remove-Item k8s/app-deployment-temp.yaml -ErrorAction SilentlyContinue
    
    if (!$DryRun) {
        Write-Host "⏳ Waiting for deployment to complete..." -ForegroundColor Yellow
        kubectl rollout status deployment/skillexchange-app -n $Namespace --timeout=300s
        Write-Host "✅ Application deployment complete!" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "🎉 Deployment successful!" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    
    if (!$DryRun) {
        Write-Host "📋 Deployment Status:" -ForegroundColor Yellow
        kubectl get all -n $Namespace
        
        Write-Host ""
        Write-Host "🌐 Access Information:" -ForegroundColor Yellow
        kubectl get services -n $Namespace
        
        Write-Host ""
        Write-Host "💡 Quick Commands:" -ForegroundColor Cyan
        Write-Host "  • View logs:    kubectl logs -f deployment/skillexchange-app -n $Namespace" -ForegroundColor White
        Write-Host "  • Scale app:    kubectl scale deployment skillexchange-app --replicas=5 -n $Namespace" -ForegroundColor White
        Write-Host "  • Check pods:   kubectl get pods -n $Namespace" -ForegroundColor White
        Write-Host "  • Access DB:    kubectl exec -it mongodb-0 -n $Namespace -- mongosh skillExchange" -ForegroundColor White
    }
    
} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
