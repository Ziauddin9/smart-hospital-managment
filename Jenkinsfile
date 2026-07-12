pipeline {
    agent any

    tools {
        nodejs 'NodeJS-24'
    }

    environment {
        AWS_DEFAULT_REGION = 'ap-south-2'
        S3_BUCKET = 'smart-hospital-build-artifacts-ziauddin'
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

        stage('Build') {
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
    }

    post {
        success {
            echo 'Build completed and uploaded to S3.'
        }

        failure {
            echo 'Build failed.'
        }
    }
}