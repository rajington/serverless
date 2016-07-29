'use strict';

const sinon = require('sinon');
const os = require('os');
const path = require('path');
const BbPromise = require('bluebird');
const expect = require('chai').expect;
const AwsDeploy = require('../index');
const Serverless = require('../../../../Serverless');

describe('uploadDeploymentPackage', () => {
  let serverless;
  let awsDeploy;

  beforeEach(() => {
    serverless = new Serverless();
    const options = {
      stage: 'dev',
      region: 'us-east-1',
    };
    awsDeploy = new AwsDeploy(serverless, options);
    awsDeploy.serverless.cli = new serverless.classes.CLI();
  });

  describe('#setServerlessDeploymentBucketName()', () => {
    it('should store the name of the Serverless deployment bucket in the "this" variable', () => {
      const getServerlessDeploymentBucketNameStub = sinon
        .stub(awsDeploy.sdk, 'getServerlessDeploymentBucketName')
        .returns(BbPromise.resolve('new-service-dev-us-east-1-12345678'));

      return awsDeploy.setServerlessDeploymentBucketName().then(() => {
        expect(awsDeploy.bucketName).to.equal('new-service-dev-us-east-1-12345678');
        expect(getServerlessDeploymentBucketNameStub.calledOnce).to.be.equal(true);
        expect(getServerlessDeploymentBucketNameStub
          .calledWith(awsDeploy.options.stage, awsDeploy.options.region));
        awsDeploy.sdk.getServerlessDeploymentBucketName.restore();
      });
    });
  });

  describe('#getServiceObjectsFromS3Bucket()', () => {
    it('should resolve if no service objects are found', () => {
      const serviceObjects = {
        Contents: [],
      };

      const listObjectsStub = sinon
        .stub(awsDeploy.sdk, 'request').returns(BbPromise.resolve(serviceObjects));

      return awsDeploy.getServiceObjectsFromS3Bucket().then(() => {
        expect(listObjectsStub.calledOnce).to.be.equal(true);
        expect(listObjectsStub.calledWith(awsDeploy.options.stage, awsDeploy.options.region));
        awsDeploy.sdk.request.restore();
      });
    });

    it('should return all to be removed service objects (except the last 4)', () => {
      const serviceObjects = {
        Contents: [
          {
            Key: 'first-service-1.zip',
          },
          {
            Key: 'first-service-8.zip',
          },
          {
            Key: 'first-service-2.zip',
          },
          {
            Key: 'first-service-5.zip',
          },
          {
            Key: 'first-service-6.zip',
          },
          {
            Key: 'first-service-4.zip',
          },
          {
            Key: 'first-service-7.zip',
          },
          {
            Key: 'first-service-3.zip',
          },
        ],
      };

      const listObjectsStub = sinon
        .stub(awsDeploy.sdk, 'request').returns(BbPromise.resolve(serviceObjects));

      return awsDeploy.getServiceObjectsFromS3Bucket().then((objectsToRemove) => {
        expect(objectsToRemove).to.not.include({ Key: 'first-service-5.zip' });
        expect(objectsToRemove).to.not.include({ Key: 'first-service-6.zip' });
        expect(objectsToRemove).to.not.include({ Key: 'first-service-7.zip' });
        expect(objectsToRemove).to.not.include({ Key: 'first-service-8.zip' });
        expect(listObjectsStub.calledOnce).to.be.equal(true);
        expect(listObjectsStub.calledWith(awsDeploy.options.stage, awsDeploy.options.region));
        awsDeploy.sdk.request.restore();
      });
    });

    it('should resolve if there are less than 4 service files available', () => {
      const serviceObjects = {
        Contents: [
          {
            Key: 'first-service-3.zip',
          },
          {
            Key: 'first-service-1.zip',
          },
          {
            Key: 'first-service-2.zip',
          },
        ],
      };

      const listObjectsStub = sinon
        .stub(awsDeploy.sdk, 'request').returns(BbPromise.resolve(serviceObjects));

      return awsDeploy.getServiceObjectsFromS3Bucket().then((objectsToRemove) => {
        expect(objectsToRemove).to.equal(undefined);
        expect(listObjectsStub.calledOnce).to.be.equal(true);
        expect(listObjectsStub.calledWith(awsDeploy.options.stage, awsDeploy.options.region));
        awsDeploy.sdk.request.restore();
      });
    });

    it('should resolve if there are exactly 4 service files available', () => {
      const serviceObjects = {
        Contents: [
          {
            Key: 'first-service-1.zip',
          },
          {
            Key: 'first-service-2.zip',
          },
          {
            Key: 'first-service-4.zip',
          },
          {
            Key: 'first-service-3.zip',
          },
        ],
      };

      const listObjectsStub = sinon
        .stub(awsDeploy.sdk, 'request').returns(BbPromise.resolve(serviceObjects));

      return awsDeploy.getServiceObjectsFromS3Bucket().then((objectsToRemove) => {
        expect(objectsToRemove).to.equal(undefined);
        expect(listObjectsStub.calledOnce).to.be.equal(true);
        expect(listObjectsStub.calledWith(awsDeploy.options.stage, awsDeploy.options.region));
        awsDeploy.sdk.request.restore();
      });
    });
  });

  describe('#cleanupS3Bucket()', () => {
    let deleteObjectsStub;

    beforeEach(() => {
      deleteObjectsStub = sinon
        .stub(awsDeploy.sdk, 'request').returns(BbPromise.resolve());
    });

    it('should resolve if no service objects are found in the S3 bucket', () => awsDeploy
      .cleanupS3Bucket().then(() => {
        expect(deleteObjectsStub.calledOnce).to.be.equal(false);
        awsDeploy.sdk.request.restore();
      })
    );

    it('should remove all old service files from the S3 bucket if available', () => {
      const serviceObjects = [{ Key: 'first-service' }, { Key: 'second-service' }];

      return awsDeploy.cleanupS3Bucket(serviceObjects).then(() => {
        expect(deleteObjectsStub.calledOnce).to.be.equal(true);
        expect(deleteObjectsStub.calledWith(awsDeploy.options.stage, awsDeploy.options.region));
        awsDeploy.sdk.request.restore();
      });
    });
  });

  describe('#uploadZipFileToS3Bucket()', () => {
    it('should upload the zip file to the S3 bucket', () => {
      const tmpDirPath = path.join(os.tmpdir(), (new Date).getTime().toString());
      const artifactFilePath = path.join(tmpDirPath, 'artifact.zip');
      serverless.utils.writeFileSync(artifactFilePath, 'artifact.zip file content');

      awsDeploy.serverless.service.package.artifact = artifactFilePath;

      const putObjectStub = sinon
        .stub(awsDeploy.sdk, 'request').returns(BbPromise.resolve());

      return awsDeploy.uploadZipFileToS3Bucket().then(() => {
        expect(putObjectStub.calledOnce).to.be.equal(true);
        expect(putObjectStub.calledWith(awsDeploy.options.stage, awsDeploy.options.region));
        awsDeploy.sdk.request.restore();
      });
    });
  });
});
