import { Stack, StackProps } from "aws-cdk-lib";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { join } from "path";

interface lambdaStackProps extends StackProps {
  stageName?: string;
}

export class LambdaStack extends Stack {
  constructor(scope: Construct, id: string, props?: lambdaStackProps) {
    super(scope, id, props);

    new NodejsFunction(this, 'HelloHandler', {
      runtime:  Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: join(__dirname, '..', 'src', 'hello.ts'),
      environment: {
        STAGE: props?.stageName!
      }
    });
  }

  
}