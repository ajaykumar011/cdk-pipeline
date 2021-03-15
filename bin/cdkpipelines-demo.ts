#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { App } from '@aws-cdk/core';
import { CdkpipelinesDemoPipelineStack } from '../lib/pipeline-stack';

const app = new cdk.App();

//Once the cdk pipeline is ready 

new CdkpipelinesDemoPipelineStack(app, 'CdkpipelinesDemoPipelineStack', {
    env: { account: '171709546961', region: 'us-east-1' },
  });

app.synth();


//new CdkpipelinesDemoStack(app, 'CdkpipelinesDemoStack');
