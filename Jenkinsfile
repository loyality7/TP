pipeline {
    agent any
    
    environment {
        // 1. CHANGE THESE DOCKER CONFIGURATIONS
        DOCKER_IMAGE = 'test-platform-backend'          // Your image name
        DOCKER_REGISTRY = 'babuthehacker'        // Your Docker Hub username
        // 2. ADD YOUR CREDENTIALS ID FROM JENKINS
        DOCKER_CREDENTIALS = credentials('docker')  // Jenkins credentials ID
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                // 3. VERIFY THIS PATH MATCHES YOUR PROJECT STRUCTURE
                dir('backend') {
                    sh 'npm ci'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                dir('backend') {
                    sh """
                        docker build -t ${DOCKER_REGISTRY}/${DOCKER_IMAGE}:${BUILD_NUMBER} .
                        docker tag ${DOCKER_REGISTRY}/${DOCKER_IMAGE}:${BUILD_NUMBER} ${DOCKER_REGISTRY}/${DOCKER_IMAGE}:latest
                    """
                }
            }
        }
        
        stage('Push Docker Image') {
            steps {
                sh """
                    echo ${DOCKER_CREDENTIALS_PSW} | docker login -u ${DOCKER_CREDENTIALS_USR} --password-stdin
                    docker push ${DOCKER_REGISTRY}/${DOCKER_IMAGE}:${BUILD_NUMBER}
                    docker push ${DOCKER_REGISTRY}/${DOCKER_IMAGE}:latest
                """
            }
        }
        
        stage('Deploy') {
            steps {
                // 5. CHANGE THESE DEPLOYMENT CONFIGURATIONS
                sshagent(['ssh']) {  // Replace with your Jenkins SSH credentials ID
                    sh """
                        ssh ubuntu@16.170.231.220 ' \
                        cd /home/ubuntu/test-platform && \
                        docker pull ${DOCKER_REGISTRY}/${DOCKER_IMAGE}:latest && \
                        docker compose down && \
                        docker compose up -d'
                    """
                }
            }
        }
    }
    
    post {
        always {
            // 6. MODIFY CLEANUP SETTINGS IF NEEDED
            sh 'docker system prune -f'
            // Add any additional cleanup steps
        }
    }
}