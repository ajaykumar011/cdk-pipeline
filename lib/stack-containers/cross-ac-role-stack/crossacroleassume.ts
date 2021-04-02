import * as cdk from '@aws-cdk/core'
import * as s3 from '@aws-cdk/aws-s3';
import { CfnOutput, Construct, Stack, StackProps } from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import { SecurityGroup } from '@aws-cdk/aws-ec2';
const ruleCdk = require('@aws-cdk/aws-events');
const targets = require('@aws-cdk/aws-events-targets');
import {Role, ServicePrincipal, ManagedPolicy} from '@aws-cdk/aws-iam';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import codebuild = require("@aws-cdk/aws-codebuild")
import { VpcLink } from '@aws-cdk/aws-apigateway';

/**
 * A stack for our simple S3 with export
 */
export class CrossAcRoleAssumeStack extends Stack {
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
    const instanceiamrole = new Role(this, "MyInstanceRole", {
            assumedBy: new ServicePrincipal("ec2.amazonaws.com"),
            managedPolicies: [
              ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
            ]});
          instanceiamrole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'));
          instanceiamrole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMFullAccess'));


    // const ansible_user_data = readFileSync('./ansibleuserdata.sh', 'utf-8');
    // const ansible_key_name = "mykey";
    // const ansibleinstnace = new ec2.Instance(this, 'AnsibleInst1', {
    //       vpc: myvpc,
    //       instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2,
    //       ec2.InstanceSize.MICRO),
    //       machineImage: amznLinux_ami,
    //       allowAllOutbound: true,
    //       securityGroup: instancesg,
    //       userData: ec2.UserData.custom(ansible_user_data),
    //       role: instanceiamrole,
    //       keyName: ansible_key_name});

    // new cdk.CfnOutput(this, "AnsibleInstance", {value: ansibleinstnace.instancePublicIp});




  }
}
