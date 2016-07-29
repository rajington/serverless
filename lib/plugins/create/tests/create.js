'use strict';

const expect = require('chai').expect;
const path = require('path');
const os = require('os');
const fse = require('fs-extra');
const Create = require('../create');
const Serverless = require('../../../Serverless');
const sinon = require('sinon');

describe('Create', () => {
  let create;

  before(() => {
    const serverless = new Serverless();
    const options = {};
    create = new Create(serverless, options);
    create.serverless.cli = new serverless.classes.CLI();
  });

  describe('#constructor()', () => {
    it('should have commands', () => expect(create.commands).to.be.not.empty);

    it('should have hooks', () => expect(create.hooks).to.be.not.empty);
  });

  describe('#create()', () => {
    it('should throw error if user passed unsupported template', () => {
      create.options.template = 'invalid-template';
      expect(() => create.create()).to.throw(Error);
    });

    it('should set servicePath based on cwd', () => {
      const tmpDir = path.join(os.tmpdir(), (new Date).getTime().toString());
      const cwd = process.cwd();
      fse.mkdirsSync(tmpDir);
      process.chdir(tmpDir);
      create.options.template = 'aws-nodejs';
      return create.create().then(() => {
        expect(create.serverless.config.servicePath).to.be.equal(process.cwd());
        process.chdir(cwd);
      });
    });

    it('should display ascii greeting', () => {
      const greetingStub = sinon.stub(create.serverless.cli, 'asciiGreeting');
      create.create();
      expect(greetingStub.callCount).to.be.equal(1);
    });

    it('should generate scaffolding for "aws-nodejs" template', () => {
      const tmpDir = path.join(os.tmpdir(), (new Date).getTime().toString());
      const cwd = process.cwd();
      fse.mkdirsSync(tmpDir);
      process.chdir(tmpDir);
      create.options.template = 'aws-nodejs';

      return create.create().then(() => {
        expect(create.serverless.utils.fileExistsSync(path.join(tmpDir, 'serverless.yml')))
          .to.be.equal(true);
        expect(create.serverless.utils.fileExistsSync(path.join(tmpDir, 'serverless.env.yml')))
          .to.be.equal(true);
        expect(create.serverless.utils.fileExistsSync(path.join(tmpDir, 'handler.js')))
          .to.be.equal(true);

        process.chdir(cwd);
      });
    });

    it('should generate scaffolding for "aws-python" template', () => {
      const tmpDir = path.join(os.tmpdir(), (new Date).getTime().toString());
      const cwd = process.cwd();
      fse.mkdirsSync(tmpDir);
      process.chdir(tmpDir);
      create.options.template = 'aws-python';

      return create.create().then(() => {
        expect(create.serverless.utils.fileExistsSync(path.join(tmpDir, 'serverless.yml')))
          .to.be.equal(true);
        expect(create.serverless.utils.fileExistsSync(path.join(tmpDir, 'serverless.env.yml')))
          .to.be.equal(true);
        expect(create.serverless.utils.fileExistsSync(path.join(tmpDir, 'handler.py')))
          .to.be.equal(true);

        process.chdir(cwd);
      });
    });

    it('should generate scaffolding for "aws-java-maven" template', () => {
      const tmpDir = path.join(os.tmpdir(), (new Date).getTime().toString());
      const cwd = process.cwd();
      fse.mkdirsSync(tmpDir);
      process.chdir(tmpDir);
      create.options.template = 'aws-java-maven';

      return create.create().then(() => {
        expect(create.serverless.utils.fileExistsSync(path.join(tmpDir, 'serverless.yml')))
          .to.be.equal(true);
        expect(create.serverless.utils.fileExistsSync(path.join(tmpDir, 'serverless.env.yml')))
          .to.be.equal(true);
        expect(create.serverless.utils.fileExistsSync(path.join(tmpDir, 'event.json')))
          .to.be.equal(true);
        expect(create.serverless.utils.fileExistsSync(path.join(tmpDir, 'pom.xml')))
          .to.be.equal(true);
        expect(create.serverless.utils.fileExistsSync(path.join(tmpDir, 'src', 'main', 'java',
            'hello', 'Handler.java'
          )))
          .to.be.equal(true);
        expect(create.serverless.utils.fileExistsSync(path.join(tmpDir, 'src', 'main', 'java',
            'hello', 'Request.java'
          )))
          .to.be.equal(true);
        expect(create.serverless.utils.fileExistsSync(path.join(tmpDir, 'src', 'main', 'java',
            'hello', 'Response.java'
          )))
          .to.be.equal(true);

        process.chdir(cwd);
      });
    });

    it('should generate scaffolding for "aws-java-gradle" template', () => {
      const tmpDir = path.join(os.tmpdir(), (new Date).getTime().toString());
      const cwd = process.cwd();
      fse.mkdirsSync(tmpDir);
      process.chdir(tmpDir);
      create.options.template = 'aws-java-gradle';

      return create.create().then(() => {
        expect(create.serverless.utils.fileExistsSync(path.join(tmpDir, 'serverless.yml')))
          .to.be.equal(true);
        expect(create.serverless.utils.fileExistsSync(path.join(tmpDir, 'serverless.env.yml')))
          .to.be.equal(true);
        expect(create.serverless.utils.fileExistsSync(path.join(tmpDir, 'event.json')))
          .to.be.equal(true);
        expect(create.serverless.utils.fileExistsSync(path.join(tmpDir, 'build.gradle')))
          .to.be.equal(true);
        expect(create.serverless.utils.fileExistsSync(path.join(tmpDir, 'src', 'main', 'java',
            'hello', 'Handler.java'
          )))
          .to.be.equal(true);
        expect(create.serverless.utils.fileExistsSync(path.join(tmpDir, 'src', 'main', 'java',
            'hello', 'Request.java'
          )))
          .to.be.equal(true);
        expect(create.serverless.utils.fileExistsSync(path.join(tmpDir, 'src', 'main', 'java',
            'hello', 'Response.java'
          )))
          .to.be.equal(true);

        process.chdir(cwd);
      });
    });
  });
});
