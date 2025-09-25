import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dotenv from "dotenv";

dotenv.config();

const { GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN_SECRET } = process.env;

export class CdkDemoAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    
  }
}