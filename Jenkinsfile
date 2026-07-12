pipeline {
    agent any

    tools {
        nodejs 'NodeJS-24'
    }

    environment {
        AWS_DEFAULT_REGION = 'ap-south-2'
        S3_BUCKET = 'smart-hospital-build-artifacts-ziauddin'
        IMAGE_NAME = 'smart-hospital'
        CONTAINER_NAME = 'smart-hospital'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Build React App') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Archive Artifacts') {
            steps {
                archiveArtifacts artifacts: 'dist/**', fingerprint: true
            }
        }

        stage('Upload to S3') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-s3'
                ]]) {
                    sh '''
                        aws s3 sync dist/ s3://$S3_BUCKET --delete
                    '''
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                    docker build -t $IMAGE_NAME .
                '''
            }
        }

        stage('Deploy Docker Container') {
            steps {
                sh '''
                    docker stop $CONTAINER_NAME || true
                    docker rm $CONTAINER_NAME || true

                    docker run -d \
                      --name $CONTAINER_NAME \
                      -p 8081:80 \
                      $IMAGE_NAME
                '''
            }
        }
    }

    post {
        success {
            echo 'Application built, uploaded to S3, and deployed with Docker.'
        }

        failure {
            echo 'Pipeline failed.'
        }
    }
}