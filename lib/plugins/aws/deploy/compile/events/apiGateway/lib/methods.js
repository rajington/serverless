'use strict';

const BbPromise = require('bluebird');
const _ = require('lodash');

module.exports = {
  compileMethods() {
    let endpointCounter = 1;

    _.forEach(this.serverless.service.functions, (functionObject, functionName) => {
      functionObject.events.forEach(event => {
        if (event.http) {
          let method;
          let path;

          if (typeof event.http === 'object') {
            method = event.http.method;
            path = event.http.path;
          } else if (typeof event.http === 'string') {
            method = event.http.split(' ')[0];
            path = event.http.split(' ')[1];
          } else {
            const errorMessage = [
              `HTTP event of function ${functionName} is not an object nor a string.`,
              ' The correct syntax is: http: get users/list',
              ' OR an object with "path" and "method" proeprties.',
              ' Please check the docs for more info.',
            ].join('');
            throw new this.serverless.classes
              .Error(errorMessage);
          }

          const resourceLogicalId = this.resourceLogicalIds[path];
          const normalizedMethod = method[0].toUpperCase() +
            method.substr(1).toLowerCase();

          const extractedResourceId = resourceLogicalId.match(/\d+$/)[0];

          // universal velocity template
          // provides
          // `{body, method, principalId, headers, query, path, identity, stageVariables} = event`
          // as js objects
          const DEFAULT_JSON_REQUEST_TEMPLATE = `
            #define( $loop )
              {
              #foreach($key in $map.keySet())
                  "$util.escapeJavaScript($key)":
                    "$util.escapeJavaScript($map.get($key))"
                    #if( $foreach.hasNext ) , #end
              #end
              }
            #end
            {
              "body": $input.json("$"),
              "method": "$context.httpMethod",
              "principalId": "$context.authorizer.principalId",

              #set( $map = $input.params().header )
              "headers": $loop,

              #set( $map = $input.params().querystring )
              "query": $loop,

              #set( $map = $input.params().path )
              "path": $loop,

              #set( $map = $context.identity )
              "identity": $loop,

              #set( $map = $stageVariables )
              "stageVariables": $loop
            }
          `;

          const methodTemplate = `
            {
              "Type" : "AWS::ApiGateway::Method",
              "Properties" : {
                "AuthorizationType" : "NONE",
                "HttpMethod" : "${method.toUpperCase()}",
                "MethodResponses" : [
                  {
                    "ResponseModels" : {},
                    "ResponseParameters" : {},
                    "StatusCode" : "200"
                  }
                ],
                "RequestParameters" : {},
                "Integration" : {
                  "IntegrationHttpMethod" : "POST",
                  "Type" : "AWS",
                  "Uri" : {
                    "Fn::Join": [ "",
                      [
                        "arn:aws:apigateway:",
                        {"Ref" : "AWS::Region"},
                        ":lambda:path/2015-03-31/functions/",
                        {"Fn::GetAtt" : ["${functionName}", "Arn"]},
                        "/invocations"
                      ]
                    ]
                  },
                  "RequestTemplates" : {
                    "application/json" : ${JSON.stringify(DEFAULT_JSON_REQUEST_TEMPLATE)}
                  },
                  "IntegrationResponses" : [
                    {
                      "StatusCode" : "200",
                      "ResponseParameters" : {},
                      "ResponseTemplates" : {
                        "application/json": ""
                      }
                    }
                  ]
                },
                "ResourceId" : { "Ref": "${resourceLogicalId}" },
                "RestApiId" : { "Ref": "RestApiApigEvent" }
              }
            }
          `;

          const methodTemplateJson = JSON.parse(methodTemplate);

          // set authorizer config if available
          if (event.http.authorizer) {
            let authorizerName;
            if (typeof event.http.authorizer === 'string') {
              if (event.http.authorizer.indexOf(':') === -1) {
                authorizerName = event.http.authorizer;
              } else {
                const authorizerArn = event.http.authorizer;
                const splittedAuthorizerArn = authorizerArn.split(':');
                const splittedLambdaName = splittedAuthorizerArn[splittedAuthorizerArn
                  .length - 1].split('-');
                authorizerName = splittedLambdaName[splittedLambdaName.length - 1];
              }
            } else if (typeof event.http.authorizer === 'object') {
              if (event.http.authorizer.arn) {
                const authorizerArn = event.http.authorizer.arn;
                const splittedAuthorizerArn = authorizerArn.split(':');
                const splittedLambdaName = splittedAuthorizerArn[splittedAuthorizerArn
                  .length - 1].split('-');
                authorizerName = splittedLambdaName[splittedLambdaName.length - 1];
              } else if (event.http.authorizer.name) {
                authorizerName = event.http.authorizer.name;
              }
            }

            const AuthorizerLogicalId = `${authorizerName}Authorizer`;

            methodTemplateJson.Properties.AuthorizationType = 'CUSTOM';
            methodTemplateJson.Properties.AuthorizerId = {
              Ref: AuthorizerLogicalId,
            };
            methodTemplateJson.DependsOn = AuthorizerLogicalId;
          }

          if (event.http.private) methodTemplateJson.Properties.ApiKeyRequired = true;

          const methodObject = {
            [`${normalizedMethod}MethodApigEvent${extractedResourceId}`]:
            methodTemplateJson,
          };

          _.merge(this.serverless.service.resources.Resources,
            methodObject);

          // create CLF Output for endpoint
          const outputEndpointTemplate = `
          {
            "Description": "Endpoint info",
            "Value": { "Fn::Join" : [ "", [ "${method.toUpperCase()} - https://", { "Ref": "RestApiApigEvent" },
              ".execute-api.${this.options.region}.amazonaws.com/${this.options.stage}/${path}"] ] }
          }`;

          const newOutputEndpointObject = {
            [`Endpoint${endpointCounter++}`]: JSON.parse(outputEndpointTemplate),
          };

          this.serverless.service.resources.Outputs =
            this.serverless.service.resources.Outputs || {};
          _.merge(this.serverless.service.resources.Outputs, newOutputEndpointObject);

          // store a method logical id in memory to be used
          // by Deployment resources "DependsOn" property
          if (!this.methodDep) {
            this.methodDep = `${normalizedMethod}MethodApigEvent${extractedResourceId}`;
          }
        }
      });
    });
    return BbPromise.resolve();
  },
};
