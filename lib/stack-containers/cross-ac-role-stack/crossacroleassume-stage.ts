import { CfnOutput, Construct, Stage, StageProps } from '@aws-cdk/core';
import { CrossAcRoleAssumeStack } from './crossacroleassume';

/**
 * Deployable unit of web service app
 */
export class CrossAcRoleAssumeStage extends Stage {

  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    const service = new CrossAcRoleAssumeStack(this, 'CrossAcRoleReceiverAssumer');
  }
}