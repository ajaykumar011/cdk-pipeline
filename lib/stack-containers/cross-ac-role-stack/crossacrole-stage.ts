import { CfnOutput, Construct, Stage, StageProps } from '@aws-cdk/core';
import { CrossAcRoleStack } from './crossacrole';

/**
 * Deployable unit of web service app
 */
export class CrossAcRoleStage extends Stage {

  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    const service = new CrossAcRoleStack(this, 'CrossAcRoleStackGiver');
  }
}