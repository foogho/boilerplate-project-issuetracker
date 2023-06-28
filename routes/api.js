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

    .put(function (req, res) {
      let project = req.params.project;
    })

    .delete(function (req, res) {
      let project = req.params.project;
    });
};
