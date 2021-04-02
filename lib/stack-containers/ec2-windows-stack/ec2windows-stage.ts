import { CfnOutput, Construct, Stage, StageProps } from '@aws-cdk/core';
import { Ec2WindowsStack } from './ec2windows';

/**
 * Deployable unit of web service app
 */
export class Ec2WindowsStage extends Stage {

  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    const service = new Ec2WindowsStack(this, 'WindowsStack');
  }
}