import { LambdaStage } from './stack-containers/lambda-stack/lambda-stage';
import { S3Stage } from './stack-containers/s3-stack/s3-stage';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import { Construct, SecretValue, Stack, StackProps } from '@aws-cdk/core';
import { CdkPipeline, SimpleSynthAction } from "@aws-cdk/pipelines";
import * as ssm from '@aws-cdk/aws-ssm';
import { CodeBuildAction } from '@aws-cdk/aws-codepipeline-actions';

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

    // This is where we add the application stages. Enable this line and git push again to check
    pipeline.addApplicationStage(new LambdaStage(this, 'LambdaStage', {env: { account: '171709546961', region: 'us-east-1' }}));
    pipeline.addApplicationStage(new S3Stage(this, 'S3Stage', {env: { account: '171709546961', region: 'us-east-1' }}));

  }
}