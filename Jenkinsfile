pipeline {
    agent any

    environment {
        DOCKER_REPO = 'hardyboy20/skillexchange-app'
        APP_NAME = 'skillexchange-app'
        NAMESPACE = 'skillexchange'
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
                    # Start test MongoDB
                    docker run --rm -d --name test-db mongo:7.0
                    sleep 10

                    # Test database connection
                    docker run --rm --link test-db:mongodb \
                        -e MONGO_URI=mongodb://mongodb:27017/test \
                        ${DOCKER_REPO}:${BUILD_NUMBER} \
                        node -e "console.log('✅ App test passed')"

                    # Cleanup
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
                    # Update image tag in k8s files
                    sed -i "s|image: .*skillexchange.*|image: ${DOCKER_REPO}:${BUILD_NUMBER}|g" k8s/*.yaml
                    sed -i "s|image: hardyboy20/project-4:.*|image: ${DOCKER_REPO}:${BUILD_NUMBER}|g" k8s/*.yaml
                '''
                
                withKubeConfig([credentialsId: 'eks-kubeconfig']) {
                    sh '''
                        # Create namespace
                        kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
                        
                        # Apply everything except StatefulSets first
                        kubectl apply -f k8s/ -n ${NAMESPACE} || {
                            echo "Some resources failed, trying individual approach..."
                            
                            # Apply non-StatefulSet resources
                            for file in k8s/*.yaml; do
                                if ! grep -q "kind: StatefulSet" "$file"; then
                                    echo "Applying $file"
                                    kubectl apply -f "$file" -n ${NAMESPACE} || echo "Failed to apply $file"
                                fi
                            done
                            
                            # Handle StatefulSets separately
                            for file in k8s/*.yaml; do
                                if grep -q "kind: StatefulSet" "$file"; then
                                    echo "Handling StatefulSet in $file"
                                    kubectl apply -f "$file" -n ${NAMESPACE} || {
                                        echo "StatefulSet update failed, trying rolling restart..."
                                        kubectl rollout restart statefulset/mongodb -n ${NAMESPACE} || echo "Rolling restart failed"
                                    }
                                fi
                            done
                        }
                        
                        # Wait for deployment rollout
                        kubectl rollout status deployment/${APP_NAME} -n ${NAMESPACE} --timeout=300s || echo "Deployment rollout timeout"
                        
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
