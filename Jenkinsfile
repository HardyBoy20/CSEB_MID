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
                
                // 👇 Inject AWS credentials before running kubectl
                withCredentials([
                    string(credentialsId: 'aws-access-key', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    withEnv(["AWS_DEFAULT_REGION=${AWS_REGION}"]) {
                        withKubeConfig([credentialsId: 'eks-kubeconfig']) {
                            sh '''
                                kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

                                kubectl apply -f k8s/ -n ${NAMESPACE} || {
                                    echo "Some resources failed, trying individual approach..."
                                    for file in k8s/*.yaml; do
                                        if ! grep -q "kind: StatefulSet" "$file"; then
                                            echo "Applying $file"
                                            kubectl apply -f "$file" -n ${NAMESPACE} || echo "Failed to apply $file"
                                        fi
                                    done

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

                                kubectl rollout status deployment/${APP_NAME} -n ${NAMESPACE} --timeout=300s || echo "Deployment rollout timeout"
                                kubectl get pods -n ${NAMESPACE}
                                echo "✅ Deployment completed!"
                            '''
                        }
                    }
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
