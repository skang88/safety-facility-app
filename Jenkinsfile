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
        
        stage('Build & Deploy Containers') {
            steps {
                script {
                    // Build and start the containers in detached mode
                    sh 'docker compose up -d --build'
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
