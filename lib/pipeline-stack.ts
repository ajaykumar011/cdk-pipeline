import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import { Construct, SecretValue, Stack, StackProps } from '@aws-cdk/core';
import { CdkPipeline, SimpleSynthAction } from "@aws-cdk/pipelines";
import * as ssm from '@aws-cdk/aws-ssm';
import { CodeBuildAction } from '@aws-cdk/aws-codepipeline-actions';
import { LambdaStage } from './stack-containers/lambda-stack/lambda-stage';
import { S3Stage } from './stack-containers/s3-stack/s3-stage';
import { EFSStage } from './stack-containers/efs-stack/efs-stage';
import { Ec2AnsibleStage } from './stack-containers/ec2-ansible-stack/ec2ansible-stage';
import {Role, ServicePrincipal, ManagedPolicy} from '@aws-cdk/aws-iam';
import codebuild = require("@aws-cdk/aws-codebuild")
import { VpcLink } from '@aws-cdk/aws-apigateway';
import ec2 = require("@aws-cdk/aws-ec2")

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

    const myvpc = ec2.Vpc.fromVpcAttributes(this, 'mycorpvpc', {
      vpcId: 'vpc-0ea9df83e5abca880',
      availabilityZones: ['us-east-1a', 'us-east-1b'],
      privateSubnetIds: ['subnet-0c897deac488dd832', 'subnet-05f1017c99b6823f7'],
      })

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
         // We need a build step to compile the TypeScript Lambda
         buildCommand: 'npm run build'
         //buildCommand: 'npm run build && npm test'
       }),
    });

    const setupServerStage = pipeline.addStage("setup-ec2-server");
    const ansibleBuild = new codebuild.PipelineProject(this, "ansible-pipeline", {
      description: "Ansible Build",
      projectName: "Ansible-poc-build",
      vpc: myvpc,
      environment: {buildImage:codebuild.LinuxBuildImage.AMAZON_LINUX_2_3,},
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [
            'yum update -y',
            'aws --version',
            'aws sts get-caller-identity',
            'export AWS_DEFAULT_REGION=us-east-1',
            'python --version',
            'pip --version',
            'pip list',
            'pip install ansible==2.9',
            'ansible --version',
            'ansible-galaxy collection install amazon.aws',
            'ansible localhost -a "which python3"'
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
    })

    setupServerStage.addActions(new codepipeline_actions.CodeBuildAction({
      actionName: "run-ansible-playbook",
      project: ansibleBuild,
      input:sourceArtifact
    }));

    // This is where we add the application stages. Enable this line and git push again to check
    //Shared: 171709546961, Dev: 719087115411, Prod: 263877540751
    //pipeline.addApplicationStage(new LambdaStage(this, 'LambdaStage', {env: { account: '719087115411', region: 'us-east-1' }}));
    pipeline.addApplicationStage(new S3Stage(this, 'S3Stage', {env: { account: '263877540751', region: 'us-east-1' }}));
    //pipeline.addApplicationStage(new EFSStage(this, 'EFSStage', {env: { account: '719087115411', region: 'us-east-1' }}));
    //pipeline.addApplicationStage(new Ec2AnsibleStage(this, 'Ec2AnsibleStage', {env: { account: '171709546961', region: 'us-east-1' }}));

  }
}