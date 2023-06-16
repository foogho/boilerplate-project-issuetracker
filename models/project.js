const { Schema, model } = require('mongoose');

module.exports = model(
  'Project',
  new Schema({
    title: {
      type: String,
      required: true,
    },
    issues: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Issue',
      },
    ],
  })
);
