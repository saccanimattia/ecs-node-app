#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkDemoAppStack } from '../lib/cdk_demo_app-stack';

const app = new cdk.App();
new CdkDemoAppStack(app, 'CdkDemoAppStack', {
});

app.synth();