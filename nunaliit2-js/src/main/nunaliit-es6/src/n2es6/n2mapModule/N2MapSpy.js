

//import ol_control_Control from 'ol/control/Control'


class N2MapSpy{
	constructor(opt_options) {
		var options = $n2.extend({
			
		}, opt_options);

	}
	render_(){
		
	}
}

		//container = document.getElementById('map');

// 		{ol.layer} options.layers[j] // want an array of layers length i 
// 		// for (var i = 0; i < j; ++j){
// 		// 	addLayer(images[i]);

// N2MapSpy.prototype.setMap = function(map) {
// 	var i;
// 	var l;
  



// 	if (this.getMap()) {
// 	  for (i=0; i<this.layers.length; i++) {
// 		l = this.layers[i];
// 		if (l.right) l.layer.un(['precompose','prerender'], this.precomposeRight_);
// 		else l.layer.un(['precompose','prerender'], this.precomposeLeft_);
// 		l.layer.un(['postcompose','postrender'], this.postcompose_);
// 	  }
// 	  this.getMap().renderSync();
// 	}
  
// 	N2MapSpy.prototype.setMap.call(this, map);
  
// 	if (map) {
// 	  this._listener = [];
// 	  for (i=0; i<this.layers.length; i++) {
// 		l = this.layers[i];
// 		if (l.right) l.layer.on(['precompose','prerender'], this.precomposeRight_);
// 		else l.layer.on(['precompose','prerender'], this.precomposeLeft_);
// 		l.layer.on(['postcompose','postrender'], this.postcompose_);
// 	  }
// 	  map.renderSync();
// 	}
//   };

  

export default N2MapSpy

	

	// isLayer_ = function(layer){
	// 	for (var k=0; k<this.layers.length; k++) {
	// 	  if (this.layers[k].layer === layer) return k;
	// 	}
	// 	return -1;
	//   };

	//   addLayer = function(layers) {
	// 	if (!(layers instanceof Array)) options.layers = [layers];
	// 	for (var i=0; i<layers.length; i++) {
	// 	  var l = layers[i];
	// 	  if (this.isLayer_(l) < 0) {
	// 		this.options.layers.push({ layer:l }); // if push() allocates more memory for the array should I initiall define the array as just 1 element
	// 	  }
	// 	}
	//   };

// 	  MakeMap = function(){
// 		// map is made elsewhere 

// 		// map = new Map({
// 		// layers: options.layers,
// 		// target: container,
// 		// view: new View({
// 		// 	center: fromLonLat([-161, 61]), // we still need to either edit the view feature out or change it
// 		// 	zoom: 7,
// 		// }),
// 		// });

// }