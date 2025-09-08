# CI/CD Pipeline Guide for Skill Exchange

This guide provides comprehensive instructions for setting up a complete CI/CD pipeline using Jenkins, Docker, AWS ECR, Docker Hub, and Kubernetes deployment with load balancing.

## 🏗️ Architecture Overview

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   GitHub    │───▶│   Jenkins    │───▶│   Docker    │
│  Repository │    │   Pipeline   │    │   Build     │
└─────────────┘    └──────────────┘    └─────────────┘
                           │                    │
                           ▼                    ▼
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│ Kubernetes  │◀───│    Push      │───▶│  Docker Hub │
│  Cluster    │    │   Images     │    │  & AWS ECR  │
└─────────────┘    └──────────────┘    └─────────────┘
```

## 📋 Prerequisites

### Required Tools & Services
- ✅ **Jenkins Server** with Docker and kubectl installed
- ✅ **Docker Hub Account** for public image registry
- ✅ **AWS Account** with ECR access for private image registry
- ✅ **Kubernetes Cluster** (EKS, GKE, AKS, or self-managed)
- ✅ **Git Repository** with your source code

### Required Jenkins Plugins
- Docker Pipeline Plugin
- Kubernetes Plugin
- AWS Steps Plugin
- Git Plugin
- Pipeline Plugin
- Credentials Binding Plugin

## 🔐 Setup Credentials in Jenkins

### 1. Docker Hub Credentials
```
Jenkins Dashboard → Manage Jenkins → Credentials → Global → Add Credentials
- Kind: Username with password
- ID: dockerhub-credentials
- Username: your-dockerhub-username
- Password: your-dockerhub-token
```

### 2. AWS ECR Credentials
```
Configure AWS CLI on Jenkins server:
aws configure
AWS Access Key ID: your-access-key
AWS Secret Access Key: your-secret-key
Default region name: us-east-1
```

### 3. Kubernetes Config
```
Jenkins Dashboard → Manage Jenkins → Credentials → Global → Add Credentials
- Kind: Secret file
- ID: kubeconfig
- File: Upload your kubeconfig file
```

## 🚀 Pipeline Configuration

### 1. Update Jenkinsfile Variables

Edit the `Jenkinsfile` and update these variables:

```groovy
environment {
    // Update with your Docker Hub username
    DOCKERHUB_REPO = 'your-dockerhub-username/skillexchange-app'
    
    // Update with your AWS account ID and region
    AWS_REGION = 'us-east-1'
    ECR_REGISTRY = 'your-account-id.dkr.ecr.us-east-1.amazonaws.com'
    ECR_REPO = 'skillexchange-app'
    
    // Update namespace as needed
    NAMESPACE = 'skillexchange'
}
```

### 2. Update Kubernetes Deployment Image

Edit `k8s/app-deployment.yaml` and update the image repository:

```yaml
containers:
- name: skillexchange-app
  image: your-dockerhub-username/skillexchange-app:IMAGE_TAG_PLACEHOLDER
```

### 3. Update Secrets

Edit `k8s/app-secret.yaml` and update the base64 encoded values:

```bash
# Encode your actual values
echo -n "your-actual-mongo-uri" | base64
echo -n "your-actual-jwt-secret" | base64
echo -n "your-twilio-account-sid" | base64
echo -n "your-twilio-auth-token" | base64
echo -n "your-twilio-phone-number" | base64
```

## 🎯 Deployment Process

### Phase 1: Jenkins Pipeline Setup

1. **Create Jenkins Pipeline Job:**
   ```
   Jenkins Dashboard → New Item → Pipeline
   - Name: skillexchange-cicd
   - Definition: Pipeline script from SCM
   - SCM: Git
   - Repository URL: your-git-repo-url
   - Script Path: Jenkinsfile
   ```

2. **Configure Webhook (Optional):**
   ```
   GitHub Repository → Settings → Webhooks → Add webhook
   - Payload URL: http://your-jenkins-server/github-webhook/
   - Content type: application/json
   - Events: Push events
   ```

### Phase 2: AWS ECR Setup

1. **Create ECR Repository:**
   ```bash
   aws ecr create-repository --repository-name skillexchange-app --region us-east-1
   ```

2. **Get ECR Login Command:**
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account-id.dkr.ecr.us-east-1.amazonaws.com
   ```

### Phase 3: Kubernetes Cluster Setup

1. **Create Namespace:**
   ```bash
   kubectl create namespace skillexchange
   ```

2. **Apply Configurations:**
   ```bash
   # Apply in order
   kubectl apply -f k8s/app-configmap.yaml -n skillexchange
   kubectl apply -f k8s/app-secret.yaml -n skillexchange
   kubectl apply -f k8s/mongo-statefulset.yaml -n skillexchange
   kubectl apply -f k8s/mongo-service.yaml -n skillexchange
   kubectl apply -f k8s/app-deployment.yaml -n skillexchange
   kubectl apply -f k8s/app-service.yaml -n skillexchange
   ```

## 🔄 Pipeline Stages Explained

### Stage 1: Checkout
- Pulls latest code from Git repository
- Sets up workspace for build

