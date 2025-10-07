import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as iam from "aws-cdk-lib/aws-iam";
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import { CfnOutput } from "aws-cdk-lib";

export class Fargate extends Construct {
  public readonly cluster: ecs.Cluster;
  public readonly service: ecs.FargateService;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const vpc = new ec2.Vpc(this, "Vpc", { maxAzs: 2 });
    const cluster = new ecs.Cluster(this, "Cluster", { vpc });

    const taskRole = new iam.Role(this, "TaskRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    });

    const taskDef = new ecs.FargateTaskDefinition(this, "TaskDef", { taskRole });

    const container = taskDef.addContainer("AppContainer", {
      image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
      memoryLimitMiB: 256,
      cpu: 256,
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: "App" }),
    });

    container.addPortMappings({ containerPort: 80 });

    const service = new ApplicationLoadBalancedFargateService(this, "Service", {
      cluster,
      taskDefinition: taskDef,
      publicLoadBalancer: true,
      desiredCount: 1,
    });

    new CfnOutput(this, "LoadBalancerDNS", {
      value: service.loadBalancer.loadBalancerDnsName,
    });

    this.cluster = cluster;
    this.service = service.service;
  }
}