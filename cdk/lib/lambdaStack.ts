import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

interface lambdaStackProps extends StackProps {
  stageName?: string;
}

export class LambdaStack extends Stack {
  constructor(scope: Construct, id: string, props?: lambdaStackProps) {
    super(scope, id, props);
  }

  
}