# Welcome to your CDK TypeScript project!

Cdk bootstrap in each region

# Go to Each Account and and run the bootsrapping 
# Make sure your AWS organisation have the required policy of ECR, S3, CF etc.
cdk init

cdk bootstrap --no-bootstrap-customer-key --cloudformation-execution-policies 'arn:aws:iam::aws:policy/AdministratorAccess' aws://171709xxx61/us-east-1
cdk bootstrap --no-bootstrap-customer-key  --cloudformation-execution-policies 'arn:aws:iam::aws:policy/AdministratorAccess' --trust 1717xx6961 aws://719xxx15411/us-east-1
cdk bootstrap --no-bootstrap-customer-key --cloudformation-execution-policies 'arn:aws:iam::aws:policy/AdministratorAccess' --trust 1717xx961 aws://2638xxx0751/us-east-1



# After first push This creates a  CDK pipeline

`*git clone <clone id>`
`*cdk bootstrap aws://<current_ac>>//<region>`
`*cdk ls`
`*cdk deploy`

this Pipeline will fail for the first time.

## Now add /enable in the  pipeline-stack.ts on the top

`import { LambdaStage } from './stack-containers/lambda-stack/lambda-stage';`
`import { S3Stage } from './stack-containers/s3-stack/s3-stage';`

## Enable or edit the lines in pipeline-stack.ts

`pipeline.addApplicationStage(new LambdaStage(this, 'LambdaStage', {env: { account: '171709546961', region: 'us-east-1' }}));`
`pipeline.addApplicationStage(new S3Stage(this, 'S3Stage', {env: { account: '171709546961', region: 'us-east-1' }}));`

# Run the command after above changes
git add . && git commit -m "stackupdate" && git push


## Please note cdk pipeline does not destroy its application till now. 
Hence if you want to destroy any application, you may need to destroy them manully from destinatin cloudformation either via console or CLI or SDK.