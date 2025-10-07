import { Construct } from "constructs";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import * as codepipeline from "aws-cdk-lib/aws-codepipeline";
import * as codepipeline_actions from "aws-cdk-lib/aws-codepipeline-actions";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecs from "aws-cdk-lib/aws-ecs";

interface FargatePipelineCiCdProps {
  service: ecs.FargateService;
  githubOwner: string;
  githubRepo: string;
  githubArn: string;
}

export class FargatePipeline extends Construct {
  constructor(scope: Construct, id: string, props: FargatePipelineCiCdProps) {
    super(scope, id);

    const repo = new ecr.Repository(this, "EcrRepo", {
      repositoryName: `${props.githubRepo.toLowerCase()}-repo`,
    });

    const buildProject = new codebuild.PipelineProject(this, "BuildProject", {
      environment: {
        privileged: true,
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: "0.2",
        phases: {
          pre_build: {
            commands: [
              "echo Logging in to Amazon ECR...",
              "aws --version",
              "aws ecr get-login-password | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com",
            ],
          },
          build: {
            commands: [
              "echo Building Docker image...",
              "docker build -t $REPOSITORY_URI:latest ./src",
              "docker push $REPOSITORY_URI:latest",
            ],
          },
          post_build: {
            commands: [
              "echo Creating imagedefinitions.json...",
              "printf '[{\"name\":\"AppContainer\",\"imageUri\":\"%s\"}]' $REPOSITORY_URI:latest > imagedefinitions.json",
            ],
          },
        },
        artifacts: {
          files: ["imagedefinitions.json"],
        },
      }),
      environmentVariables: {
        AWS_ACCOUNT_ID: { value: process.env.CDK_DEFAULT_ACCOUNT },
        AWS_REGION: { value: process.env.CDK_DEFAULT_REGION },
        REPOSITORY_URI: { value: repo.repositoryUri },
      },
    });

    repo.grantPullPush(buildProject.role!);

    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();

    const sourceAction = new codepipeline_actions.CodeStarConnectionsSourceAction({
      actionName: "GitHub_Source",
      owner: props.githubOwner,
      repo: props.githubRepo,
      branch: "main",
      connectionArn: props.githubArn,
      output: sourceOutput,
      triggerOnPush: true,
    });

    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: "Build",
      project: buildProject,
      input: sourceOutput,
      outputs: [buildOutput],
    });

    const deployAction = new codepipeline_actions.EcsDeployAction({
      actionName: "DeployToECS",
      service: props.service,
      input: buildOutput,
    });

    new codepipeline.Pipeline(this, "FargatePipeline", {
      stages: [
        { stageName: "Source", actions: [sourceAction] },
        { stageName: "Build", actions: [buildAction] },
        { stageName: "Deploy", actions: [deployAction] },
      ],
    });
  }
}