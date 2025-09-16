# Ubuntu Server Setup Commands - Step by Step Guide

## 🚀 Prerequisites Setup on Ubuntu Server

### Step 1: Update System and Install Dependencies
```bash
# Update package lists
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget gnupg lsb-release software-properties-common

# Install Git (if not already installed)
sudo apt install -y git
```

### Step 2: Install Docker and Docker Compose
```bash
# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update package lists and install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add your user to docker group (replace 'ubuntu' with your username if different)
sudo usermod -aG docker ubuntu

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Verify Docker installation
docker --version
docker compose version
```

### Step 3: Install Node.js
```bash
# Install Node.js 18 (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 4: Install AWS CLI
```bash
# Download and install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
sudo apt install -y unzip
unzip awscliv2.zip
sudo ./aws/install

# Verify installation
aws --version

# Configure AWS credentials (replace with your actual credentials)
aws configure
# AWS Access Key ID: YOUR_ACCESS_KEY
# AWS Secret Access Key: YOUR_SECRET_KEY  
# Default region name: us-east-1
# Default output format: json
```

### Step 5: Install kubectl
```bash
# Download kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

# Install kubectl
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Verify installation
kubectl version --client
```

### Step 6: Clone Your Repository
```bash
# Clone your project repository
git clone https://github.com/your-username/project-4.git
cd project-4

# Verify files are present
ls -la
```

## 🐳 Docker Build and Test Commands

### Step 7: Build Docker Image
```bash
# Build the Docker image
sudo docker build -t skillexchange-app:latest .

# List images to verify
sudo docker images

# Tag for different purposes
sudo docker tag skillexchange-app:latest skillexchange-app:v1.0
```

### Step 8: Test Docker Container
```bash
# Create uploads directory
mkdir -p public/uploads

# Run container for testing
sudo docker run -d \
  --name test-skillexchange \
  -p 3000:3000 \
  -v $(pwd)/public/uploads:/app/public/uploads:rw \
  skillexchange-app:latest

# Check container status
sudo docker ps

# View container logs
sudo docker logs test-skillexchange

# Test application (replace with your actual health endpoint)
curl http://localhost:3000

# Stop and remove test container
sudo docker stop test-skillexchange
sudo docker rm test-skillexchange
```

## 🐙 Docker Compose Deployment

### Step 9: Deploy with Docker Compose
```bash
# Create necessary directories
mkdir -p ./data/mongo
mkdir -p ./logs

# Start services
sudo docker compose up -d

# Check service status
sudo docker compose ps

# View logs
sudo docker compose logs -f

# Test application
curl http://localhost:3000

# Scale application (optional)
sudo docker compose up -d --scale app=3

# Stop services
sudo docker compose down

# Stop and remove volumes (CAUTION: This removes data)
sudo docker compose down -v
```

## 📦 Push to Container Registries

### Step 10: Push to Docker Hub
```bash
# Login to Docker Hub (you'll be prompted for credentials)
sudo docker login

# Tag image for Docker Hub (replace 'yourusername' with your Docker Hub username)
sudo docker tag skillexchange-app:latest hardyboy20/skillexchange-app:latest
sudo docker tag skillexchange-app:latest hardyboy20/skillexchange-app:v1.0

# Push to Docker Hub
sudo docker push hardyboy20/skillexchange-app:latest
sudo docker push hardyboy20/skillexchange-app:v1.0
```

### Step 11: Push to AWS ECR
```bash
# Create ECR repository (if not exists)
aws ecr create-repository --repository-name skillexchange-app --region ap-south-1

# Get ECR login token
aws ecr get-login-password --region us-east-1 | sudo docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Tag image for ECR (replace YOUR_ACCOUNT_ID with your AWS account ID)
sudo docker tag skillexchange-app:latest 904233117138.dkr.ecr.ap-south-1.amazonaws.com/skillexchange-app
sudo docker tag skillexchange-app:latest 904233117138.dkr.ecr.ap-south-1.amazonaws.com/skillexchange-app

# Push to ECR
sudo docker push 904233117138.dkr.ecr.ap-south-1.amazonaws.com/skillexchange-app
sudo docker push 904233117138.dkr.ecr.ap-south-1.amazonaws.com/skillexchange-app
```

## ☸️ Kubernetes Deployment

### Step 12: Set up Kubernetes (if using EKS)
```bash
# Create EKS cluster (this takes 10-15 minutes)
eksctl create cluster \
  --name skillexchange-clusters \
  --region ap-south-1 \
  --nodegroup-name worker-nodes \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 4 \
  --managed

# Update kubeconfig
aws eks update-kubeconfig --region ap-south-1 --name skillexchange-clusters

# Verify cluster connection
kubectl get nodes
```

### Step 13: Deploy Application to Kubernetes
```bash
# Apply all Kubernetes manifests
kubectl apply -f k8s/

# Check namespace
kubectl get namespaces

# Check deployments
kubectl get deployments -n skillexchange

# Check pods
kubectl get pods -n skillexchange

# Check services
kubectl get services -n skillexchange

