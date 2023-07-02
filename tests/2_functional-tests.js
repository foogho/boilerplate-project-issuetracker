const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

const Issue = require('../models/issue');
const Project = require('../models/project');

const { populateRandomIssues } = require('./helper');

chai.use(chaiHttp);

suite('Functional Tests', function () {
  let requester;
  suiteSetup(() => {
    requester = chai.request(server).keepOpen();
  });

  setup(async () => {
    await Issue.deleteMany({});
    await Project.deleteMany({});
  });

  test('Create an issue with every field: POST request to /api/issues/{project}', async () => {
    const sampleIssue = {
      issue_title: 'random title',
      issue_text: 'random text',
      created_by: 'random user',
      assigned_to: 'random user',
      status_text: 'random text',
    };
    const res = await requester
      .post('/api/issues/functional-test-project')
      .send(sampleIssue);
    assert.equal(res.status, 201, 'response status should be 201');
    assert.include(
      res.body,
      sampleIssue,
      'response should contain created issue'
    );
    assert.containsAllKeys(
      res.body,
      ['created_on', 'updated_on', 'open', '_id'],
      'response should contain additional fields'
    );
    assert.equal(res.body.open, true, 'open field should be true by default');
  });

  test('Create an issue with only required fields: POST request to /api/issues/{project}', async () => {
    const sampleIssue = {
      issue_title: 'random title',
      issue_text: 'random text',
      created_by: 'random user',
    };
    const res = await requester
      .post('/api/issues/functional-test-project')
      .send(sampleIssue);
    assert.equal(res.status, 201, 'response status code should be 201');
    assert.include(res.body, sampleIssue, 'response should contain input data');
    assert.include(
      res.body,
      {
        assigned_to: '',
        status_text: '',
      },
      'response should contain optional fields with empty values'
    );
  });

  test('Create an issue with missing required fields: POST request to /api/issues/{project}', async () => {
    const badIssue = {
      assigned_to: 'someone',
    };
    const res = await requester
      .post('/api/issues/functional-test-project')
      .send(badIssue);
    assert.equal(res.status, 200, 'appropriate status code should be returned');
    assert.equal(
      res.body.error,
      'required field(s) missing',
      'error should contain appropriate message'
    );
  });

  test('View issues on a project: GET request to /api/issues/{project}', async () => {
    const issue = (await populateRandomIssues(1, 'functional-test-project'))[0];
    const res = await requester.get('/api/issues/functional-test-project');
    assert.equal(res.status, 200, 'appropriate status code should be returned');
    assert.isArray(res.body, 'an array should be returned');
    assert.equal(res.body.length, 1, 'only one issue should be returned');
    assert.deepEqual(res.body[0], issue, 'returned issue should be correct');
  });

  test('View issues on a project with one filter: GET request to /api/issues/{project}', async () => {
    const issues = await populateRandomIssues(3, 'functional-test-project');
    const res = await requester
      .get('/api/issues/functional-test-project')
      .query({
        created_by: issues[1].created_by,
      });
    assert.equal(res.status, 200, 'appropriate status code should be returned');
    assert.isArray(res.body, 'array should be returned');
    assert.equal(res.body.length, 1, 'should return only matched issue');
    assert.deepStrictEqual(
      res.body[0],
      issues[1],
      'should return correct issue'
    );
  });

  test('View issues on a project with multiple filters: GET request to /api/issues/{project}', async () => {
    const issues = await populateRandomIssues(5, 'test-project');
    const res = await requester.get('/api/issues/test-project').query({
      issue_title: issues[3].issue_title,
      issue_text: issues[3].issue_text,
    });
    assert.equal(res.status, 200, 'appropriate status code should be returned');
    assert.isArray(res.body, 'array should be returned');
    assert.equal(res.body.length, 1, 'should return only a single match');
    assert.deepStrictEqual(
      res.body[0],
      issues[3],
      'should return the correct object'
    );
  });

  test('Update one field on an issue: PUT request to /api/issues/{project}', async () => {
    const issue = (await populateRandomIssues(1, 'test projct'))[0];
    const res = await requester
      .put('/api/issues/test-project')
      .send({ _id: issue._id, open: false });
    assert.equal(res.status, 201, 'appropriate status code should be returned');
    assert.equal(
      res.body.result,
      'successfully updated',
      'response should contain appropriate message'
    );
    assert.equal(
      res.body._id,
      issue._id,
      'response should contain updated issue id'
    );
  });

  test('Update multiple fields on an issue: PUT request to /api/issues/{project}', async () => {
    const issue = (await populateRandomIssues(1, 'my-project'))[0];
    const res = await requester.put('/api/issues/my-project').send({
      _id: issue._id,
      issue_title: 'changed issue title',
      issue_text: 'changed issue text',
    });
    assert.equal(res.status, 201, 'appropriate status code should be returned');
    assert.equal(
      res.body.result,
      'successfully updated',
      'response should contain appropriate message'
    );
    assert.equal(
      res.body._id,
      issue._id,
      'response should contain updated issue id'
    );
  });

  test('Update an issue with missing _id: PUT request to /api/issues/{project}', async () => {
    const badIssue = {};
    const res = await requester
      .put('/api/issues/functional-test-project')
      .send(badIssue);
    assert.equal(
      res.status,
      200,
      'appropriate error status should be returned'
    );
    assert.equal(
      res.body.error,
      'missing _id',
      'error should container appropriate message'
    );
  });

  test('Update an issue with no fields to update: PUT request to /api/issues/{project}', async () => {
    const issue = (await populateRandomIssues(1, 'my-project'))[0];
    const res = await requester
      .put('/api/issues/my-project')
      .send({ _id: issue._id });
    assert.equal(res.status, 201, 'appropriate status code should be returned');
    assert.equal(
      res.body.error,
      'no update field(s) sent',
      'error should contain appropriate message'
    );
    assert.equal(
      res.body._id,
      issue._id,
      'error should contain unchanged issue id'
    );
  });

  test('Update an issue with an invalid _id: PUT request to /api/issues/{project}', async () => {
    const badIssue = {
      _id: 'dummy id',
      issue_title: 'dummy title',
    };
    const res = await requester
      .put('/api/issues/functional-test-project')
      .send(badIssue);
    assert.equal(
      res.status,
      200,
      'appropriate error status should be returned'
    );
    assert.equal(
      res.body.error,
      'could not update',
      'error should contain appropriate message'
    );
    assert.equal(
      res.body._id,
      badIssue._id,
      'error should contain failed issue id'
    );
  });
  test('Delete an issue: DELETE request to /api/issues/{project}', async () => {
    const issue = (await populateRandomIssues(1, 'functional-test-project'))[0];
    const res = await requester
      .delete('/api/issues/functional-test-project')
      .send({ _id: issue._id });
    assert.equal(res.status, 201, 'appropriate status code should be returned');
    assert.equal(
      res.body.result,
      'successfully deleted',
      'response should contain appropriate message'
    );
    assert.equal(
      res.body._id,
      issue._id,
      'response should contain deleted issue id'
    );
  });

  test('Delete an issue with an invalid _id: DELETE request to /api/issues/{project}', async () => {
    const badIssue = {
      _id: 'dummy id',
    };
    const res = await requester
      .delete('/api/issues/functional-test-project')
      .send(badIssue);
    assert.equal(
      res.status,
      200,
      'should respond with appropriate status code'
    );
    assert.deepEqual(
      res.body,
      {
        error: 'could not delete',
        _id: badIssue._id,
      },
      'error should contain appropriate message and issue id'
    );
  });

  test('Delete an issue with missing _id: DELETE request to /api/issues/{project}', async () => {
    const badIssue = {};
    const res = await requester
      .delete('/api/issues/functional-test-project')
      .send(badIssue);
    assert.equal(
      res.status,
      200,
      'should response with appropriate status code'
    );
    assert.equal(
      res.body.error,
      'missing _id',
      'error should contain appropriate message'
    );
  });
});
