mongoose-plugin-tags
====================

[ ![Codeship Status for CentralPing/mongoose-plugin-tags](https://codeship.com/projects/39caf290-4b42-0132-6abf-22e4e23acdc5/status)](https://codeship.com/projects/46704)
[ ![Code Climate for CentralPing/mongoose-plugin-tags](https://codeclimate.com/github/CentralPing/mongoose-plugin-tags/badges/gpa.svg)](https://codeclimate.com/github/CentralPing/mongoose-plugin-tags)
[ ![Dependency Status for CentralPing/mongoose-plugin-tags](https://david-dm.org/CentralPing/mongoose-plugin-tags.svg)](https://david-dm.org/CentralPing/mongoose-plugin-tags)

A [mongoose.js](https://github.com/LearnBoost/mongoose/) plugin to automatically generate tags from a document path.

*Note: tagging updates occur when document is saved.*

## Installation

`npm i --save mongoose-plugin-tags`

## API Reference
**Example**  
```js
var tagsPlugin = require('mongoose-plugin-tags');
var schema = Schema({...});
schema.plugin(tagsPlugin[, OPTIONS]);
```
<a name="module_mongoose-plugin-tags..options"></a>
### mongoose-plugin-tags~options
**Kind**: inner property of <code>[mongoose-plugin-tags](#module_mongoose-plugin-tags)</code>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>object</code> |  |  |
| options.path | <code>string</code> | <code>&quot;tags&quot;</code> | the path to create the propterty for storing tags. |
| options.optionKey | <code>string</code> | <code>&quot;tags&quot;</code> | the path options key to mark paths for inclusion in tagging. |
| options.options | <code>object</code> |  | property options to set (`type` will always be an `Array` of `String`). `(e.g. {select: false})` |
| options.match | <code>string</code> | <code>&quot;/[#＃][a-z_0-9]+/g&quot;</code> | the regular expression to match tags. |
| options.map | <code>string</code> | <code>&quot;function&quot;</code> | the function to strip tag indicators (e.g. '#'). Defaults to stripping the first character from a tag. |


## Examples

### With A Single Field
```js
var tagsPlugin = require('mongoose-plugin-tags');
var schema = Schema({
  foo: {
    type: String,
    tags: true // indicates that foo should be included in tagging
  },
  bar: {type: String} // will not be included
});
schema.plugin(tagsPlugin);

var Foo = mongoose.model('Foo', schema);
var foo = Foo(); // foo.tags --> []
foo.foo = 'I just leanered what a hashtag is #BehindTheTimes'; // foo.tags --> []
foo.save(); // foo.tags --> ['BehindTheTimes']
```

### With Mulitple Fields
```js
var tagsPlugin = require('mongoose-plugin-tags');
var schema = Schema({
  foo: {
    type: String,
    tags: true // indicates that foo should be included in tagging
  },
  bar: {
    type: String,
    tags: true // indicates that bar should be included in tagging
  }
});
schema.plugin(tagsPlugin);

var Foo = mongoose.model('Foo', schema);
var foo = Foo(); // foo.tags --> []
foo.foo = 'You know what grinds my gears? #rant'; // foo.tags --> []
foo.bar = '#People #who #use #hashtags #like #this'; // foo.tags --> []
foo.save(); // foo.tags --> ['rant', 'people', 'who', 'use', 'hashtags', 'like', 'this']
```

# License

Apache 2.0
