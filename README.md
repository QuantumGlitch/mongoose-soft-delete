# Package: mongoose-soft-deleting

Package for operating soft delete on mongoose models

# Install

`npm i mongoose-soft-deleting`

# Usage

By default the plugin include two new fields in the schema to which you want to apply it: \_deleted, \_deletedAt.
Which answer to the questions 'Is the document deleted ?' and 'When has been the document deleted ?'.
Optionally you can specify a \_deletedBy field too to answer the question 'Who deleted it?'.

The package provide a middleware hook too for intercepting the pre soft deleting.

## Example without user

```js
  const softDeletePlugin = require('mongoose-soft-deleting');

  // ...

  const TestSchema = new mongoose.Schema({
    A: { type: String, default: 'A' },
    B: { type: String, default: 'B' },
  });

  TestSchema.plugin(softDeletePlugin,
    {
        deleted: {
            // Optional mongoose field options
            ... deletedOptions
        },

        deletedAt: {
            // Optional mongoose field options
            ... deletedAtOptions
            // Example
            default: Date.now
        }
    }
  );

  const TestModel = mongoose.model('Test', TestSchema);

  // ...

  // Pre save
  TestSchema.preSoftDelete(async function(doc){
      // Document is trying to be soft deleted
  })

  // ...

  const doc = await TestModel.findOne(...);

  // To soft delete
  await doc.softDelete(true);

  // To restore from soft delete
  await doc.softDelete(false);

  // To completely remove: call it twice
  await doc.softDelete(true);
  await doc.softDelete(true);

  // or
  await doc.remove();

  // To know if it is deleted
  const isDeleted = doc.isSoftDeleted() || doc._deleted;

  // To know when
  const deletedAt = doc._deletedAt;
```

## Example with user

```js
const softDeletePlugin = require('mongoose-soft-deleting');

// ...

const TestSchema = new mongoose.Schema({
  A: { type: String, default: 'A' },
  B: { type: String, default: 'B' },
});

const UserTestSchema = new mongoose.Schema({
  name: { type: String, default: 'Name' },
  password: { type: String, default: '🤫' },
});

TestSchema.plugin(softDeletePlugin, {
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserTest',
    required: false,
  },
});

const TestModel = mongoose.model('Test', TestSchema);
const UserTestModel = mongoose.model('UserTest', UserTestSchema);

// ...

const user = UserTestModel.findById(...);
const test = TestModel.findById(...);

test.softDelete(true, user);

```

# Test

`npm run test`
