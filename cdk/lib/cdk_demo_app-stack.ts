import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import * as env from 'dotenv';
import * as path from 'path';


env.config();

const { GITHUB_OWNER, GITHUB_REPO, GITHUB_ARN } = process.env;

if (!GITHUB_OWNER || !GITHUB_REPO || !GITHUB_ARN) {
  throw new Error('Missing required environment variables: GITHUB_OWNER, GITHUB_REPO, GITHUB_ARN');
}

const PREFIX = 'ventie30-ecs-demo';

export class CdkDemoAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 🚀 PIPELINE
    const pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: `${PREFIX}-pipeline`,
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.connection(
          `${GITHUB_OWNER}/${GITHUB_REPO}`,
          'main',
          { connectionArn: GITHUB_ARN! }
        ),
        commands: [
          'cd cdk',
          'npm ci',
          'npx cdk synth',
        ],
        primaryOutputDirectory: 'cdk/cdk.out',
      }),
    });

    // 📦 FASE DI DEPLOY: ECS FARGATE
    const deployStage = pipeline.addStage(new class extends cdk.Stage {
      constructor(scope: Construct, id: string, props?: cdk.StageProps) {
        super(scope, id, props);

        new class extends cdk.Stack {
          constructor(scope: Construct, id: string, props?: cdk.StackProps) {
            super(scope, id, props);

            const vpc = new ec2.Vpc(this, 'Vpc', {
              ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
              maxAzs: 2,
              vpcName: `${PREFIX}-vpc`,
            });

            const cluster = new ecs.Cluster(this, 'Cluster', {
              vpc,
              clusterName: `${PREFIX}-cluster`,
            });

            const service = new ApplicationLoadBalancedFargateService(this, 'Service', {
              serviceName: `${PREFIX}-service`,
              cluster,
              cpu: 256,
              memoryLimitMiB: 512,
              desiredCount: 2,
              taskImageOptions: {
                containerPort: 80,
                image: ecs.ContainerImage.fromAsset(path.join(__dirname, '../../src')),
              },
            });

            service.targetGroup.configureHealthCheck({
              path: '/',
            });
          }
        }(this, 'EcsStack');
      }
    }(this, 'DeployStage'));
  }
}