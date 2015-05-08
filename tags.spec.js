'use strict';
/* jshint node: true, jasmine: true */

var mongoose = require('mongoose');
var tags = require('./tags');
var Schema = mongoose.Schema;
var connection;

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

beforeAll(function (done) {
  connection = mongoose.createConnection('mongodb://localhost/unit_test');
  connection.once('connected', function () {
    done();
  });
});

afterAll(function (done) {
  connection.db.dropDatabase(function (err, result) {
    connection.close(function () {
      done();
    });
  });
});

describe('Mongoose plugin: tags', function () {
  describe('with plugin declaration', function () {
    var schema;

    beforeEach(function () {
      schema = blogSchema();
    });

    it('should not add `tags` to the schema without specifying other fields with the `optionKey`', function () {
      schema.plugin(tags);
      expect(schema.path('tags')).toBeUndefined();
    });

    it('should add `tags` to the schema with specifying other fields with the `optionKey`', function () {
      schema.path('blog').options.tags = true;
      schema.plugin(tags);
      expect(schema.pathType('tags')).toBe('real');
    });

    it('should add `hashtags` to the schema with a `path` set to `hashtags`', function () {
      schema.path('blog').options.tags = true;
      schema.plugin(tags, {path: 'hashtags'});
      expect(schema.pathType('hashtags')).toBe('real');
    });

    it('should add `tags` to the schema with specifying other fields with the `optionKey` set to `hashtags`', function () {
      schema.path('blog').options.hashtags = true;
      schema.plugin(tags, {optionKey: 'hashtags'});
      expect(schema.pathType('tags')).toBe('real');
    });

    it('should set `tags` options with specified `path.options`', function () {
      schema.path('blog').options.tags = true;
      schema.plugin(tags, {options: {select: false}});
      expect(schema.pathType('tags')).toBe('real');
      expect(schema.path('tags').options.select).toBe(false);
    });
  });

  describe('with one field tagged', function () {
    var Blog;

    it('should compile the model with the tag plugin', function () {
      var schema = blogSchema();
      schema.path('blog').options.tags = true;
      schema.plugin(tags);

      Blog = model(schema);
      expect(Blog).toEqual(jasmine.any(Function));
    });

    it('should set `tags` to an empty array', function () {
      var blog = new Blog();
      expect(blog.tags.toObject()).toEqual([]);
    });

    it('should set `tags` to an empty array on initial save with no tags', function (done) {
      var blog = new Blog();
      blog.save(function (err, blog) {
        expect(blog.tags.toObject()).toEqual([]);
        done();
      });
    });

    it('should set `tags` to an empty array', function () {
      var blog = new Blog(blogData);
      expect(blog.tags.toObject()).toEqual([]);
    });

    it('should set `tags` to a unique array on initial save with tags', function (done) {
      var blog = new Blog(blogData);
      blog.save(function (err, blog) {
        expect(blog.tags.toObject()).toEqual(expectedTags);
        done();
      });
    });

    it('should update `tags` on subsequent saves', function (done) {
      var blog = new Blog(blogData);
      blog.save(function (err, blog) {
        blog.blog = 'This is my sweet update! #foo #AhhhhYeah';

        // It shouldn't update tags till save call
        expect(blog.tags.toObject()).toEqual(expectedTags);

        blog.save(function (err, blog) {
          expect(blog.tags.toObject()).toEqual(['foo', 'ahhhhyeah']);
          done();
        });
      });
    });
  });

  describe('with multiple fields tagged', function () {
    var Blog;

    beforeAll(function () {
      var schema = blogSchema();
      schema.path('title').options.tags = true;
      schema.path('blog').options.tags = true;
      schema.plugin(tags);

      Blog = model(schema);
    });

    it('should set `tags` to an empty array', function () {
      var blog = new Blog();
      expect(blog.tags.toObject()).toEqual([]);
    });

    it('should set `tags` to an empty array on initial save with no tags', function (done) {
      var blog = new Blog();
      blog.save(function (err, blog) {
        expect(blog.tags.toObject()).toEqual([]);
        done();
      });
    });

    it('should set `tags` to an empty array', function () {
      var blog = new Blog(blogData);
      expect(blog.tags.toObject()).toEqual([]);
    });

    it('should set `tags` to a unique array on initial save with tags', function (done) {
      var blog = new Blog(blogData);
      blog.save(function (err, blog) {
        expect(blog.tags.toObject()).toEqual(['super', 'blog', 'woohoo']);
        done();
      });
    });

    it('should update `tags` on subsequent saves', function (done) {
      var blog = new Blog(blogData);
      blog.save(function (err, blog) {
        blog.blog = 'This is my sweet update! #foo #AhhhhYeah';

        // It shouldn't update tags till save call
        expect(blog.tags.toObject()).toEqual(['super', 'blog', 'woohoo']);

        blog.save(function (err, blog) {
          expect(blog.tags.toObject()).toEqual(['super', 'foo', 'ahhhhyeah']);
          done();
        });
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
