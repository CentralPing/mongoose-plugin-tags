var _ = require('lodash-node/modern');
// Simplistic Latin hashtag format
var defaultOptions = {
  fieldPath: undefined,
  path: 'tags',
  match: /[#＃][a-z_0-9]+/g,
  map: removeHash
};

module.exports = function tagsPlugin(schema, options) {
  options = _.merge({}, defaultOptions, options || {});

  if (!schema.path(options.fieldPath)) {
    return;
  }

  if (!schema.path(options.path)) {
    schema.path(options.path, [{
      type: String,
      select: false
    }]);
  }

  schema.pre('save', function setTags(next) {
    if (this.isModified(options.fieldPath)) {
      this.set(options.path,
        ((this.get(options.fieldPath) || '')
        .toLowerCase()
        .match(options.match) || [])
        .map(options.map)
        .filter(uniq)
      );
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
