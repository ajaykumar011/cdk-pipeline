import * as cdk from '@aws-cdk/core'
import * as s3 from '@aws-cdk/aws-s3';
import { CfnOutput, Construct, Stack, StackProps } from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import { SecurityGroup } from '@aws-cdk/aws-ec2';
const ruleCdk = require('@aws-cdk/aws-events');
const targets = require('@aws-cdk/aws-events-targets');
import codebuild = require("@aws-cdk/aws-codebuild")
import  * as iam from '@aws-cdk/aws-iam'


/**
 * A stack for our simple S3 with export
 */
export class CrossAcRoleStack extends Stack {
  public readonly myBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const stack = cdk.Stack.of(this);
    if (this.region === 'us-east-1') {
      this.node.setContext(`availability-zones:account=${this.account}:region=us-east-1`, [
        'us-east-1a',
        'us-east-1b'
      ]);
    };
    if (this.region === 'us-west-2') {
      this.node.setContext(`availability-zones:account=${this.account}:region=us-west-2`, [
        'us-west-2a',
        'us-west-2b'
      ]);
    };

    // The code that defines your stack goes here
    //Peer role
    const passrole = new iam.Role(this, "PeerPassRole", {
      roleName: 'ec2-describle-role-for-sharedac',
      //assumedBy: new iam.AccountPrincipal(171709546961)  //Shared Account
      assumedBy: new iam.CompositePrincipal(
        new iam.AccountPrincipal('171709546961'),
        new iam.AccountPrincipal('263877540751')
    ),

    });
     //passrole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'));
     passrole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ['*'],
        actions: [
          "ec2:DescribeInstances",
          "ec2:DescribeImages",
          "ec2:DescribeTags",
          "ec2:DescribeSnapshots"
        ]
      })
    );


  }
}
