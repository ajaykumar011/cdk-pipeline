import * as cdk from '@aws-cdk/core'
import * as apigw from '@aws-cdk/aws-apigateway';
import * as lambda from '@aws-cdk/aws-lambda';
import * as s3 from '@aws-cdk/aws-s3';
import { CfnOutput, Construct, Stack, StackProps } from '@aws-cdk/core';
import * as path from 'path';
import * as efs from '@aws-cdk/aws-efs';
import * as ec2 from '@aws-cdk/aws-ec2';
import { SecurityGroup } from '@aws-cdk/aws-ec2';
import { Aws, FileSystem } from '@aws-cdk/core';
import * as ssm from '@aws-cdk/aws-ssm';
import { env } from 'process';

/**
 * A stack for our simple S3 with export
 */
export class EFSStack extends Stack {
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
        'us-east-2a',
        'us-east-2b'
      ]);
    };

    // The code that defines your stack goes here
    const myvpc = new ec2.Vpc(this, 'VPCid', {maxAzs: 2, cidr: "172.16.0.0/16",
                            subnetConfiguration: [
                            {cidrMask: 24, name: 'public-subnet', subnetType: ec2.SubnetType.PUBLIC,},
                            //{cidrMask: 24, name: 'private-subnet', subnetType: ec2.SubnetType.PRIVATE,},
                            {cidrMask: 24, name: 'isolated-subnet', subnetType: ec2.SubnetType.ISOLATED,}
                            ],
                            natGateways: 0,
                            enableDnsHostnames: true,
                            enableDnsSupport: true,
                            defaultInstanceTenancy: ec2.DefaultInstanceTenancy.DEFAULT,
                            });
    const subnetIds: string[] = [];
    myvpc.isolatedSubnets.forEach((subnet, index) => {  //Using Public subnet here. But in production use private subnet
      subnetIds.push(subnet.subnetId);
    });

    const instancesg = new SecurityGroup(this, 'MyBastionSG', { vpc: myvpc });
    instancesg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22)); //SSH Port for Bastian Host

    const efssg = new SecurityGroup(this, 'MyEFSSG', { vpc: myvpc });
    efssg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(2049)); //NFS Port
    efssg.addIngressRule(instancesg, ec2.Port.tcp(2049));

    const drive1 = new efs.CfnFileSystem(this, 'Drive1', {
        encrypted: false,
        //kmsKeyId: use kms arn here else default will be taken
        performanceMode: "generalPurpose",
        throughputMode: "bursting",
        lifecyclePolicies: [{transitionToIa: "AFTER_30_DAYS" }],
        fileSystemTags: [ {key: "Name", value: "MYprimeEFS"}],
        fileSystemPolicy:{
          "Version": "2012-10-17",
          "Id": "efs-policy-wizard-f02c0022-eb6e-4481-a56b-c656060f2c9d",
          "Statement": [
              {
                  "Sid": "efs-statement-ee0093b3-620d-4c36-b4e1-a90e5ca5aa04",
                  "Effect": "Allow",
                  "Principal": {
                      "AWS": "*"
                  },
                  "Action": [
                      "elasticfilesystem:ClientRootAccess",
                      "elasticfilesystem:ClientWrite",
                      "elasticfilesystem:ClientMount"
                  ],
                  "Condition": {
                      "Bool": {
                          "elasticfilesystem:AccessedViaMountTarget": "true"
                      }
                  }
              },
              {
                  "Sid": "efs-statement-1463b8f8-7a0a-4e53-bc92-6c00985f90fb",
                  "Effect": "Deny",
                  "Principal": {
                      "AWS": "*"
                  },
                  "Action": "*",
                  "Condition": {
                      "Bool": {
                          "aws:SecureTransport": "false"
                      }
                  }
              }
          ]
      },
        backupPolicy: {status: "DISABLED"},
    });

    const efs_id = drive1.attrFileSystemId
    new cdk.CfnOutput(this, 'EFS_ARN', {value: efs_id});
    //Exporting values to SSM Parameter store
   const efssm1 = new ssm.StringParameter(this, 'EFSId', {allowedPattern: '.*', description: 'Value of efs ID For Backup', parameterName: '/EFS/Primary/EFSId1', stringValue: efs_id,
   tier: ssm.ParameterTier.STANDARD,
   });


    const mountTarget1 = new efs.CfnMountTarget(this, 'Drive1Target1', {
      fileSystemId: drive1.ref,
      securityGroups: [efssg.securityGroupId],
      subnetId: subnetIds[0],

    });

    const mountTarget2 = new efs.CfnMountTarget(this, 'Drive1Target2', {
        fileSystemId: drive1.ref,
        securityGroups: [efssg.securityGroupId],
        subnetId: subnetIds[1],
      });
    drive1.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    mountTarget1.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    mountTarget2.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    new cdk.CfnOutput(this, 'FileSystemId', {value: drive1.attrFileSystemId });
    new cdk.CfnOutput(this, 'MountTarget1IP', {value: mountTarget1.attrIpAddress });
    new cdk.CfnOutput(this, 'MountTarget2IP', {value: mountTarget2.attrIpAddress });

    const accesspoint = new efs.CfnAccessPoint(this, 'accesspointresource', {
        fileSystemId: drive1.attrFileSystemId,
        posixUser: { uid: "1000", gid: "1000", secondaryGids: ["1001","1002"]},
        rootDirectory: {creationInfo: { ownerGid: "1000", ownerUid: "1000", permissions: "0755"}, path: "/share"},
        accessPointTags: [ {key: "Name", value: "MyAppAccesspoint1"}],
       });
    new cdk.CfnOutput(this, 'AccessPointFSId', {value: accesspoint.fileSystemId });
    new cdk.CfnOutput(this, 'AccessPointId', {value: accesspoint.attrAccessPointId});
    new cdk.CfnOutput(this, 'AccessPointARB', {value: accesspoint.attrArn});

  }
}