# Get external LoadBalancer URL
kubectl get service skillexchange-app-service -n skillexchange

# Check application logs
kubectl logs -f deployment/skillexchange-app -n skillexchange
```

## 🔧 Jenkins Setup with Ansible

### Step 14: Install Ansible and Run Playbook
```bash
# Install Ansible
sudo apt install -y ansible

# Update inventory file with your EC2 details
nano ansible/inventory.ini
# Replace YOUR_EC2_PUBLIC_IP with your actual EC2 IP
# Replace path to your SSH key

# Run the Jenkins setup playbook
ansible-playbook -i ansible/inventory.ini ansible/jenkins-setup.yml -v

# Check Jenkins status
sudo systemctl status jenkins

# Get initial admin password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

### Step 15: Configure Jenkins
```bash
# Access Jenkins at: http://YOUR_EC2_IP:8080
# Use the initial admin password from previous step

# Complete setup wizard:
# 1. Install suggested plugins
# 2. Create admin user
# 3. Configure Jenkins URL
```

## 🔐 Configure Jenkins Credentials
After Jenkins setup, add these credentials in Jenkins UI:

1. **dockerhub-credentials** (Username with password)
   - Username: Your Docker Hub username
   - Password: Your Docker Hub password/token

2. **aws-access-key-id** (Secret text)
   - Value: Your AWS Access Key ID

3. **aws-secret-access-key** (Secret text)
   - Value: Your AWS Secret Access Key

4. **kubeconfig** (Secret file)
   - Upload your kubeconfig file (usually ~/.kube/config)

## 🚀 Pipeline Execution Commands

### Step 16: Set up GitHub Webhook
```bash
# In GitHub repository settings:
# 1. Go to Settings > Webhooks
# 2. Add webhook: http://YOUR_JENKINS_IP:8080/github-webhook/
# 3. Content type: application/json
# 4. Select "Just the push event"
```

### Step 17: Create Jenkins Pipeline Job
```bash
# In Jenkins:
# 1. New Item > Pipeline
# 2. Pipeline script from SCM
# 3. Git repository: https://github.com/HardyBoy20/CSEB_PS.git
# 4. Branch: */main
# 5. Script path: Jenkinsfile
```

## 🧪 Testing Commands

### Test Docker Build
```bash
sudo docker build -t test-build .
sudo docker run --rm test-build npm test
```

### Test Docker Compose
```bash
sudo docker compose -f docker-compose.yml up --build -d
curl http://localhost:3000
sudo docker compose down
```

### Test Kubernetes Deployment
```bash
kubectl apply -f k8s/ --dry-run=client
kubectl get all -n skillexchange
kubectl port-forward service/skillexchange-app-service 8080:80 -n skillexchange
curl http://localhost:8080
```

## 📊 Monitoring Commands

### Docker Monitoring
```bash
# Check container stats
sudo docker stats

# Check container logs
sudo docker compose logs -f app

# Check system resource usage
sudo docker system df
```

### Kubernetes Monitoring
```bash
# Check cluster resource usage
kubectl top nodes
kubectl top pods -n skillexchange

# Check pod events
kubectl describe pod POD_NAME -n skillexchange

# Check service endpoints
kubectl get endpoints -n skillexchange
```

## 🔄 Maintenance Commands

### Docker Cleanup
```bash
# Remove unused images
sudo docker image prune -a

# Remove unused containers
sudo docker container prune

# Remove unused volumes
sudo docker volume prune

# Full system cleanup
sudo docker system prune -a --volumes
```

### Kubernetes Maintenance
```bash
# Restart deployment
kubectl rollout restart deployment/skillexchange-app -n skillexchange

# Scale deployment
kubectl scale deployment skillexchange-app --replicas=5 -n skillexchange

# Update image
kubectl set image deployment/skillexchange-app skillexchange-app=yourusername/skillexchange-app:v2.0 -n skillexchange

# Check rollout status
kubectl rollout status deployment/skillexchange-app -n skillexchange
```

## ⚠️ Important Notes

1. **Security**: Never commit credentials to Git. Use environment variables or Jenkins credentials.
2. **Resource Limits**: Monitor resource usage to avoid cost overruns in AWS.
3. **Backup**: Regular backups of MongoDB data and configurations.
4. **Updates**: Keep Docker images and Kubernetes manifests updated.
5. **Monitoring**: Set up proper monitoring and alerting for production.

## 🚨 Troubleshooting Quick Fixes

### If Docker build fails:
```bash
sudo docker system prune -a
sudo docker build --no-cache -t skillexchange-app:latest .
```

### If Kubernetes pods won't start:
```bash
kubectl describe pod POD_NAME -n skillexchange
kubectl logs POD_NAME -n skillexchange --previous
```

### If LoadBalancer doesn't get external IP:
```bash
# Check AWS Load Balancer Controller is installed
kubectl get pods -n kube-system | grep aws-load-balancer

# If not installed, install it:
# Follow AWS Load Balancer Controller installation guide
```

---

**Remember**: Replace placeholder values (YOUR_ACCOUNT_ID, yourusername, YOUR_EC2_IP) with your actual values!