### Stage 2: Build Info
- Displays build metadata
- Shows commit hash and build number

### Stage 3: Build Docker Image
- Builds Docker image using Dockerfile
- Tags for both Docker Hub and ECR
- Creates both versioned and latest tags

### Stage 4: Test Application
- Runs connectivity tests with MongoDB
- Validates application startup
- Ensures basic functionality

### Stage 5: Push to Docker Hub
- Authenticates with Docker Hub
- Pushes images to public registry
- Available at: `docker pull your-username/skillexchange-app`

### Stage 6: Push to AWS ECR
- Authenticates with AWS ECR
- Creates repository if needed
- Pushes images to private registry

### Stage 7: Deploy to Kubernetes
- Creates namespace if needed
- Applies ConfigMaps and Secrets
- Deploys MongoDB StatefulSet
- Waits for MongoDB readiness
- Deploys application with new image tag
- Waits for deployment completion

### Stage 8: Health Check
- Verifies pod status
- Tests application responsiveness
- Confirms successful deployment

## 🌐 Access Your Application

### LoadBalancer Access
```bash
# Get external IP
kubectl get services -n skillexchange

# Your app will be available at:
# http://<EXTERNAL-IP>
```

### NodePort Access
```bash
# Get node IP and port
kubectl get nodes -o wide
kubectl get service skillexchange-app-nodeport -n skillexchange

# Access via: http://<NODE-IP>:30080
```

### Ingress Access (if configured)
```bash
# Your app will be available at:
# https://skillexchange.yourdomain.com
```

## 📊 Monitoring & Management

### Check Deployment Status
```bash
# Check all resources
kubectl get all -n skillexchange

# Check pods
kubectl get pods -n skillexchange -o wide

# Check services
kubectl get services -n skillexchange

# Check persistent volumes
kubectl get pv,pvc -n skillexchange
```

### View Logs
```bash
# Application logs
kubectl logs -f deployment/skillexchange-app -n skillexchange

# MongoDB logs
kubectl logs -f statefulset/mongodb -n skillexchange

# All container logs
kubectl logs -f --all-containers=true deployment/skillexchange-app -n skillexchange
```

### Scale Application
```bash
# Manual scaling
kubectl scale deployment skillexchange-app --replicas=5 -n skillexchange

# Auto-scaling is configured via HPA (2-10 replicas based on CPU/Memory)
kubectl get hpa -n skillexchange
```

## 🛠️ Troubleshooting

### Common Issues

1. **Image Pull Errors:**
   ```bash
   # Check if image exists
   docker pull your-dockerhub-username/skillexchange-app:latest
   
   # Check image tags
   kubectl describe pod <pod-name> -n skillexchange
   ```

2. **MongoDB Connection Issues:**
   ```bash
   # Check MongoDB pod status
   kubectl get pods -l app=mongodb -n skillexchange
   
   # Test MongoDB connectivity
   kubectl exec -it mongodb-0 -n skillexchange -- mongosh --eval "db.adminCommand('ping')"
   ```

3. **LoadBalancer Not Getting External IP:**
   ```bash
   # Check cloud provider support
   kubectl get events -n skillexchange
   
   # Use NodePort as alternative
   kubectl patch service skillexchange-app-service -n skillexchange -p '{"spec":{"type":"NodePort"}}'
   ```

### Debug Commands
```bash
# Describe problematic resources
kubectl describe deployment skillexchange-app -n skillexchange
kubectl describe service skillexchange-app-service -n skillexchange
kubectl describe pods -l app=skillexchange-app -n skillexchange

# Check events
kubectl get events --sort-by='.lastTimestamp' -n skillexchange

# Access container shell
kubectl exec -it deployment/skillexchange-app -n skillexchange -- sh
```

## 🔄 Pipeline Maintenance

### Manual Pipeline Trigger
```bash
# Via Jenkins UI
Jenkins → skillexchange-cicd → Build Now

# Via Jenkins CLI
java -jar jenkins-cli.jar -s http://jenkins-server build skillexchange-cicd
```

### Update Application
1. Push code changes to Git repository
2. Pipeline automatically triggers (if webhook configured)
3. New Docker image builds with incremented tag
4. Kubernetes deployment updates with zero downtime

### Rollback Deployment
```bash
# Check rollout history
kubectl rollout history deployment/skillexchange-app -n skillexchange

# Rollback to previous version
kubectl rollout undo deployment/skillexchange-app -n skillexchange

# Rollback to specific revision
kubectl rollout undo deployment/skillexchange-app --to-revision=2 -n skillexchange
```

## 🏥 Health Monitoring

### Application Health Endpoints
- **Liveness Probe:** `GET /` (checks if app is running)
- **Readiness Probe:** `GET /` (checks if app is ready to serve traffic)

### MongoDB Health Checks
- **Liveness Probe:** `mongosh --eval "db.adminCommand('ping')"`
- **Readiness Probe:** `mongosh --eval "db.adminCommand('ping')"`

