import { CfnOutput, Construct, Stage, StageProps } from '@aws-cdk/core';
import { LambdaStack } from './lambda';

/**
 * Deployable unit of web service app
 */
export class LambdaStage extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    const service = new LambdaStack(this, 'WebService');
  }
}