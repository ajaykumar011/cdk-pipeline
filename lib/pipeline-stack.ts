import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import { Construct, SecretValue, Stack, StackProps } from '@aws-cdk/core';
import { CdkPipeline, ShellScriptAction, SimpleSynthAction } from "@aws-cdk/pipelines";
import * as ssm from '@aws-cdk/aws-ssm';
import { CodeBuildAction } from '@aws-cdk/aws-codepipeline-actions';
import { LambdaStage } from './stack-containers/lambda-stack/lambda-stage';
import { S3Stage } from './stack-containers/s3-stack/s3-stage';
import { EFSStage } from './stack-containers/efs-stack/efs-stage';
import { Ec2AnsibleStage } from './stack-containers/ec2-ansible-stack/ec2ansible-stage';
import {Role, ServicePrincipal, ManagedPolicy} from '@aws-cdk/aws-iam';
import codebuild = require("@aws-cdk/aws-codebuild");
import * as iam from '@aws-cdk/aws-iam';
import { VpcLink } from '@aws-cdk/aws-apigateway';
import ec2 = require("@aws-cdk/aws-ec2")
import { CrossAcRoleStage } from './stack-containers/cross-ac-role-stack/crossacrole-stage';
import { CrossAcRoleAssumeStage } from './stack-containers/cross-ac-role-stack/crossacroleassume-stage';
import { Ec2WindowsStage } from './stack-containers/ec2-windows-stack/ec2windows-stage';

/**
 * The stack that defines the application pipeline
 */
