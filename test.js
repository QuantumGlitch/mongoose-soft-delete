const mongoose = require('mongoose');
const assert = require('assert');
const softDeletePlugin = require('./');

mongoose.connect('mongodb://root@localhost:27017/admin', {
  dbName: 'mongoose-soft-deleting',
  useUnifiedTopology: true,
});

mongoose.connection.on('error', console.error.bind(console, "Con't connect to MongoDB."));

const TestSchema = new mongoose.Schema({
  A: { type: String, default: 'A' },
  B: { type: String, default: 'B' },
});

describe('Soft delete without User', async function () {
  TestSchema.plugin(softDeletePlugin);
  const TestModel = mongoose.model('Test', TestSchema);

  it('should add new fields to schema', async function () {
    assert(TestSchema.path('_deletedAt'), '_deletedAt should exists');
    assert(TestSchema.path('_deleted'), '_deleted should exists');
  });

  let one = null;
  let two = null;
  let three = null;

  before(async function () {
    one = await new TestModel().save();
    two = await new TestModel().save();
    three = await new TestModel().save();
  });

  it('should soft delete a document', async function () {
    await one.softDelete(true);
    assert(one.isSoftDeleted(), 'The document should be soft deleted');
  });

  it('should soft delete and restore a document', async function () {
    await two.softDelete(true);
    await two.softDelete(false);
    assert(!two.isSoftDeleted(), 'The document should not be soft deleted');
  });

  it('should completely remove the document', async function () {
    await three.softDelete(true);
    await three.softDelete(true);

    const againThree = await TestModel.findById(three._id);
    assert(!againThree, 'The document should removed');
  });
});

describe('Soft delete with User', async function () {
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

  it('should add new fields to schema', async function () {
    assert(TestSchema.path('_deletedAt'), '_deletedAt should exists');
    assert(TestSchema.path('_deletedBy'), '_deletedBy should exists');
    assert(TestSchema.path('_deleted'), '_deleted should exists');
  });

  let one = null;
  let two = null;
  let three = null;
  let userOne = null;

  before(async function () {
    one = await new TestModel().save();
    two = await new TestModel().save();
    three = await new TestModel().save();

    userOne = await new UserTestModel().save();
  });

  it('the user should soft delete a document', async function () {
    await one.softDelete(true, userOne);
    assert(one.isSoftDeleted(), 'The document should be soft deleted');
    assert(one._deletedBy === userOne._id, 'The document should be deleted by the userOne');
  });

  it('the user should soft delete and restore a document', async function () {
    await two.softDelete(true, userOne);
    await two.softDelete(false, userOne);
    assert(!two.isSoftDeleted(), 'The document should not be soft deleted');
    assert(two._deletedBy === userOne._id, 'The document should not be deleted by the userOne');
  });

  it('the user should completely remove the document', async function () {
    await three.softDelete(true, userOne);
    await three.softDelete(true, userOne);

    const againThree = await TestModel.findById(three._id);
    assert(!againThree, 'The document should removed');
  });
});
