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
        
        stage('Inject Environment Variables') {
            steps {
                script {
                    // Inject environment variables from Jenkins Credentials
                    withCredentials([
                        file(credentialsId: 'backend-env', variable: 'BACKEND_ENV'),
                        file(credentialsId: 'frontend-env', variable: 'FRONTEND_ENV')
                    ]) {
                        // Copy backend environment variables
                        sh 'cp "$BACKEND_ENV" backend/.env'
                        
                        // Copy frontend environment variables
                        sh 'cp "$FRONTEND_ENV" frontend/.env'
                        
                        // Prepare global .env from example template for Docker Compose configuration
                        sh 'cp .env.example .env'
                    }
                }
            }
        }

        stage('Clean Up Existing Containers') {
            steps {
                script {
                    echo 'Stopping and removing existing containers...'
                    sh 'docker compose down --remove-orphans'
                }
            }
        }
        
        stage('Build & Deploy Containers') {
            steps {
                script {
                    // Build and start the containers in detached mode
                    sh 'docker compose up -d --build'

                    sh 'rm -f backend/.env frontend/.env .env'
                }
            }
        }
        
        stage('Initialize Data (Optional)') {
            steps {
                script {
                    // This can be run manually if needed, or uncommented for first run
                    // sh 'docker-compose exec -T backend npm run import-data'
                    echo 'Skipping automatic data initialization. Run "docker-compose exec backend npm run import-data" manually if needed.'
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