export class CdkPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const sourceArtifact = new codepipeline.Artifact();
    const cloudAssemblyArtifact = new codepipeline.Artifact();



    // get the secureString if you do not want constly kms
    // const MyGitHubToken = ssm.StringParameter.fromSecureStringParameterAttributes(this,'MyGitHubToken', {
    //       parameterName: 'github-token',
    //       version: 1,
    //      });

    // const myvpc = ec2.Vpc.fromVpcAttributes(this, 'mycorpvpc', {
    //   vpcId: 'vpc-0ea9df83e5abca880',
    //   availabilityZones: ['us-east-1a', 'us-east-1b'],
    //   isolatedSubnetIds: ['subnet-0c897deac488dd832', 'subnet-05f1017c99b6823f7'], //If you vpc has NAT
    //   //publicSubnetIds: ['subnet-01fdaee98e1031d59', 'subnet-0e7423fba027047f2'],
    //   isolatedSubnetRouteTableIds: ['rtb-095cf2b93e11a61d3', 'rtb-0ab9187d7eb7450c5'] // If you hvae no NAT and using Private subnet
    //   //publicSubnetRouteTableIds: ['rtb-04290cb937189269d', 'rtb-0247f02cbca0b8802']
    //   });

    const pipeline = new CdkPipeline(this, 'Pipeline', {
      // The pipeline name

      pipelineName: 'MyServicePipeline',
      cloudAssemblyArtifact,

      // Where the source can be found
      sourceAction: new codepipeline_actions.GitHubSourceAction({
        actionName: 'GitHub',
        output: sourceArtifact,
        oauthToken: SecretValue.secretsManager('github-token'),
        owner: 'ajaykumar011',
        repo: 'cdk-pipeline',
        branch: 'main'
      }),

       // How it will be built and synthesized
       synthAction: SimpleSynthAction.standardNpmSynth({
         sourceArtifact,
         cloudAssemblyArtifact,
      // Use this to customize and a permissions required for the build and synth
        rolePolicyStatements: [
          new iam.PolicyStatement({
            actions: ['sts:AssumeRole', 'sts:GetServiceBearerToken', 'sts:GetAccessKeyInfo', 'sts:GetCallerIdentity','sts:GetSessionToken' ],
            resources: ['*'],
          }),
        ],

         // We need a build step to compile the TypeScript Lambda
         buildCommand: 'npm run build'
         //buildCommand: 'npm run build && npm test'
       }),
    });

    const buildStage = pipeline.addStage('BuildStage');
    const shellScriptAction = new ShellScriptAction({
      actionName: "shellScriptAction",
      commands: [
        "echo foo"
      ],
      additionalArtifacts: [sourceArtifact],
      runOrder: buildStage.nextSequentialRunOrder()
    });

    buildStage.addActions(shellScriptAction);

    shellScriptAction.project.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "sts:AssumeRole",
        "sts:GetAccessKeyInfo",
        "sts:GetCallerIdentity",
        "sts:GetSessionToken"
      ],
      resources: ["*"]
    }));



    const setupServerStage = pipeline.addStage("setup-ec2-server");
    const ansibleBuild = new codebuild.PipelineProject(this, "ansible-pipeline", {
      description: "Ansible Build",
      projectName: "Ansible-poc-build2",
      //vpc: myvpc,
      //role: iam.Role.fromRoleArn(this, 'roleforcrossac', 'arn:aws:iam::171709546961:role/ec2-describle-role-from-sharedac-receiveassumer-role', {mutable: false}),
      environment: {buildImage:codebuild.LinuxBuildImage.AMAZON_LINUX_2_3,},
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [
            //'yum update -y',
            'aws --version',
            'aws sts get-caller-identity',
            'export AWS_DEFAULT_REGION=us-east-1',
            'python --version',
            'pip --version',
            'pip list',
            'pip install ansible==2.9',
            'pip install pywinrm[credssp]',
            'ansible --version',
            'ansible-galaxy collection install amazon.aws',
            'ansible localhost -a "which python3"',
            'mkdir -p ansible-cb',
            'cp -rf assets/ansible2/* ansible-cb/',
            'cd ansible-cb',
            'pwd && ls',
            //'printenv',
            // 'ASSUME_ROLE_ARN="arn:aws:iam::171709546961:role/Assume_Role_Permssion_for_Cb_to_assumerole"',
            // 'TEMP_ROLE=`aws sts assume-role --role-arn $ASSUME_ROLE_ARN --role-session-name test`',cd -
            // 'export TEMP_ROLE',
            // 'echo $TEMP_ROLE',
            // 'export AWS_ACCESS_KEY_ID=$(echo "${TEMP_ROLE}" | jq -r ".Credentials.AccessKeyId")',
            // 'export AWS_SECRET_ACCESS_KEY=$(echo "${TEMP_ROLE}" | jq -r ".Credentials.SecretAccessKey")',
            // 'export AWS_SESSION_TOKEN=$(echo "${TEMP_ROLE}" | jq -r ".Credentials.SessionToken")',
            // 'echo $AWS_ACCESS_KEY_ID',
            // 'echo $AWS_SECRET_ACCESS_KEY',
            // 'echo $AWS_SESSION_TOKEN',
            // 'aws ec2 describe-instances --region us-east-1'
            'aws sts get-caller-identity',
            'mkdir -p ~/.aws/ && touch ~/.aws/config',
            'echo "[profile buildprofile]" >> ~/.aws/config',
            'echo "arn:aws:iam::719087115411:role/cross_ac_ec2s3_readonly_accessto_otherac" >> ~/.aws/config',
            'echo "credential_source = Ec2InstanceMetadata" >> ~/.aws/config',
            'aws sts get-caller-identity --profile buildprofile',
            'cat ~/.aws/config'

            //'ansible-playbook win_ping.yml'

            ]
          },
          build: {
            commands: [
              'ls'
            ]
          }
        },
        artifacts: {
          files: [
            '**/*',
          ],
        }
      }),
    });



    //Not
    // ansibleBuild.addToRolePolicy(new iam.PolicyStatement({
    //     effect: iam.Effect.ALLOW,
    //     resources: ["*"],
    //     actions: [
    //     "sts:AssumeRole",
    //     "sts:GetAccessKeyInfo",
    //     "sts:GetCallerIdentity",
    //     "sts:GetSessionToken"
    //     ]
    //   }));

    setupServerStage.addActions(new codepipeline_actions.CodeBuildAction({
      actionName: "run-ansible-playbook",
      project: ansibleBuild,
      input: sourceArtifact,
      //runOrder: 1,
    }));


    // This is where we add the application stages. Enable this line and git push again to check
    // Shared: 171709546961, Dev(non-prod): 719087115411, Prod: 263877540751
    //pipeline.addApplicationStage(new LambdaStage(this, 'LambdaStage', {env: { account: '719087115411', region: 'us-east-1' }}));
    pipeline.addApplicationStage(new S3Stage(this, 'S3Stage', {env: { account: '263877540751', region: 'us-east-1' }}));
    pipeline.addApplicationStage(new CrossAcRoleStage(this, 'CrossacRoleGiver', {env: { account: '719087115411', region: 'us-east-1' }}));
    pipeline.addApplicationStage(new CrossAcRoleAssumeStage(this, 'CrossacRoleAssumerReceiver', {env: { account: '171709546961', region: 'us-east-1' }}));
    pipeline.addApplicationStage(new Ec2WindowsStage(this, 'Ec2WindowsStack', {env: { account: '719087115411', region: 'us-east-1' }}));

    //pipeline.addApplicationStage(new EFSStage(this, 'EFSStage', {env: { account: '719087115411', region: 'us-east-1' }}));
    //pipeline.addApplicationStage(new Ec2AnsibleStage(this, 'Ec2AnsibleStage', {env: { account: '171709546961', region: 'us-east-1' }}));

  }
}
