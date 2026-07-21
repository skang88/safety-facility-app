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
                    // Jenkins Credentials에서 .env 파일 주입 (기존 방식 유지)
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
                    echo 'Stopping old containers...'
                    // 기존에 떠 있던 개별 컨테이너 삭제
                    sh 'docker rm -f backend frontend mongo || true'
                    sh 'docker compose down --remove-orphans || true'

                }
            }
        }
        
        stage('Build & Deploy Services') {
            steps {
                script {
                    echo 'Building images and deploying all services with Docker Compose...'
                    // docker-compose.yml 기반으로 전체 서비스 빌드 및 실행
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