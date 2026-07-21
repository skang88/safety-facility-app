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
                    echo 'Stopping old containers if running...'
                    // 기존 개별 docker run으로 떠 있던 컨테이너 충돌 방지 및 컴포즈 내리기
                    sh 'docker rm -f backend frontend mongo mongo-express || true'
                    sh 'docker compose down || true'
                }
            }
        }
        
        stage('Build & Deploy Services') {
            steps {
                script {
                    echo 'Building images and deploying all services with Docker Compose...'
                    // --build 옵션으로 최신 코드를 반영하여 이미지를 빌드하고 백그라운드로 실행
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