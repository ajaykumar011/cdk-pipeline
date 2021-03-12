import { CdkpipelinesDemoStage } from './cdkpipelines-demo-stage';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import { Construct, SecretValue, Stack, StackProps } from '@aws-cdk/core';
import { CdkPipeline, SimpleSynthAction } from "@aws-cdk/pipelines";
import * as ssm from '@aws-cdk/aws-ssm';

/**
 * The stack that defines the application pipeline
 */
export class CdkpipelinesDemoPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const sourceArtifact = new codepipeline.Artifact();
    const cloudAssemblyArtifact = new codepipeline.Artifact();
    // get the secureString if you do not want constly kms
    const MyGitHubToken = ssm.StringParameter.fromSecureStringParameterAttributes(this,'MyGitHubToken', {
          parameterName: 'github-token',
          version: 1,
         });
 
    const pipeline = new CdkPipeline(this, 'Pipeline', {
      // The pipeline name
      pipelineName: 'MyServicePipeline',
      cloudAssemblyArtifact,

      // Where the source can be found
      sourceAction: new codepipeline_actions.GitHubSourceAction({
        actionName: 'GitHub',
        output: sourceArtifact,
        //oauthToken : MyGitHubToken
        oauthToken: SecretValue.secretsManager('github-token'),
        owner: 'ajaykumar011',
        repo: 'cdk-pipeline',
      }),

       // How it will be built and synthesized
       synthAction: SimpleSynthAction.standardNpmSynth({
         sourceArtifact,
         cloudAssemblyArtifact,
         
         // We need a build step to compile the TypeScript Lambda
         buildCommand: 'npm run build'
       }),
    });

    // This is where we add the application stages
    // ...

    // This is where we add the application stages
    pipeline.addApplicationStage(new CdkpipelinesDemoStage(this, 'DevEnv', {
          env: { account: '171709546961', region: 'us-east-1' }
        }));

  }
}