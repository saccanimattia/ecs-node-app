import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as codepipeline from "aws-cdk-lib/aws-codepipeline";
import * as codepipeline_actions from "aws-cdk-lib/aws-codepipeline-actions";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import * as dotenv from "dotenv";

dotenv.config();

const { GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN_SECRET } = process.env;

export class CdkDemoAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const PREFIX = "my-webapp";

    const vpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: 2,
      ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
    });

    const cluster = new ecs.Cluster(this, "Cluster", {
      clusterName: `${PREFIX}-cluster`,
      vpc,
    });

    const repo = new ecr.Repository(this, "Repo", {
      repositoryName: `${PREFIX}-repo`,
    });

    const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, "Service", {
      cluster,
      serviceName: `${PREFIX}-service`,
      taskImageOptions: {
        image: ecs.ContainerImage.fromEcrRepository(repo, "latest"),
        containerPort: 80,
      },
      desiredCount: 1,
      memoryLimitMiB: 512,
      cpu: 256,
    });

    fargateService.targetGroup.configureHealthCheck({
      path: "/",
    });

    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();

    const pipeline = new codepipeline.Pipeline(this, "Pipeline", {
      pipelineName: `${PREFIX}-pipeline`,
    });

    pipeline.addStage({
      stageName: "Source",
      actions: [
        new codepipeline_actions.GitHubSourceAction({
          actionName: "GitHub_Source",
          owner: GITHUB_OWNER!,
          repo: GITHUB_REPO!,
          branch: "production",
          oauthToken: cdk.SecretValue.secretsManager(GITHUB_TOKEN_SECRET!),
          output: sourceOutput,
        }),
      ],
    });

    const buildProject = new codebuild.PipelineProject(this, "BuildProject", {
      environment: {
        privileged: true,
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
      },
    });

    pipeline.addStage({
      stageName: "Build",
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: "Docker_Build",
          project: buildProject,
          input: sourceOutput,
          outputs: [buildOutput],
        }),
      ],
    });

    pipeline.addStage({
      stageName: "Deploy",
      actions: [
        new codepipeline_actions.EcsDeployAction({
          actionName: "ECS_Deploy",
          service: fargateService.service,
          input: buildOutput,
        }),
      ],
    });
  }
}