import * as cdk from 'aws-cdk-lib';
import { CodePipeline, ShellStep, CodePipelineSource } from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import * as env from 'dotenv';
import { PipelineStage } from './pipelineStage';

env.config();

const { GITHUB_OWNER, GITHUB_REPO, GITHUB_ARN } = process.env;

if (!GITHUB_OWNER || !GITHUB_REPO || !GITHUB_ARN) {
  throw new Error('Missing required environment variables: GITHUB_OWNER, GITHUB_REPO, GITHUB_ARN');
}

const PREFIX = 'ventie30-ecs-demo'

export class CdkDemoAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const shellStep = new ShellStep('Synth', {
      input: CodePipelineSource.connection(`${GITHUB_OWNER}/${GITHUB_REPO}`, 'main',
        { connectionArn: GITHUB_ARN! }
      ),
      commands: [
        'cd cdk',
        'npm ci',
        'npx cdk synth'
      ],
      primaryOutputDirectory: 'cdk/cdk.out',
      env: {
        NODE_OPTIONS: '--max_old_space_size=4096',
      },
    });

    const codePipeline = new CodePipeline(this, 've-30-code-pipeline', {
      pipelineName: `${PREFIX}-pipeline`,
      synth: shellStep,
    });

    const testStage = codePipeline.addStage(new PipelineStage(this, 'Test'));
  }
}