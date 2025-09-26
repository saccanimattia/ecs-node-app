import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';

const PREFIX = 'ventie30-ecs-demo'

export class CdkDemoAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'ventie30-vpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      vpcName: `${PREFIX}-cluster`,
    });

    const cluster = new ecs.Cluster(this, 'ventie30-ecs-cluster', {
      vpc,
      clusterName: `${PREFIX}-cluster`,
    });

    const service = new ApplicationLoadBalancedFargateService(this, 'ventie30-ecs-service', {
      serviceName: `${PREFIX}-service`,
      loadBalancerName: `${PREFIX}-lb`,
      cluster,
      cpu: 256,
      memoryLimitMiB: 512,
      taskImageOptions: {
        containerPort: 80,
        image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
      },
      desiredCount: 2,
    });

    service.targetGroup.configureHealthCheck({
      path: '/',
    });
  }
}
