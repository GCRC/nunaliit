/**
* @module n2es6/common/N2Object
*/

var n2class = nunaliit2.Construct("N2BaseClass",{
	constructor : function(){}
});


/**
* @classdesc
* The N2Object class is the base class Nunaliit-es6
* @api
*/
var test = new n2class();
var N2Object = function(){};
_inherits(N2Object, n2class)
function _inherits(subCtor, superClass) {
	
	function tempCtor() {};
	tempCtor.prototype = superClass.prototype;
	subCtor.prototype = new tempCtor();
	subCtor.prototype.constructor = subCtor;
	
	
//    if (typeof superClass !== 'function' && superClass !== null) {
//        throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass)
//    }
//    subClass.prototype = Object.create(superClass && superClass.prototype, {
//        constructor: {
//            value: subClass,
//            enumerable: false,
//            writable: true,
//            configurable: true
//        }
//    });
    
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subCtor, superClass) : subCtor.__proto__ = superClass;

}
export default N2Object;