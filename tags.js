var _ = require('lodash-node/modern');
// Simplistic Latin hashtag format

module.exports = function tagsPlugin(schema, options) {
  options = _.merge({
    optionKey: 'tags',
    path: 'tags',
    match: /[#＃][a-z_0-9]+/g,
    map: removeHash
  }, options || {});

  var paths = Object.keys(schema.paths).filter(function (path) {
    var schemaType = schema.path(path);

    if (schemaType.options) {
      if (schemaType.options.type !== undefined && schemaType.options.type.name !== 'String') {
        return;
      }

      return schemaType.options[options.optionKey];
    }
  });

  if (paths.length === 0) { return; }

  if (!schema.path(options.path)) {
    schema.path(options.path, [{
      type: String,
      select: false
    }]);
  }

  schema.pre('save', function setTags(next) {
    var doc = this;
    var tags;

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
