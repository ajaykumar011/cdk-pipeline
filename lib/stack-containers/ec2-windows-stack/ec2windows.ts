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
import { readFileSync } from 'fs';

/**
 * A stack for our simple S3 with export
 */
export class Ec2WindowsStack extends Stack {
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

    const az1 = myvpc.availabilityZones[0]

    const instancesg = new SecurityGroup(this, 'MyWindowsSG', { vpc: myvpc });
    instancesg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22)); //SSH Port for Bastian Host

    const ec2sg = new SecurityGroup(this, 'Myec2sg', { vpc: myvpc });
    ec2sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(2049)); //NFS Port
    ec2sg.addIngressRule(instancesg, ec2.Port.tcp(2049));

    const instanceiamrole = new Role(this, "MyWinInstanceRole", {
            assumedBy: new ServicePrincipal("ec2.amazonaws.com"),
            managedPolicies: [
              ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
            ]});
          instanceiamrole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'));
          instanceiamrole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMFullAccess'));

          // const host = new ec2.BastionHostLinux(this, 'MyBastionHost', {
          //   vpc: myvpc,
          //   instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.MICRO),
          //   availabilityZone: az1,
          //   subnetSelection: { subnetType: ec2.SubnetType.PUBLIC },
          //   securityGroup: ec2sg
          // });

         //Windows Instance
         const win_key_name = "win-dev-ac";
         const win_user_data = readFileSync('./assets/win_userdata/userdata.ps1', 'utf-8');
         const windows_ami = ec2.MachineImage.latestWindows(ec2.WindowsVersion.WINDOWS_SERVER_2019_ENGLISH_FULL_BASE);

          const wininstance = new ec2.Instance(this, 'WinInstanceid', {
                                  vpc: myvpc,
                                  instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.MICRO),
                                  machineImage: windows_ami,
                                  allowAllOutbound: true,
                                  keyName: win_key_name,
                                  vpcSubnets: {subnets: myvpc.publicSubnets},
                                  availabilityZone: az1,
                                  securityGroup: ec2sg,
                                  //userData: ec2.UserData.custom(win_user_data),
                                  blockDevices: [{
                                    deviceName: '/dev/xvdb',
                                    volume: ec2.BlockDeviceVolume.ebs(50, {
                                        encrypted: false,
                                        deleteOnTermination: true
                                    })}]
                                });

          new cdk.CfnOutput(this, "WinInstancePubIp", {value: wininstance.instancePublicIp});
          new cdk.CfnOutput(this, "WinInsPublicDNS", {value: wininstance.instancePublicDnsName});




  }
}
