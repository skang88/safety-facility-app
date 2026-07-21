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
                    // Reset permissions of existing .env files if they exist to prevent overwrite issues
                    sh 'chmod 666 backend/.env frontend/.env || true'
                }
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
                        echo '--- Checking backend/.env ---'
                        sh 'cat backend/.env'
                        
                        // Copy frontend environment variables
                        sh 'cp "$FRONTEND_ENV" frontend/.env'
                        echo '--- Checking frontend/.env ---'
                        sh 'cat frontend/.env'
                    }
                }
            }
        }

        stage('Clean Up Existing Containers') {
            steps {
                script {
                    echo 'Stopping and removing existing containers...'
                    sh 'docker rm -f frontend || true'
                    sh 'docker rm -f backend || true'
                }
            }
        }
        
        stage('Build & Deploy Containers') {
            steps {
                script {
                    echo 'Creating docker network...'
                    sh 'docker network create safety-net || true'

                    echo 'Building backend image...'
                    sh 'docker build -t safety-backend:latest ./backend'

                    echo 'Building frontend image...'
                    sh 'docker build -t safety-frontend:latest ./frontend'

                    echo 'Deploying backend container...'
                    sh '''
                        docker run -d --name backend \
                          --network safety-net \
                          --security-opt apparmor=unconfined \
                          -p 5050:5000 \
                          -e PORT=5000 \
                          -e MONGO_URI=mongodb://mongo:27017/safety_facilities \
                          -v backend-uploads:/app/uploads \
                          safety-backend:latest
                    '''

                    echo 'Deploying frontend container...'
                    sh '''
                        docker run -d --name frontend \
                          --network safety-net \
                          --security-opt apparmor=unconfined \
                          -p 8090:80 \
                          safety-frontend:latest
                    '''

                    echo 'Cleaning up env files...'
                    sh 'rm -f backend/.env frontend/.env'
                }
            }
        }
        
        stage('Initialize Data (Optional)') {
            steps {
                script {
                    echo 'Skipping automatic data initialization. Run "docker exec -it backend npm run import-data" manually if needed.'
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
