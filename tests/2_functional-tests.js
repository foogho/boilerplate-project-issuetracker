const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function () {
  let requester;
  let fetchOneIssue;
  suiteSetup(() => {
    requester = chai.request(server).keepOpen();
    fetchOneIssue = () => {
      requester.get('/api/issues/functional-test-project').end((err, res) => {
        if (err) {
          console.log(err);
          throw new Error('an error ocurred while fetching the issue');
        }
        return res.body[0];
      });
    };
  });

  test('Create an issue with every field: POST request to /api/issues/{project}', (done) => {
    const sampleIssue = {
      issue_title: 'functional test issue title',
      issue_text: 'functional test issue text',
      created_by: 'functional test',
      assigned_to: 'functional test',
      status_text: 'functional test issue status text',
    };
    requester
      .post('/api/issues/functional-test-project')
      .send(sampleIssue)
      .end((err, res) => {
        assert.equal(res.status, 201, 'response status should be 201');
        assert.deepInclude(
          res.body,
          sampleIssue,
          'response should contain created issue'
        );
        assert.containsAllKeys(
          res.body,
          ['created_on', 'updated_on', 'open', '_id'],
          'response should contain additional fields'
        );
        assert.equal(
          res.body.open,
          true,
          'open field should be true by default'
        );
        done();
      });
  });

  test('Create an issue with only required fields: POST request to /api/issues/{project}', (done) => {
    const sampleIssue = {
      issue_title: 'functional test issue title 2',
      issue_text: 'functional test issue text 2',
      created_by: 'functional test',
    };
    requester
      .post('/api/issues/functional-test-project')
      .send(sampleIssue)
      .end((err, res) => {
        assert.equal(res.status, 201, 'response status code should be 201');
        assert.deepInclude(
          res.body,
          sampleIssue,
          'response should contain input data'
        );
        assert.deepInclude(
          res.body,
          {
            assigned_to: '',
            status_text: '',
          },
          'response should contain optional fields with empty values'
        );
        done();
      });
  });

  test('Create an issue with missing required fields: POST request to /api/issues/{project}', (done) => {
    const badIssue = {
      assigned_to: 'someone',
    };
    requester
      .post('/api/issues/functional-test-project')
      .send(badIssue)
      .end((err, res) => {
        assert.equal(
          res.status,
          400,
          'appropriate status code should be returned'
        );
        assert.equal(
          res.body.error,
          'required field(s) missing',
          'error should contain appropriate message'
        );
        done();
      });
  });

  test('View issues on a project: GET request to /api/issues/{project}', (done) => {
    requester.get('/api/issues/functional-test-project').end((err, res) => {
      assert.equal(
        res.status,
        200,
        'appropriate status code should be returned'
      );
      assert.instanceOf(res.body, Array, 'an array should be returned');
      done();
    });
  });

  test('View issues on a project with one filter: GET request to /api/issues/{project}', (done) => {
    requester
      .get('/api/issues/functional-test-project')
      .query({
        created_by: 'functional test',
      })
      .end((err, res) => {
        assert.equal(
          res.status,
          200,
          'appropriate status code should be returned'
        );
        assert.instanceOf(res.body, Array, 'array should be returned');
        done();
      });
  });

  test('View issues on a project with multiple filters: GET request to /api/issues/{project}', (done) => {
    requester
      .get('/api/issues/funtional-test-project')
      .query({
        created_by: 'functional test',
        open: false,
      })
      .end((err, res) => {
        assert.equal(
          res.status,
          200,
          'appropriate status code should be returned'
        );
        assert.instanceOf(res.body, Array, 'array should be returned');
        done();
      });
  });

  test('Update one field on an issue: PUT request to /api/issues/{project}', (done) => {
    const issue = fetchOneIssue();
    issue.open = false;
    requester
      .put('/api/issues/functional-test-project')
      .send(issue)
      .end((err, res) => {
        assert.equal(
          res.status,
          201,
          'appropriate status code should be returned'
        );
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
        done();
      });
  });

  test('Update multiple fields on an issue: PUT request to /api/issues/{project}', (done) => {
    const issue = fetchOneIssue();
    issue.text = 'functional test issue updated text';
    issue.status_text = 'functional test issue updated status text';
    requester
      .put('/api/issues/functional-test-project')
      .send(issue)
      .end((err, res) => {
        assert.equal(
          res.status,
          201,
          'appropriate status code should be returned'
        );
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
        done();
      });
  });

  test('Update an issue with missing _id: PUT request to /api/issues/{project}', (done) => {
    const badIssue = {};
    requester
      .put('/api/issues/functional-test-project')
      .send(badIssue)
      .end((err, res) => {
        assert.equal(
          res.status,
          400,
          'appropriate error status should be returned'
        );
        assert.equal(
          res.body.error,
          'missing _id',
          'error should container appropriate message'
        );
        done();
      });
  });

  test('Update an issue with no fields to update: PUT request to /api/issues/{project}', (done) => {
    const issue = fetchOneIssue();
    requester
      .put('/api/issues/functional-test-project')
      .send(issue)
      .end((err, res) => {
        assert.equal(
          res.status,
          201,
          'appropriate status code should be returned'
        );
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
        done();
      });
  });

  test('Update an issue with an invalid _id: PUT request to /api/issues/{project}', (done) => {
    const badIssue = {
      _id: 'dummy id',
    };
    requester
      .put('/api/issues/functional-test-project')
      .send(badIssue)
      .end((err, res) => {
        assert.equal(
          res.status,
          400,
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
        done();
      });
  });
  test('Delete an issue: DELETE request to /api/issues/{project}', (done) => {
    const issue = fetchOneIssue();
    requester
      .delete('/api/issues/functional-test-project')
      .send(issue)
      .end((err, res) => {
        assert.equal(
          res.status,
          201,
          'appropriate status code should be returned'
        );
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
        done();
      });
  });

  test('Delete an issue with an invalid _id: DELETE request to /api/issues/{project}', (done) => {
    const badIssue = {
      _id: 'dummy id',
    };
    requester
      .delete('/api/issues/functional-test-project')
      .send(badIssue)
      .end((err, res) => {
        assert.equal(
          res.status,
          400,
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
        done();
      });
  });

  test('Delete an issue with missing _id: DELETE request to /api/issues/{project}', (done) => {
    const badIssue = {};
    requester
      .delete('/api/issues/functional-test-project')
      .send(badIssue)
      .end((err, res) => {
        assert.equal(
          res.status,
          400,
          'should response with appropriate status code'
        );
        done();
        assert.equal(
          res.body.error,
          'missing _id',
          'error should contain appropriate message'
        );
      });
  });
});
