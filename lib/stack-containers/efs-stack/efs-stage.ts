import { CfnOutput, Construct, Stage, StageProps } from '@aws-cdk/core';
import { EFSStack } from './efs';

/**
 * Deployable unit of web service app
 */
export class EFSStage extends Stage {

  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    const service = new EFSStack(this, 'EFSBucketStack');
  }
}