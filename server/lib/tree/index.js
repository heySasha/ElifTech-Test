const mongoose = require('mongoose');
const Promise = require('bluebird');

mongoose.Promise = Promise;
const Schema = mongoose.Schema;

/**
 * @class Tree
 * Tree Behavior for Mongoose
 *
 * Implements the materialized path strategy with cascade child re-parenting
 * on delete for storing a hierarchy of documents with Mongoose
 *
 * @param  {Mongoose.Schema} schema
 * @param  {Object} options
 */
function tree(schema, options) {

  const pathSeparator = options && options.pathSeparator || '#';
  const wrapChildrenTree = options && options.wrapChildrenTree;
  const idType = options && options.idType || Schema.ObjectId;
  const pathSeparatorRegex = '[' + pathSeparator + ']';

  /**
   * Add parent and path properties
   *
   * @property {ObjectID} parent
   * @property {String} path
   */
  schema.add({
    parent: {
      type: idType,
      set(val) {
        return (val instanceof Object && val._id) ? val._id : val;
      },
      index: true
    },
    path: {
      type: String,
      index: true
    }
  });


  /**
   * Pre-save middleware
   * Build or rebuild path when needed
   *
   * @param  {Function} next
   */
  schema.pre('save', function preSave(next) {
    const isParentChange = this.isModified('parent');

    if (this.isNew || isParentChange) {
      if (!this.parent) {
        this.path = this._id.toString();
        return Promise.resolve().asCallback(next);
      }

      const self = this;
      return this.constructor.findOne({ _id: this.parent })
      .then(function (parentDoc) {
        const previousPath = self.path;
        self.path = parentDoc.path + pathSeparator + self._id.toString();
        // When the parent is changed we must rewrite all children paths as well
        if (isParentChange) {
          return Promise.all([
            self.constructor.find({path: {'$regex': '^' + previousPath + pathSeparatorRegex}}),
            previousPath,
            self.path
          ])
        } else {
          return Promise.resolve();
        }
      })
      // use then function to replace spread function
      // .spread(function (docs, previousPath, parentPath) {
      .then(function (result) {
        if (result[0]) {
          const promises = [];
          result[0].forEach(function (doc) {
            const newPath = result[2] + doc.path.substr(result[1].length);
            promises.push(self.constructor.findByIdAndUpdate(doc._id, { $set: { path: newPath } }));
          });
          return Promise.all(promises);
        } else {
          return Promise.resolve();
        }
      })
      .then(function (result) {
        return next(null, result);
      })
      .catch(function (err) {
        throw next(err, null);
      });
    } else {
      return Promise.resolve().asCallback(next);
    }

  });


    /**
     * Pre-remove middleware
     *
     * @param  {Function} next
     */
    schema.pre('remove', function preRemove(next) {

      if (!this.path)
        return next();

      // @TODO REPARENT mode support
      return this.collection.remove({ path: { '$regex': '^' + this.path + pathSeparatorRegex } })
      .then(function () {
        return Promise.resolve().asCallback(next);
      });

    });


    /**
     * @method getChildren
     *
     * @param  {Object}               filters (like for mongo find) (optional)
     * @param  {Object} or {String}   fields  (like for mongo find) (optional)
     * @param  {Object}               options (like for mongo find) (optional)
     * @param  {Boolean}              recursive, default false      (optional)
     * @return {Model}
     */
    schema.methods.getChildren = function getChildren(filters, fields, options, recursive) {

      if ('boolean' === typeof filters) {
        recursive = filters;
        filters = {};
        fields = null;
        options = {};
      } else if ('boolean' === typeof fields) {
        recursive = fields;
        fields = null;
        options = {};
      } else if ('boolean' === typeof options) {
        recursive = options;
        options = {};
      }

      filters = filters || {};
      fields = fields || null;
      options = options || {};
      recursive = recursive || false;

      if (recursive) {
        if(filters['$query']){
          filters['$query']['path'] = {$regex: '^' + this.path + pathSeparatorRegex};
        } else {
          filters['path'] = {$regex: '^' + this.path + pathSeparatorRegex};
        }
      } else {
        if(filters['$query']){
          filters['$query']['parent'] = this._id;
        } else {
          filters['parent'] = this._id;
        }
      }

      return this.model(this.constructor.modelName).find(filters, fields, options);
    };


    /**
     * @method getParent
     *
     * @param  {Function} next
     * @return {Model}
     */
    schema.methods.getParent = function getParent() {
      return this.model(this.constructor.modelName).findOne({ _id: this.parent });
    };


    /**
     * @method getAncestors
     *
     * @param  {Object}   args
     * @return {Model}
     */
    schema.methods.getAncestors = function getAncestors(filters, fields, options) {

      filters = filters || {};
      fields = fields || null;
      options = options || {};

      let ids = [];

      if (this.path) {
        ids = this.path.split(pathSeparator);
        ids.pop();
      }

      if(filters['$query']){
        filters['$query']['_id'] = { $in: ids };
      } else {
        filters['_id'] = { $in: ids };
      }

      return this.model(this.constructor.modelName).find(filters, fields, options);
    };


    /**
     * @method getChildrenTree
     *
     * @param  {Document} root (optional)
     * @param  {Object}   args (optional)
     * @param  {Object}        .filters (like for mongo find)
     * @param  {Object} or {String}   .fields  (like for mongo find)
     * @param  {Object}        .options (like for mongo find)
     * @param  {Number}        .minLevel, default 1
     * @param  {Boolean}       .recursive
     * @param  {Boolean}       .allowEmptyChildren
     * @return {Model}
     */
    schema.statics.getChildrenTree = function getChildrenTree(root, args, next) {

       if ("function" === typeof(root))
       {
           next = root;
           root = null;
           args = {};
       }
       else if ("function" === typeof(args)) {
           next = args;

           if ("model" in root) {
               args = {};
           }
           else
           {
               args = root;
               root = null
           }
       }

       const filters = args.filters || {};
       let fields = args.fields || null;
       const options = args.options || {};
       let minLevel = args.minLevel || 1;
       const recursive = args.recursive !== undefined ? args.recursive : true;
       const allowEmptyChildren = args.allowEmptyChildren !== undefined ? args.allowEmptyChildren : true;

       if (!next)
           throw new Error('no callback defined when calling getChildrenTree');

       // filters: Add recursive path filter or not
       if (recursive) {
           if (root) {
               filters.path = { $regex: '^' + root.path + pathSeparatorRegex };
           }

           if (filters.parent === null) {
               delete filters.parent;
           }

       } else {
           if (root) {
               filters.parent = root._id;
           }
           else {
               filters.parent = null
           }
       }

       // fields: Add path and parent in the result if not already specified
       if (fields) {
           if (fields instanceof Object) {
               if (!fields.hasOwnProperty('path')) {
                   fields['path'] = 1;
               }
               if (!fields.hasOwnProperty('parent')) {
                   fields['parent'] = 1;
               }
           }
           else {
               if (!fields.match(/path/)) {
                   fields += ' path';
               }
               if (!fields.match(/parent/)) {
                   fields += ' parent';
               }
           }
       }

       // options:sort , path sort is mandatory
       if (!options.sort) {
           options.sort = {};
       }
       options.sort.path = 1;

       if (options.lean == null) {
           options.lean = !wrapChildrenTree;
       }

       return this.find(filters, fields, options, function (err, results) {

           if (err) {
               return next(err);
           }

           const getLevel = function (path) {

               return path ? path.split(pathSeparator).length : 0;
           };

           const createChildren = function createChildren(arr, node, level) {

               if (level === minLevel) {
                   if (allowEmptyChildren) {
                       node.children = [];
                   }
                   return arr.push(node);
               }

               let nextIndex = arr.length - 1;
               let myNode = arr[nextIndex];

               if (!myNode) {
                   //console.log("Tree node " + node.name + " filtered out. Level: " + level + " minLevel: " + minLevel);
                   return []
               } else {
                   createChildren(myNode.children, node, level - 1);
               }
           };

           const finalResults = [];
           let rootLevel = 1;

           if (root) {
               rootLevel = getLevel(root.path) + 1;
           }

           if (minLevel < rootLevel) {
               minLevel = rootLevel
           }

           for (let r of Object.getOwnPropertyNames(results)) {
               let level = getLevel(results[r].path);
               createChildren(finalResults, results[r], level);
           }

           next(err, finalResults);

       });
    };


    schema.methods.getChildrenTree = function(args) {
      this.constructor.getChildrenTree(this, args)
    };


    /**
     * @property {Number} level <virtual>
     */
    schema.virtual('level').get(function virtualPropLevel() {
      return this.path ? this.path.split(pathSeparator).length : 0;
    });

}

module.exports = tree;
