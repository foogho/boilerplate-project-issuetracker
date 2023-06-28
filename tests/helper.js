const { faker } = require('@faker-js/faker');

const Issue = require('../models/issue');
const Project = require('../models/project');

// this function generate random issues. store them in the database
// and add their references to the project and finally
// return created mongodb documents.
// only required fields will be filled
async function populateRandomIssues(count = 1, projectTitle) {
  if (!projectTitle) {
    throw new Error('project title must be specified');
  }
  const randomIssues = [];
  for (let i = 1; i <= count; i++) {
    randomIssues.push({
      issue_title: faker.lorem.word(),
      issue_text: faker.lorem.sentence(),
      created_by: faker.person.fullName(),
    });
  }
  const project = await Project.create({ title: projectTitle });
  const docs = await Issue.insertMany(randomIssues);
  project.issues.push(...docs);
  await project.save();
  // for removing mongoose related methods and properties on docs
  // I use JSON.parse,JSON.stringify
  return docs.map((doc) => JSON.parse(JSON.stringify(doc)));
}

module.exports = { populateRandomIssues };
