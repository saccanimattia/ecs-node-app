import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Fargate } from "./fargate";
import { FargatePipeline } from "./fargatePipeline";
import * as env from "dotenv";

env.config();

export class CdkDemoAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const { GITHUB_OWNER, GITHUB_REPO, GITHUB_ARN } = process.env;

    if (!GITHUB_OWNER || !GITHUB_REPO || !GITHUB_ARN) {
      throw new Error("Missing GITHUB_OWNER, GITHUB_REPO, or GITHUB_ARN in .env");
    }

    const fargate = new Fargate(this, "AppInfra");

    new FargatePipeline(this, "CiCdPipeline", {
      service: fargate.service,
      githubOwner: GITHUB_OWNER,
      githubRepo: GITHUB_REPO,
      githubArn: GITHUB_ARN,
    });
  }
}