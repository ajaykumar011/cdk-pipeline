#!/bin/bash

#PS1='\[\033[1;36m\]\u\[\033[1;31m\]:\[\033[1;32m\]\W:$\[\033[0m\] '
#CC Setup

sudo apt-get -y install git unzip tree
alias python='python3'
alias pip='pip3'
python --version && pip --version
curl -O https://bootstrap.pypa.io/get-pip.py
python3 get-pip.py --user

aws codecommit help
cdk init --language typescript

#AWS Keys
export AWS_ACCESS_KEY_ID="xxx"
export AWS_SECRET_ACCESS_KEY="xxxxxxx"
export AWS_SESSION_TOKEN="xxxxxx"
export AWS_DEFAULT_REGION='us-east-1'
aws sts get-caller-identity

sudo pip install git-remote-codecommit
git --version
git checkout -b main
git branch -d master  # to deleter master branch

git config --global user.email "ajay011.sharma@hotmail.com"
git config --global user.name "Ajay Kumar"

git remote add origin git@github.com:ajaykumar011/cdk-pipeline.git
git branch -M main
git add -A && git commit -m "some updates"
git push -u origin main

#git clone https://git-codecommit.us-east-1.amazonaws.com/v1/repos/sepiacdk-pipeline pipeline

npm install @aws-cdk/aws-codedeploy @aws-cdk/aws-lambda @aws-cdk/aws-codebuild @aws-cdk/aws-codepipeline
npm install @aws-cdk/aws-codecommit @aws-cdk/aws-codepipeline-actions

rm -rf test #delete the test dir
git remote -v
git add . && git commit -m "update" && git push origin main


#modern style cdk and deployment
# In cdk.json (enable modern style stack synthesis)
# {
#   // ...
#   "context": {
#     "@aws-cdk/core:newStyleStackSynthesis": true
#   }
# }

# export CDK_NEW_BOOTSTRAP=1
# cdk bootstrap




# cdk bootstrap --show-template



# In CI/CD account (Shared Ac)
export CDK_NEW_BOOTSTRAP=1

#In Shared Account
cdk bootstrap --bootstrap-customer-key --cloudformation-execution-policies 'arn:aws:iam::aws:policy/AdministratorAccess' aws://171709546961/us-east-1

# In Dev account
cdk bootstrap --bootstrap-customer-key --cloudformation-execution-policies 'arn:aws:iam::aws:policy/AdministratorAccess' --trust 171709546961 aws://719087115411/us-east-1

# In Prod account
cdk bootstrap --bootstrap-customer-key --cloudformation-execution-policies 'arn:aws:iam::aws:policy/AdministratorAccess' --trust 171709546961 aws://263877540751/us-east-1


#--no-bootstrap-customer-key

# # Go to Each Account and and run the bootsrapping 
# #Make sure your AWS organisation have the required policy of ECR, S3, CF etc.


# cdk bootstrap --no-bootstrap-customer-key --cloudformation-execution-policies 'arn:aws:iam::aws:policy/AdministratorAccess' aws://171709546961/us-east-1
# cdk bootstrap --no-bootstrap-customer-key  --cloudformation-execution-policies 'arn:aws:iam::aws:policy/AdministratorAccess' --trust 171709546961 aws://719087115411/us-east-1
# cdk bootstrap --no-bootstrap-customer-key --cloudformation-execution-policies 'arn:aws:iam::aws:policy/AdministratorAccess' --trust 171709546961 aws://263877540751/us-east-1



# After first push- This creates a  CDK pipeline
################################################################################################################################

git clone <clone id>
# 'npm run build' first to make sure there are no typos 
cdk bootstrap aws://<current_ac>>//<region>
cdk deploy

#this will fail for the first time. 


npm run build
git commit -am 'Add PreProd stage'
git push