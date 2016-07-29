'use strict';

const expect = require('chai').expect;
const AwsCompileApigEvents = require('../index');
const Serverless = require('../../../../../../../Serverless');

describe('#compileApiKeys()', () => {
  let serverless;
  let awsCompileApigEvents;

  beforeEach(() => {
    serverless = new Serverless();
    serverless.service.service = 'first-service';
    serverless.service.provider = {
      name: 'aws',
      apiKeys: ['1234567890'],
    };
    serverless.service.resources = { Resources: {} };
    serverless.service.environment = {
      stages: {
        dev: {
          regions: {
            'us-east-1': {
              vars: {
                iamRoleArnLambda:
                  'arn:aws:iam::12345678:role/service-dev-IamRoleLambda-FOO12345678',
              },
            },
          },
        },
      },
    };
    const options = {
      stage: 'dev',
      region: 'us-east-1',
    };
    awsCompileApigEvents = new AwsCompileApigEvents(serverless, options);
    awsCompileApigEvents.serverless.service.functions = {
      first: {
        events: [
          {
            http: {
              path: 'users/create',
              method: 'POST',
              private: true,
            },
          },
        ],
      },
    };
  });

  it('should compile api key resource', () => awsCompileApigEvents
    .compileApiKeys().then(() => {
      expect(
        awsCompileApigEvents.serverless.service.resources.Resources.ApiKeyApigEvent0.Type
      ).to.equal('AWS::ApiGateway::ApiKey');

      expect(
        awsCompileApigEvents.serverless.service.resources.Resources.ApiKeyApigEvent0.Properties
          .Enabled
      ).to.equal(true);

      expect(
        awsCompileApigEvents.serverless.service.resources.Resources.ApiKeyApigEvent0.Properties
          .Name
      ).to.equal('1234567890');

      expect(
        awsCompileApigEvents.serverless.service.resources.Resources.ApiKeyApigEvent0.Properties
          .StageKeys[0].RestApiId.Ref
      ).to.equal('RestApiApigEvent');

      expect(
        awsCompileApigEvents.serverless.service.resources.Resources.ApiKeyApigEvent0.Properties
          .StageKeys[0].StageName
      ).to.equal('dev');

      expect(
        awsCompileApigEvents.serverless.service.resources.Resources.ApiKeyApigEvent0.Properties
          .StageKeys[0].RestApiId.Ref
      ).to.equal('RestApiApigEvent');
    })
  );

  it('throw error if apiKey property is not an array', () => {
    awsCompileApigEvents.serverless.service.provider.apiKeys = 2;
    expect(() => awsCompileApigEvents.compileApiKeys()).to.throw(Error);
  });

  it('throw error if an apiKey is not a string', () => {
    awsCompileApigEvents.serverless.service.provider.apiKeys = [2];
    expect(() => awsCompileApigEvents.compileApiKeys()).to.throw(Error);
  });
});
