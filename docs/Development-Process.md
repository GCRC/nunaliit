**Note: This is currently a work in progress**

# Table of Contents
1. [Guidelines](#guidelines)
    1. [Javascript Coding Style](#javascript-coding-style)
    1. [Java Coding Style](#java-coding-style)
1. [Issue Tracking](#issue-tracking)
1. [GitHub Flow](#github-flow)

# Guidelines

The following lightweight rules and processes are designed to ensure quality and consistency in developing the Nunaliit framework. These practices were taken from a variety of organizations who are getting things done well.

## Code Style Guidelines

### All Languages
1. When indenting, use tabs not spaces in all file formats.

### Javascript Coding Style
  #### Table of Contents
   1. [Comments](#comments)
   1. [Miscellaneous](#miscellaneous)

  #### Comments

Classes, interfaces and records must be documented with a description and any template parameters, implemented interfaces, visibility, or other appropriate tags. The class description should provide the reader with enough information to know how and when to use the class, as well as any additional considerations necessary to correctly use the class.
```
/**
 * @classdesc
 * An element to be displayed over the map and attached to a single map
 * location.  Like {@link module:ol/control/Control~Control}, Overlays are
 * visible widgets. Unlike Controls, they are not in a fixed position on the
 * screen, but are tied to a geographical coordinate, so panning the map will
 * move an Overlay but not a Control.
 *
 * Example:
 *
 *     import Overlay from 'ol/Overlay';
 *
 *     var popup = new Overlay({
 *       element: document.getElementById('popup')
 *     });
 *     popup.setPosition(coordinate);
 *     map.addOverlay(popup);
 *
 * @api
 * @listens eventname
 * @fires eventname
 */
class Overlay extends BaseObject {...}
```
```
/**
 * Detect features that intersect a pixel on the viewport, and execute a
 * callback with each intersecting feature.
 * @param {import("./pixel.js").Pixel} pixel Pixel.
 * @param {function} callback Feature callback. The callback will be
 *     called with two arguments.
 * @param {AtPixelOptions} opt_options Optional options.
 * @return {T|undefined} Callback result, i.e. the return value of last
 * callback execution, or the first truthy callback return value.
 */
forEachFeatureAtPixel(pixel, callback, opt_options) {...}
   ```

  #### Miscellaneous

    1. Function names with a `_` prefix imply that the function is private (i.e. not to be used outside of that 
      class).
    2. Variables which represent jQuery selections are prefixed with a `$`. e.g. `var $foobar = $('#foobar')`.
    3. When adding class names and ids to HTML elements using JavaScript, use snake case. e.g. `<div 
      class="foo_bar">`
    4. When creating lists of object properties, a comma should be at the start of the line beginning on the 
     second list item.
```javascript
var foo = {
	a: 1
	,b: 'two'
	,c: true
}
```

Existing style guides and best practices from big names:

* [AirBnB Style Guide](https://airbnb.io/javascript/)
* [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html)
* [JavaScript Standard Style Guide](https://github.com/standard/standard)

### CSS
1. When defining css style rules avoid defining them inline, instead try to break out the styling into an existing or new css document.

### Java

1. Use IntelliJ to format the code for you (changes settings to use tabs since it defaults to spaces). This saves some cognitive load and disagreements on the team.
2. Do not use `*` in import statements (e.g., `import package.*`). Configure IntelliJ to a very high number of imports before using the `*`, say 100.
3. Camel casing.

Existing style guides and best practices from big names:
* [Android Java Style Guide](https://source.android.com/setup/contribute/code-style)
* [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html)

# Issue Tracking

Issues are organized using `Labels` and `Milestone`.

## Labels

We use labels to organize issues as follows:
* Priority (importance of completion);
* Severity (system impact);
* Category (type of issue).

### Priority
Arguably the most important flag.  Indicates the priority of getting this issue done, and helps developers choose which issues to work on.  _The project manager performs triage and assigns priority._

| Priority   | Description                                                   | AKA            |
| ---------- | ------------------------------------------------------------- | -------------- |
| P0         | Highest priority, typically something that prevents a release | Blocker        |
| P1         | Important but would not stop a release                        | Critical, High |
| P2         | Things to fix once P0's and P1's are resolved                 | Medium, Low    |

### Severity
An objective assessment of an issue's impact to the functionality of the system.  Something can be severe , but not high priority (e.g., crashing bug on rarely used screen might get `P2`).  _This label is set by the person raising the issue._

| Severity   | Description                              |
| ---------- | ---------------------------------------- | 
| Critical   | Crash or hang                            |
| Major      | Functionality doesn't work               |
| Minor      | Minor functional or cosmetic issues      |

### Category 

Typically an issue is a `Bug` or an `Enhancement`, but there are other labels that can be applied.

## Milestones

Milestones are used to assign issues to releases (e.g., `2.2.9`). This is used for planning, and for developers to choose issues  on the upcoming release. 

## Creating Issues

Issues should be reasonably manageable in size, for the sake of frequent commits and merges into master. We've all done it, but it's not good practice to keep a feature in a working branch long term.

Ideally a single issue won't be an epic (see last sentence).  If you have an issue that can be broken into logical sub-tasks, or perhaps involves more than one developer, it's likely an epic.  Create a parent issue and add a task list that links to all the issues within the epic.  For example, in an epic issue, do the following:
```
[ ] Create requirements #1230
[ ] Database upgrades #1231
[ ] Design and implement UI changes #1232
```

If possible, aim to merge each of these sub-tasks (distinct issues) into master as they are developed.  If that's not possible, at least work on the same branch (the "epic" branch).

# GitHub Flow

A work flow for using working on issues, from GitHub (more info:  https://guides.github.com/introduction/flow/).

1. _**Choose an issue**_ to work on.
1. _**Create a branch**_ off `master`.  Give it a descriptive name, like `refactor-authentication` or `add-atlas-document`.
1. _**Commit frequently**_, and push these commits to remote so you are backing up your work.  Always include the issue number and a useful commit message (e.g., `fix #123 Add atlas schema for future atlas document`).
1. _**Open a pull request**_, add two developers as reviewers.  Code reviews should encourage and capture discussions about the code and design, in addition to identifying coding style issues, or missing unit tests.
1. _**Merge into master**_. Once all reviewers are satisfied and your branch passes tests, the pull request can be merged into master.

