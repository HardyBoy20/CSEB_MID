pipeline {
    agent any

    environment {
        DOCKER_REPO = 'hardyboy20/skillexchange-app'
        APP_NAME = 'skillexchange-app'
        NAMESPACE = 'skillexchange'
        AWS_REGION = 'ap-south-1' // 👈 set your AWS region
    }

    stages {
        stage('Build') {
            steps {
                echo '🔨 Building Docker image...'
                sh '''
                    docker build -t ${DOCKER_REPO}:${BUILD_NUMBER} .
                    docker build -t ${DOCKER_REPO}:latest .
                    echo "✅ Built: ${DOCKER_REPO}:${BUILD_NUMBER}"
                '''
            }
        }

        stage('Test') {
            steps {
                echo '🧪 Testing application...'
                sh '''
                    docker run --rm -d --name test-db mongo:7.0
                    sleep 10

                    docker run --rm --link test-db:mongodb \
                        -e MONGO_URI=mongodb://mongodb:27017/test \
                        ${DOCKER_REPO}:${BUILD_NUMBER} \
                        node -e "console.log('✅ App test passed')"

                    docker stop test-db
                '''
            }
        }

        stage('Push') {
            steps {
                echo '📤 Pushing to Docker Hub...'
                withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                    sh '''
                        echo $PASS | docker login -u $USER --password-stdin
                        docker push ${DOCKER_REPO}:${BUILD_NUMBER}
                        docker push ${DOCKER_REPO}:latest
                        echo "✅ Pushed to Docker Hub"
                    '''
                }
            }
        }

        stage('Deploy') {
            steps {
                echo '🚀 Deploying to Kubernetes...'
                sh '''
                    sed -i "s|image: .*skillexchange.*|image: ${DOCKER_REPO}:${BUILD_NUMBER}|g" k8s/*.yaml
                    sed -i "s|image: hardyboy20/project-4:.*|image: ${DOCKER_REPO}:${BUILD_NUMBER}|g" k8s/*.yaml
                '''

                withCredentials([
                    string(credentialsId: 'aws-access-key-id', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY'),
                    file(credentialsId: 'eks-kubeconfig', variable: 'KUBECONFIG')
                ]) {
                    sh '''
                        export AWS_DEFAULT_REGION=${AWS_REGION}
                        echo "✅ Using AWS credentials for EKS in region ${AWS_REGION}"

                        # Ensure namespace exists
                        kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

                        # Apply manifests
                        kubectl apply -f k8s/ -n ${NAMESPACE} || {
                            echo "⚠️ Bulk apply failed, applying individually..."
                            for file in k8s/*.yaml; do
                                echo "Applying $file"
                                kubectl apply -f "$file" -n ${NAMESPACE} || echo "Failed to apply $file"
                            done
                        }

                        # Wait for deployment rollout
                        kubectl rollout status deployment/${APP_NAME} -n ${NAMESPACE} --timeout=300s || echo "⚠️ Deployment rollout timeout"

                        # Show final status
                        kubectl get pods -n ${NAMESPACE}
                        echo "✅ Deployment completed!"
                    '''
                }
            }
        }
    }

    post {
        always {
            sh 'docker system prune -f || true'
        }
        success {
            echo "🎉 SUCCESS: Skill Exchange Board deployed!"
            echo "🌐 Access your app at: http://localhost:30080"
            echo "📊 Check status: kubectl get all -n ${NAMESPACE}"
        }
        failure {
            echo "❌ FAILED: Pipeline failed. Check logs above."
        }
    }
}
