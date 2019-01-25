# jsdoc-plugin-typescript

Plugin to make TypeScript's JSDoc type annotations work with JSDoc.

## Installation and use

JSDoc accepts plugins by simply installing their npm package:

    npm install --save-dev jsdoc-plugin-typescript

To configure JSDoc to use the plugin, add the following to the JSDoc configuration file, e.g. `conf.json`:

```json
"plugins": [
  "jsdoc-plugin-typescript"
],
"typescript": {
  "moduleRoot": "src"
}
```

See http://usejsdoc.org/about-configuring-jsdoc.html for more details on how to configure JSDoc.

In the above snippet, `"src"` is the directory that contains the source files. Inside that directory, each `.js` file needs a `@module` annotation with a path relative to that `"moduleRoot"`, e.g.

```js
/** @module ol/proj **/
```

## What this plugin does

When using the `class` keyword for defining classes (required by TypeScript), JSDoc requires `@classdesc` and `@extends` annotations. With this plugin, no `@classdesc` and `@extends` annotations are needed.

Types defined in a project are converted to JSDoc module paths, so they can be documented and linked properly.

In addition to types that are used in the same file that they are defined in, imported types are also supported.

TypeScript and JSDoc use a different syntax for imported types:

### TypeScript

**Named export:**
```js
/**
 * @type {import("./path/to/module").exportName}
 */
```

**Default export:**
```js
/**
 * @type {import("./path/to/module").default}
 */
```

**typeof type:**
```js
/**
 * @type {typeof import("./path/to/module").exportName}
 */
```

### JSDoc

**Named export:**
```js
/**
 * @type {module:path/to/module.exportName}
 */
```

**Default export assigned to a variable in the exporting module:**
```js
/**
 * @type {module:path/to/module~variableOfDefaultExport}
 */
```

This syntax is also used when referring to types of `@typedef`s and `@enum`s.

**Anonymous default export:**
```js
/**
 * @type {module:path/to/module}
 */
```

**typeof type:**
```js
/**
 * @type {Class<module:path/to/module.exportName>}
 */
```
