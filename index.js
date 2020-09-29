const { Schema } = require('mongoose');

/**
 * @param {Schema} schema
 * @param {Object} options
 * @param {any} options.deletedAt this will merge into the _deletedAt field
 * @param {any} options.deleted this will merge into the _deleted field
 * @param {any} options.deletedBy if specified will ad the _deletedBy field to the schema
 */
module.exports = function plugin(schema, options = {}) {
  schema.add({
    _deletedAt: {
      type: Date,
      default: Date.now,
      required: false,
      ...options.deletedAt,
    },
  });

  schema.add({
    _deleted: {
      type: Boolean,
      required: true,
      default: false,
      ...options.deleted,
    },
  });

  // _deletedBy is only included if requested by the user
  if (options.deletedBy)
    schema.add({
      _deletedBy: { ...options.deletedBy },
    });

  /**
   * Bind on the models documents this softDelete method
   * @param {Boolean} shouldDelete Specify if the record is soft deleted or not. If the parameter is true and the record is already soft deleted then remove it completely.
   * @param {any} [by] Specify who soft deleted the record. If it is an object and has the property _id then that will be the value of _deletedBy else the value itself.
   * @returns {Promise<void>}
   */
  schema.methods.softDelete = async function (shouldDelete, by) {
    // Already soft deleted, so are you requesting to completely remove
    if (shouldDelete && this._deleted) await this.remove();
    else {
      this._deleted = shouldDelete;

      if (this._deleted) {
        // Update delete info
        this._deletedAt = Date.now();
        if (by) this._deletedBy = by._id ? by._id : by;
      }

      await this.save();
    }
  };

  // Simple aliases
  schema.methods.isSoftDeleted = function () {
    return this._deleted;
  };

  /**
   * Bind this middleware hook for handling the soft delete before saving
   * @param {Function | AsyncGeneratorFunction} handler
   * @returns {void}
   */
  schema.statics.preSoftDelete = function (handler) {
    schema.pre('save', async function () {
      if (this.isModified('_deleted')) await handler(this);
    });
  };
};
