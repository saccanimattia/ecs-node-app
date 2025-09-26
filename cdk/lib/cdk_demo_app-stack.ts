import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

const PREFIX = 'ventie30-ecs-demo'

export class CdkDemoAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
  }
}
