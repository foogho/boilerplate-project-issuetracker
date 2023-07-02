'use strict';

const Project = require('../models/project');
const Issue = require('../models/issue');

module.exports = function (app) {
  app
    .route('/api/issues/:project')
    .all(async (req, res, next) => {
      let inputProject = req.params.project;
      try {
        let project = await Project.findOne({ title: inputProject });
        // create the project if it doesn't exist
        if (!project) {
          project = new Project({ title: inputProject });
          await project.save();
        }
        req.project = project;
        next();
      } catch (error) {
        next(error);
      }
    })
    .get(async function (req, res, next) {
      try {
        const filters = req.query;
        const issues = (
          await req.project.populate({ path: 'issues', match: filters })
        ).issues;
        res.json(issues);
      } catch (error) {
        next(error);
      }
    })

    .post(async function (req, res, next) {
      try {
        const issue = new Issue(req.body);
        await issue.save();
        req.project.issues.push(issue);
        await req.project.save();
        res.status(201).json(issue);
      } catch (error) {
        next(error);
      }
    })

    .put(async function (req, res, next) {
      try {
        if (!req.body._id) {
          return res.status(200).json({
            error: 'missing _id',
          });
        }
        // return if request body contains only _id field
        if (Object.keys(req.body).length === 1) {
          return res.status(201).json({
            error: 'no update field(s) sent',
            _id: req.body._id,
          });
        }
        let issueToUpdate;
        // invalid _id inputs or _id inputs with no result will make
        // following block to throw exception. for catching only this exception
        // and respond to the client I wrote another try/catch
        try {
          issueToUpdate = await Issue.findById(req.body._id).orFail();
        } catch (error) {
          res.status(200).json({
            error: 'could not update',
            _id: req.body._id,
          });
        }
        Object.assign(issueToUpdate, req.body);
        await issueToUpdate.save();
        res.status(201).json({
          result: 'successfully updated',
          _id: req.body._id,
        });
      } catch (error) {
        next(error);
      }
    })

    .delete(async function (req, res, next) {
      try {
        if (!req.body._id) {
          res.status(200).json({ error: 'missing _id' });
        }
        await Issue.deleteOne({ _id: req.body._id });
        res.status(201).json({
          result: 'successfully deleted',
          _id: req.body._id,
        });
      } catch (error) {
        // catching exceptions related to casting _id
        if (error.name === 'CastError') {
          return res.status(200).json({
            error: 'could not delete',
            _id: req.body._id,
          });
        }
        next(error);
      }
    });
};
