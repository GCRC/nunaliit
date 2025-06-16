# Developing the n2es6 library

1. Ensure you are currently in the `nunaliit-es6` folder.
```sh
~/nunaliit/nunaliit2-js/src/main/nunaliit-es6$ pwd
/home/user/nunaliit/nunaliit2-js/src/main/nunaliit-es6
```

2. Ensure that you are running a compatible version of Node and npm.  
Presently, `node v22.15.1` and `npm v10.9.2` are the respective versions used. You can use [nvm](https://github.com/nvm-sh/nvm) to manage them (ex. `nvm use 22`). Install the relevant modules if not already done (`npm install`).
```sh
~/nunaliit/nunaliit2-js/src/main/nunaliit-es6$ nvm use 22
Now using node v22.15.1 (npm v10.9.2)
```

3. Run `npm run watch`.  Changes to files under the `src` directory will automatically rebuild the `n2es6` related files found at `dist/target/*`.

4. To update these in your respective Nunaliit version, copy all of the files found in the `dist/target/` folder into the `nunaliit_installation/internal/nunaliit2` folder.

5. `nunaliit update` to replace the existing versions of the code 

## Note
A sourcemap file is also generated that can be copied to the Nunaliit installation to assist with debugging. This file is not copied when Nunaliit itself is built.

# Adding new files/classes to the library
When a new file or class should be added to the library, you should edit and add the entry in the `src/index.js` file. Import and add to the respective folder object.  

Not all files need to be added, such as the `EditBar` and `ModifyFeature` files, which simply extend base _ol_ and _ol-ext_ functionality and override some behaviour.

Additionally, it can also be added to the existing global `nunaliit2`/`$n2` object.  
See an example at the bottom of `src/n2es6/n2mapModule/N2MapCanvas.js`. 

```js
/* This exposes functions and classes */
nunaliit2.n2es6 = {
	ol_proj_Projection: Projection,
	ol_proj_transformExtent: transformExtent,
	ol_extent_extend: extend,
	ol_extent_isEmpty: isEmpty,
	ol_sphere_getArea: getArea,
	ol_sphere_getLength: getLength,
	ol_sphere_getDistance: getDistance,
	ol_format_WKT: WKT
};

/* This exposes the class and functions that allow it to function in a default Nunaliit setting */
nunaliit2.canvasMap = {
	MapCanvas: N2MapCanvas
	, HandleCanvasAvailableRequest: HandleCanvasAvailableRequest
	, HandleCanvasDisplayRequest: HandleCanvasDisplayRequest
};
```
## Note
Previously, the `index.js` file was generated through the use of _jsdoc_ by annotating the relevant files to be included in the n2es6 bundle with a class description.

```js
/**
 * @classdesc
 * The description of your class here.
 * @api
 */
```
