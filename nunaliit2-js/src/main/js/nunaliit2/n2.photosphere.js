/*
Copyright (c) 2014, Geomatics and Cartographic Research Centre, Carleton 
University
All rights reserved.

Redistribution and use in source and binary forms, with or without 
modification, are permitted provided that the following conditions are met:

 - Redistributions of source code must retain the above copyright notice, 
   this list of conditions and the following disclaimer.
 - Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.
 - Neither the name of the Geomatics and Cartographic Research Centre, 
   Carleton University nor the names of its contributors may be used to 
   endorse or promote products derived from this software without specific 
   prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE 
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE 
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE 
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR 
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF 
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS 
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN 
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) 
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE 
POSSIBILITY OF SUCH DAMAGE.
*/
;(function($n2){

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };

//*******************************************************
var PhotosphereDisplay = $n2.Class({

	elemId: null,
	camera: null,
	scene: null,
	renderer: null,
	isUserInteracting: null,
	hasUserInteracted: null,
	onMouseDownMouseX: null,
	onMouseDownMouseY: null,
	lon: null,
	lat: null,
	onMouseDownLon: null,
	onMouseDownLat: null,
	phi: null,
	theta: null,
	animateFn: null,
	lastCanvasWidth: null,
	lastCanvasHeight: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			elem: null
			,url: null
		},opts_);
		
		var _this = this;
		
		this.isUserInteracting = false;
		this.hasUserInteracted = false;
		this.onMouseDownMouseX = 0;
		this.onMouseDownMouseY = 0;
		this.lon = 0;
		this.lat = 0;
		this.onMouseDownLon = 0;
		this.onMouseDownLat = 0;
		this.phi = 0;
		this.theta = 0;
		this.animateFn = function(){
			_this._animate();
		};
		this.lastCanvasWidth = -1;
		this.lastCanvasHeight = -1;

		var $elem = opts.elem;
		this.elemId = $n2.utils.getElementIdentifier($elem);
		
		var canvasGeom = this._getCanvasSize();

		this.camera = new THREE.PerspectiveCamera( 75, canvasGeom.width / canvasGeom.height, 1, 1100 );
		this.camera.target = new THREE.Vector3( 0, 0, 0 );

		this.scene = new THREE.Scene();

		var geometry = new THREE.SphereGeometry( 500, 60, 40 );
		geometry.applyMatrix( new THREE.Matrix4().makeScale( -1, 1, 1 ) );

		var material = new THREE.MeshBasicMaterial( {
			map: THREE.ImageUtils.loadTexture( opts.url )
		} );

		var mesh = new THREE.Mesh( geometry, material );
		
		this.scene.add( mesh );

		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setSize( canvasGeom.width, canvasGeom.height );
		$elem[0].appendChild( this.renderer.domElement );

		$elem.mousedown(function( event ) {

			event.preventDefault();

			_this.isUserInteracting = true;
			_this.hasUserInteracted = true;

			_this.onPointerDownPointerX = event.clientX;
			_this.onPointerDownPointerY = event.clientY;

			_this.onPointerDownLon = _this.lon;
			_this.onPointerDownLat = _this.lat;
		});
		
		$elem.mousemove(function( event ) {
			if ( _this.isUserInteracting === true ) {
				_this.lon = ( _this.onPointerDownPointerX - event.clientX ) * 0.1 + _this.onPointerDownLon;
				_this.lat = ( event.clientY - _this.onPointerDownPointerY ) * 0.1 + _this.onPointerDownLat;
			};
		});
		
		$elem.mouseup(function( event ) {
			_this.isUserInteracting = false;
		});
		
		$elem.mouseout(function( event ) {
			_this.isUserInteracting = false;
		});
		
		$elem.on('mousewheel', function( event ) {

			if( event.originalEvent ) event = event.originalEvent;

			_this.hasUserInteracted = true;
			
			// WebKit
			if ( event.wheelDeltaY ) {
				_this.camera.fov -= event.wheelDeltaY * 0.05;

			// Opera / Explorer 9
			} else if ( event.wheelDelta ) {
				_this.camera.fov -= event.wheelDelta * 0.05;

			// Firefox
			} else if ( event.detail ) {
				_this.camera.fov += event.detail * 1.0;
			};

			_this.camera.updateProjectionMatrix();
		});

		$elem.on('DOMMouseScroll', function( event ) {
			// WebKit
			if ( event.wheelDeltaY ) {
				_this.camera.fov -= event.wheelDeltaY * 0.05;

			// Opera / Explorer 9
			} else if ( event.wheelDelta ) {
				_this.camera.fov -= event.wheelDelta * 0.05;

			// Firefox
			} else if ( event.detail ) {
				_this.camera.fov += event.detail * 1.0;
			};

			_this.camera.updateProjectionMatrix();
		});
		
		this._animate();
	},

	_animate: function() {
		var $elem = this._getElem();
		if( $elem.length > 0 ) {
			window.requestAnimationFrame( this.animateFn );
			
			var geom = this._getCanvasSize();
			if( geom.width !== this.lastCanvasWidth 
			 || geom.height !== this.lastCanvasHeight ){
				this._onCanvasResize();
				this.lastCanvasWidth = geom.width;
				this.lastCanvasHeight = geom.height;
			};
			
			this._update();
		};
	},
	
	_update: function() {

		if( this.hasUserInteracted === false ) {
			this.lon += 0.1;
		}

		this.lat = Math.max( - 85, Math.min( 85, this.lat ) );
		this.phi = THREE.Math.degToRad( 90 - this.lat );
		this.theta = THREE.Math.degToRad( this.lon );

		this.camera.target.x = 500 * Math.sin( this.phi ) * Math.cos( this.theta );
		this.camera.target.y = 500 * Math.cos( this.phi );
		this.camera.target.z = 500 * Math.sin( this.phi ) * Math.sin( this.theta );

		this.camera.lookAt( this.camera.target );

		/*
		// distortion
		this.camera.position.copy( this.camera.target ).negate();
		*/

		this.renderer.render( this.scene, this.camera );

	},
	
	_getElem: function(){
		return $('#'+this.elemId);
	},
	
	_getCanvasSize: function(){
		var geom = {};
		
		var $container = this._getElem();
		geom.width = $container.width();
		geom.height = $container.height();
		
		return geom;
	},
	
	_onCanvasResize: function(){
		var geom = this._getCanvasSize();
		
		this.camera.aspect = geom.width / geom.height;
		this.camera.updateProjectionMatrix();

		this.renderer.setSize( geom.width, geom.height );
	}
});

//*******************************************************
/*
 * Returns true if the logic to display photoshpere images is
 * available.
 */
function IsAvailable(){
	// three.js is required
	if( typeof(window.THREE) !== 'undefined' ){
		return true;
	};
	
	return false;
};

//*******************************************************
$n2.photosphere = {
	PhotosphereDisplay: PhotosphereDisplay	
	,IsAvailable: IsAvailable
};

})(nunaliit2);
