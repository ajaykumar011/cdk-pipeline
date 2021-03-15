import { CfnOutput, Construct, Stage, StageProps } from '@aws-cdk/core';
import { S3Stack } from './s3';

/**
 * Deployable unit of web service app
 */
export class S3Stage extends Stage {

  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    const service = new S3Stack(this, 'S3BucketStack');
  }
}