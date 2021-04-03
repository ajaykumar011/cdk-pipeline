#!/bin/bash
BASE_PROFILE=ajprod
ASSUME_ROLE_ARN="arn:aws:iam::719087115411:role/cross_ac_ec2s3_readonly_accessto_otherac"

export AWS_PROFILE=$BASE_PROFILE
TEMP_ROLE=`aws sts assume-role --role-arn $ASSUME_ROLE_ARN --role-session-name test`
export TEMP_ROLE
echo $TEMP_ROLE
export AWS_ACCESS_KEY_ID=$(echo "${TEMP_ROLE}" | jq -r ".Credentials.AccessKeyId")
export AWS_SECRET_ACCESS_KEY=$(echo "${TEMP_ROLE}" | jq -r ".Credentials.SecretAccessKey")
export AWS_SESSION_TOKEN=$(echo "${TEMP_ROLE}" | jq -r ".Credentials.SessionToken")
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY
echo $AWS_SESSION_TOKEN
echo "Getting Details from other account assuming the ec2 readonly access is available"
aws ec2 describe-instances --region us-east-1


# Other Method (mostly used with Docker)

aws sts get-caller-identity
mkdir -p ~/.aws/ && touch ~/.aws/config
echo "[profile buildprofile]" > ~/.aws/config
echo "arn:aws:iam::719087115411:role/cross_ac_ec2s3_readonly_accessto_otherac" >> ~/.aws/config
echo "credential_source = Ec2InstanceMetadata" >> ~/.aws/config
aws sts get-caller-identity --profile buildprofile