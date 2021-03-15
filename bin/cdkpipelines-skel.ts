#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { App } from '@aws-cdk/core';
import { CdkPipelineStack } from '../lib/pipeline-stack';

const app = new cdk.App();

//Once the cdk pipeline is ready

new CdkPipelineStack(app, 'CdkpipelinesStack', { env: { account: '171709546961', region: 'us-east-1' },});

app.synth();


//new CdkpipelinesDemoStack(app, 'CdkpipelinesStack');
