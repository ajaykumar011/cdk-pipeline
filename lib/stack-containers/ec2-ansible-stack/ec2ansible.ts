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
export class Ec2AnsibleStack extends Stack {
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

    const instancesg = new SecurityGroup(this, 'MyAnsibleSG', { vpc: myvpc });
    instancesg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22)); //SSH Port for Bastian Host

    const ec2sg = new SecurityGroup(this, 'Myec2sg', { vpc: myvpc });
    ec2sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(2049)); //NFS Port
    ec2sg.addIngressRule(instancesg, ec2.Port.tcp(2049));

    const amznLinux_ami = ec2.MachineImage.latestAmazonLinux({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      storage: ec2.AmazonLinuxStorage.GENERAL_PURPOSE,
      cpuType: ec2.AmazonLinuxCpuType.X86_64,
      });

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

    const ansibleBuild = new codebuild.PipelineProject(this, "ansible-pipeline", {
      description: "Ansible Build",
      projectName: "Ansible-poc-build",
      vpc: myvpc,
      environment: {buildImage:codebuild.LinuxBuildImage.AMAZON_LINUX_2_3,},
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [
            'yum update -y',
            'aws --version',
            'aws sts get-caller-identity',
            'export AWS_DEFAULT_REGION=us-east-1',
            'python --version',
            'pip --version',
            'pip list',
            'pip install ansible==2.9',
            'ansible --version',
            'ansible-galaxy collection install amazon.aws',
            'ansible localhost -a "which python3"'
            ]
          }
        }
      })
    })











  }
}
