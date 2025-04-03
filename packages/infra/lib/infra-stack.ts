import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigatewayv2-alpha';
import * as integrations from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import { Construct } from 'constructs';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda function with Lambda Web Adapter
    const nextjsFunction = new lambda.Function(this, 'NextjsFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../web/.next'),
      environment: {
        AWS_LAMBDA_EXEC_WRAPPER: '/opt/bootstrap',
        RUST_LOG: 'info',
        PORT: '3000'
      },
      layers: [
        lambda.LayerVersion.fromLayerVersionArn(this, 'WebAdapter', 
          `arn:aws:lambda:\${cdk.Stack.of(this).region}:753240598075:layer:LambdaAdapterLayerX86:17`
        )
      ],
      memorySize: 1024,
      timeout: cdk.Duration.seconds(30),
    });

    // HTTP API Gateway
    const api = new apigateway.HttpApi(this, 'NextjsApi', {
      defaultIntegration: new integrations.HttpLambdaIntegration('NextjsIntegration', nextjsFunction)
    });

    // Output the API URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url ?? 'Something went wrong with the deployment'
    });
  }
}
