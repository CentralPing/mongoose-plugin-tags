var _ = require('lodash-node/modern');
// Simplistic Latin hashtag format

/**
 * @module mongoose-plugin-tags
 * @example
```js
var tagsPlugin = require('mongoose-plugin-tags');
var schema = Schema({...});
schema.plugin(tagsPlugin[, OPTIONS]);
```
*/

module.exports = function tagsPlugin(schema, options) {
    /**
   * @param {object} [options]
   * @param {string} options.path=tags - the path to create the propterty for storing tags.
   * @param {string} options.optionKey=tags - the path options key to mark paths for inclusion in tagging.
   * @param {object} options.options - property options to set (`type` will always be an `Array` of `String`). `(e.g. {select: false})`
   * @param {string} options.match=/[#＃][a-z_0-9]+/g - the regular expression to match tags.
   * @param {string} options.map=function - the function to strip tag indicators (e.g. '#'). Defaults to stripping the first character from a tag.
  */
  options = _.merge({
    optionKey: 'tags',
    path: 'tags',
    options: {},
    match: /[#＃][a-z_0-9]+/g,
    map: removeHash
  }, options || {});

  // Grab all paths marked with optionKey
  var paths = Object.keys(schema.paths).filter(function (path) {
    var schemaType = schema.path(path);

    if (schemaType.options) {
      // Ensure type is String since tags are parsed from Strings
      if (schemaType.options.type !== undefined && schemaType.options.type.name !== 'String') {
        return;
      }

      // Check if options includes optionKey
      return schemaType.options[options.optionKey];
    }
  });

  // No paths marked so move along, nothing to do here
  // TODO: possibly throw an error or at least a warning
  if (paths.length === 0) { return; }

  schema.path(options.path, _.assign(options.options, {
    type: [{type: String}],
  }));

  schema.pre('save', function setTags(next) {
    var doc = this;
    var tags;

    // Only update if one of the marked paths is modified
    if (paths.some(doc.isModified, doc)) {
      doc.set(options.path, paths.reduce(function (tags, path) {
        var val = doc.get(path) || '';
        var matches = val.toLowerCase().match(options.match) || [];

        return tags.concat(matches.map(options.map));
      }, []).filter(uniq));
    }

    return next();
  });
};

function removeHash(tag) {
  return tag.substr(1);
}

function uniq(tag, index, tags) {
  // indexOf returns first index of matched element
  // subsequent duplicates will have a higer index value
  return (tags.indexOf(tag) === index);
}
