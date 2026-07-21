pipeline {
    agent any
    
    environment {
        COMPOSE_PROJECT_NAME = 'safety-facility'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Prepare Directories') {
            steps {
                script {
                    echo 'Preparing directories and setting permissions...'
                    sh 'mkdir -p backend frontend'
                    sh 'chmod 755 backend frontend || true'
                    sh 'chmod 666 backend/.env frontend/.env || true'
                }
            }
        }

        stage('Inject Environment Variables') {
            steps {
                script {
                    withCredentials([
                        file(credentialsId: 'backend-env', variable: 'BACKEND_ENV'),
                        file(credentialsId: 'frontend-env', variable: 'FRONTEND_ENV')
                    ]) {
                        sh 'cp "$BACKEND_ENV" backend/.env'
                        sh 'cp "$FRONTEND_ENV" frontend/.env'
                        echo 'Environment variables injected successfully.'
                    }
                }
            }
        }

        stage('Clean Up Existing Services') {
            steps {
                script {
                    echo 'Stopping old containers and cleaning networks...'
                    // docker-compose 기준으로 컨테이너, 네트워크 깔끔하게 정돈
                    sh 'docker compose down --remove-orphans || true'
                }
            }
        }
        
        stage('Build & Deploy Services') {
            steps {
                script {
                    echo 'Building images and deploying all services with Docker Compose...'
                    sh 'docker compose up -d --build'

                    echo 'Cleaning up injected env files...'
                    sh 'rm -f backend/.env frontend/.env'
                }
            }
        }
    }
    
    post {
        always {
            echo 'Deployment Pipeline Completed.'
        }
        success {
            echo 'Deployment Successful.'
        }
        failure {
            echo 'Deployment Failed. Check logs.'
        }
    }
}