### Monitoring Commands
```bash
# Check pod health
kubectl get pods -n skillexchange -o wide

# Check resource usage
kubectl top pods -n skillexchange
kubectl top nodes

# Check auto-scaling status
kubectl get hpa -n skillexchange -w
```

## 📈 Performance Optimization

### Horizontal Pod Autoscaler (HPA)
- **Min Replicas:** 2
- **Max Replicas:** 10
- **CPU Target:** 70%
- **Memory Target:** 80%

### Resource Management
- **App Requests:** 256Mi RAM, 250m CPU
- **App Limits:** 512Mi RAM, 500m CPU
- **DB Requests:** 512Mi RAM, 250m CPU
- **DB Limits:** 1Gi RAM, 500m CPU

### Storage
- **App Uploads:** 10Gi persistent volume
- **App Logs:** 5Gi persistent volume
- **MongoDB Data:** 20Gi persistent volume
- **MongoDB Config:** 1Gi persistent volume

## 🔒 Security Best Practices

### Container Security
- ✅ Non-root user execution
- ✅ Read-only root filesystem where possible
- ✅ Capability dropping
- ✅ Security context configuration

### Network Security
- ✅ Network policies for MongoDB access control
- ✅ Internal ClusterIP services
- ✅ Proper ingress configuration with SSL

### Secrets Management
- ✅ Kubernetes Secrets for sensitive data
- ✅ Base64 encoding for secret values
- ✅ Separate secrets for different components

## 🌍 Multi-Environment Setup

### Development Environment
```bash
# Use different namespace
NAMESPACE=skillexchange-dev
kubectl create namespace $NAMESPACE

# Apply with dev-specific configs
kubectl apply -f k8s/ -n $NAMESPACE
```

### Staging Environment
```bash
# Use staging namespace
NAMESPACE=skillexchange-staging
kubectl create namespace $NAMESPACE

# Apply with staging configs
kubectl apply -f k8s/ -n $NAMESPACE
```

### Production Environment
```bash
# Use production namespace
NAMESPACE=skillexchange-prod
kubectl create namespace $NAMESPACE

# Apply with production configs (with authentication enabled)
kubectl apply -f k8s/ -n $NAMESPACE
```

## 📊 Cost Optimization

### Resource Right-Sizing
- Monitor actual resource usage
- Adjust requests/limits based on metrics
- Use HPA for automatic scaling

### Storage Optimization
- Use appropriate storage classes
- Set up lifecycle policies for logs
- Consider using shared storage for uploads

### Image Optimization
- Use multi-stage builds
- Regular image cleanup
- Consider using smaller base images

## 🚨 Disaster Recovery

### Backup Strategy
```bash
# Backup MongoDB data
kubectl exec -it mongodb-0 -n skillexchange -- mongodump --out /tmp/backup
kubectl cp skillexchange/mongodb-0:/tmp/backup ./mongodb-backup

# Backup persistent volumes
kubectl get pvc -n skillexchange
# Use cloud provider volume snapshots
```

### Restore Process
```bash
# Restore MongoDB data
kubectl cp ./mongodb-backup skillexchange/mongodb-0:/tmp/backup
kubectl exec -it mongodb-0 -n skillexchange -- mongorestore /tmp/backup
```

## 📞 Support & Maintenance

### Regular Tasks
- Monitor resource usage weekly
- Review and rotate secrets monthly
- Update base images quarterly
- Review and optimize costs monthly

### Emergency Procedures
- Scale down: `kubectl scale deployment skillexchange-app --replicas=0 -n skillexchange`
- Emergency rollback: `kubectl rollout undo deployment/skillexchange-app -n skillexchange`
- Database maintenance: Access via `kubectl exec -it mongodb-0 -n skillexchange -- mongosh`

## 🎯 Next Steps

1. **Set up monitoring** with Prometheus and Grafana
2. **Configure alerting** for critical issues
3. **Implement automated testing** in the pipeline
4. **Add security scanning** for container images
5. **Set up log aggregation** with ELK stack or similar
6. **Configure backup automation** for data protection

## 📚 Additional Resources

- [Jenkins Pipeline Documentation](https://www.jenkins.io/doc/book/pipeline/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Hub Documentation](https://docs.docker.com/docker-hub/)
- [AWS ECR Documentation](https://docs.aws.amazon.com/ecr/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)

---

## ⚡ Quick Start Commands

### Start Everything
```bash
# 1. Run Jenkins pipeline
# Trigger via webhook or manual build

# 2. Check deployment status
kubectl get all -n skillexchange

# 3. Get application URL
kubectl get service skillexchange-app-service -n skillexchange
```

### Useful One-Liners
```bash
# Quick health check
kubectl get pods -n skillexchange | grep -E "(Running|Ready)"

# Quick resource usage
kubectl top pods -n skillexchange --sort-by=memory

# Quick logs from all app pods
kubectl logs -f -l app=skillexchange-app -n skillexchange --all-containers=true

# Quick scale up for high traffic
kubectl scale deployment skillexchange-app --replicas=8 -n skillexchange
```

---

**🎉 Your Skill Exchange application is now enterprise-ready with full CI/CD automation, high availability, and production-grade monitoring!**
