import { CfnOutput, Construct, Stage, StageProps } from '@aws-cdk/core';
import { Ec2AnsibleStack } from './ec2ansible';

/**
 * Deployable unit of web service app
 */
export class Ec2AnsibleStage extends Stage {

  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    const service = new Ec2AnsibleStack(this, 'AnsibleStack');
  }
}