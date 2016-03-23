'use strict';
/* jshint node: true, mocha: true, expr: true */

var expect = require('chai').expect;
var mongoose = require('mongoose');
var tags = require('./tags');

var connectionString = process.env.MONGO_URL || 'mongodb://localhost/unit_test';

var Schema = mongoose.Schema;
var connection;

mongoose.Promise = global.Promise;

// Mongoose uses internal caching for models.
// While {cache: false} works with most models, models using references
// use the internal model cache for the reference.
// This removes mongoose entirely from node's cache
delete require.cache.mongoose;

var blogData = {
  title: 'My first blog! #Super',
  blog: 'This is my very first #blog! I hope you enjoy my #blog. #WOOHOO'
};
var expectedTags = ['blog', 'woohoo'];

before(function (done) {
  connection = mongoose.createConnection(connectionString);
  connection.once('connected', done);
});

after(function (done) {
  connection.db.dropDatabase(function (err, result) {
    connection.close(done);
  });
});

describe('Mongoose plugin: tags', function () {
  // Prevent test timeout on travis
  this.timeout(5000);

  describe('with plugin declaration', function () {
    var schema;

    beforeEach(function () {
      schema = blogSchema();
    });

    it('should not add `tags` to the schema without specifying other fields with the `optionKey`', function () {
      schema.plugin(tags);

      expect(schema.path('tags')).to.be.undefined;
    });

    it('should add `tags` to the schema with specifying other fields with the `optionKey`', function () {
      schema.path('blog').options.tags = true;
      schema.plugin(tags);

      expect(schema.pathType('tags')).to.be.equal('real');
    });

    it('should add `hashtags` to the schema with a `path` set to `hashtags`', function () {
      schema.path('blog').options.tags = true;
      schema.plugin(tags, {path: 'hashtags'});

      expect(schema.pathType('hashtags')).to.be.equal('real');
    });

    it('should add `tags` to the schema with specifying other fields with the `optionKey` set to `hashtags`', function () {
      schema.path('blog').options.hashtags = true;
      schema.plugin(tags, {optionKey: 'hashtags'});

      expect(schema.pathType('tags')).to.be.equal('real');
    });

    it('should set `tags` options with specified `path.options`', function () {
      schema.path('blog').options.tags = true;
      schema.plugin(tags, {options: {select: false}});

      expect(schema.pathType('tags')).to.be.equal('real');
      expect(schema.path('tags').options.select).to.be.equal(false);
    });
  });

  describe('with one field tagged', function () {
    var Blog;

    it('should compile the model with the tag plugin', function () {
      var schema = blogSchema();
      schema.path('blog').options.tags = true;
      schema.plugin(tags);

      Blog = model(schema);

      expect(Blog).to.be.an.instanceof(Function);
    });

    it('should set `tags` to an empty array', function () {
      var blog = new Blog();

      expect(blog.tags.toObject()).to.be.empty;
    });

    it('should set `tags` to an empty array on initial save with no tags', function () {
      var blog = new Blog();

      return blog.save().then(function (blog) {
        expect(blog.tags.toObject()).to.be.empty;
      });
    });

    it('should set `tags` to an empty array', function () {
      var blog = new Blog(blogData);

      expect(blog.tags.toObject()).to.be.empty;
    });

    it('should set `tags` to a unique array on initial save with tags', function () {
      var blog = new Blog(blogData);

      return blog.save().then(function (blog) {
        expect(blog.tags.toObject()).to.be.deep.equal(expectedTags);
      });
    });

    it('should update `tags` on subsequent saves', function () {
      var blog = new Blog(blogData);

      return blog.save().then(function (blog) {
        blog.blog = 'This is my sweet update! #foo #AhhhhYeah';

        // It shouldn't update tags till save call
        expect(blog.tags.toObject()).to.be.deep.equal(expectedTags);

        return blog.save();
      }).then(function (blog) {
        expect(blog.tags.toObject()).to.be.deep.equal(['foo', 'ahhhhyeah']);
      });
    });
  });

  describe('with multiple fields tagged', function () {
    var Blog;

    before(function () {
      var schema = blogSchema();
      schema.path('title').options.tags = true;
      schema.path('blog').options.tags = true;
      schema.plugin(tags);

      Blog = model(schema);
    });

    it('should set `tags` to an empty array', function () {
      var blog = new Blog();

      expect(blog.tags.toObject()).to.be.empty;
    });

    it('should set `tags` to an empty array on initial save with no tags', function () {
      var blog = new Blog();

      return blog.save().then(function (blog) {
        expect(blog.tags.toObject()).to.be.empty;
      });
    });

    it('should set `tags` to an empty array', function () {
      var blog = new Blog(blogData);

      expect(blog.tags.toObject()).to.be.empty;
    });

    it('should set `tags` to a unique array on initial save with tags', function () {
      var blog = new Blog(blogData);

      return blog.save().then(function (blog) {
        expect(blog.tags.toObject()).to.be.deep.equal(['super', 'blog', 'woohoo']);
      });
    });

    it('should update `tags` on subsequent saves', function () {
      var blog = new Blog(blogData);

      return blog.save().then(function (blog) {
        blog.blog = 'This is my sweet update! #foo #AhhhhYeah';

        // It shouldn't update tags till save call
        expect(blog.tags.toObject()).to.be.deep.equal(['super', 'blog', 'woohoo']);

        return blog.save();
      }).then(function (blog) {
        expect(blog.tags.toObject()).to.be.deep.equal(['super', 'foo', 'ahhhhyeah']);
      });
    });
  });
});

function model(name, schema) {
  if (arguments.length === 1) {
    schema = name;
    name = 'Model';
  }

  // Specifying a collection name allows the model to be overwritten in
  // Mongoose's model cache
  return connection.model(name, schema, name);
}

function blogSchema() {
  return new Schema({
    title: String,
    blog: String,
    created: {type: Date, 'default': Date.now}
  });
}
