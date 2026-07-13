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
        ECR_REPOSITORY = '245987718650.dkr.ecr.ap-south-2.amazonaws.com/smart-hospital'
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

        stage('Upload Build to S3') {
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
                    docker build -t $IMAGE_NAME:latest .
                '''
            }
        }

        stage('Login to Amazon ECR') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-s3'
                ]]) {
                    sh '''
                        aws ecr get-login-password --region $AWS_DEFAULT_REGION \
                        | docker login --username AWS --password-stdin 245987718650.dkr.ecr.ap-south-2.amazonaws.com
                    '''
                }
            }
        }

        stage('Push Image to Amazon ECR') {
            steps {
                sh '''
                    docker tag $IMAGE_NAME:latest $ECR_REPOSITORY:latest
                    docker push $ECR_REPOSITORY:latest
                '''
            }
        }

        stage('Deploy Docker Container') {
            steps {
                sh '''
                    echo "Stopping existing container..."

                    docker stop $CONTAINER_NAME || true
                    docker rm $CONTAINER_NAME || true

                    echo "Removing any container using port 8081..."

                    docker ps -q --filter publish=8081 | xargs -r docker stop
                    docker ps -aq --filter publish=8081 | xargs -r docker rm

                    echo "Starting new container..."

                    docker run -d \
                        --name $CONTAINER_NAME \
                        --restart unless-stopped \
                        -p 8081:80 \
                        $IMAGE_NAME:latest

                    docker ps
                '''
            }
        }
    }

    post {

        success {
            echo '✅ Build completed successfully.'
            echo '✅ React application built.'
            echo '✅ Production build uploaded to Amazon S3.'
            echo '✅ Docker image pushed to Amazon ECR.'
            echo '✅ Docker container deployed successfully.'
        }

        failure {
            echo '❌ Pipeline failed.'

            sh '''
                echo "Docker Containers:"
                docker ps -a || true

                echo "Docker Images:"
                docker images || true
            '''
        }

        always {
            cleanWs()
        }
    }
}