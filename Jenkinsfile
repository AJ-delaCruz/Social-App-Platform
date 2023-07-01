pipeline {
    agent any 

    environment {
        MONGODB_URL = "${MONGODB_URL}"
        JWT_SECRET = "${JWT_SECRET}"
    }

    stages {
        stage('Build test images') {
            steps {
                script {
                    echo 'Building Docker images for testing...'
                    sh 'docker-compose -f docker-compose.test.yml build'
                }
            }
        }
        stage('Test') {
            steps {
                script {
                    echo 'Testing...'
                    sh 'docker-compose -f docker-compose.test.yml up'
                }
            }
        }
        stage('Build production images') {
            steps {
                script {
                    echo 'Building docker images for production ...'
                    // sh 'docker-compose -f docker-compose.yml build'
                }
            }
        }
        stage('Push images') {
            steps {
                script {
                    echo 'Pushing docker images...'
                    // withCredentials([usernamePassword(credentialsId: 'dockerhub-id', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PW')]) {

                        // sh 'docker login -u $DOCKER_USER -p $DOCKER_PW'
                        // sh 'echo $DOCKER_PW | docker login --username $DOCKER_USER --password-stdin'
                        // sh 'docker push aj09/social-server'
                        // sh 'docker push aj09/social-client'
                    // }
                }
            }
        }
        stage('Deploy') {
            steps {
                script {
                    echo 'Deploying...'
                }
            }
        }
    }
    // post {
    //     always {  
    //         sh 'docker logout'           
    //     }   
    // }
}
