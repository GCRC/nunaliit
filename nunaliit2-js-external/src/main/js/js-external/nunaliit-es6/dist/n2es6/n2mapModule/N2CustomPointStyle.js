/**
* @module n2es6/n2mapModule/N2CustomPointStyle
*/

import RegularShape from 'ol/style/RegularShape'
import Fill from 'ol/style/Fill'
import Stroke from 'ol/style/Stroke'
import {asString as ol_color_asString} from 'ol/color'



const colors =
{	
	"classic":	["#ffa500","blue","red","green","cyan","magenta","yellow","#0f0"],
	"dark":		["#960","#003","#900","#060","#099","#909","#990","#090"],
	"pale":		["#fd0","#369","#f64","#3b7","#880","#b5d","#666"],
	"pastel":	["#fb4","#79c","#f66","#7d7","#acc","#fdd","#ff9","#b9b"], 
	"neon":		["#ff0","#0ff","#0f0","#f0f","#f00","#00f"]
}
/**
 * @classdesc
 * Set chart style for vector features.
 *
 * @constructor
 * @param {object} options
 *	@param {String} options.type Chart type: pie,pie3D, donut or bar
 *	@param {number} options.radius Chart radius/size, default 20
 *	@param {number} options.rotation Rotation in radians (positive rotation clockwise). Default is 0.
 *	@param {bool} options.snapToPixel use integral numbers of pixels, default true
 *	@param {olstyleStroke} options.stroke stroke style
 *	@param {String|Array<olcolor>} options.colors predefined color set "classic","dark","pale","pastel","neon" / array of color string, default classic
 *	@param {number} options.offsetX X offset in px
 *	@param {number} options.offsetY Y offset in px
 *	@param {number} options.animation step in an animation sequence [0,1]
 *	@param {number} options.max maximum value for bar chart
 * @api
 */
class N2CustomPointStyle extends RegularShape{
	constructor(opt_options) {	
		var options = $n2.extend({
			radius : 0,
			donutScaleFactor: 1,
			stacking : true,
			map : null,
			data: undefined,
			startupOffset : 10,
			feature: null
		}, opt_options)
	

		
		
		if (options.stacking){
			var hist = N2CustomPointStyle.__stackingHistory;
			var previousRadius = options.startupOffset;
			if (hist){
				let ext = options.feature.getGeometry().getExtent();
				var cachedPointInfo = hist.getStackingHistory(ext);
				if( cachedPointInfo 
					&& Array.isArray(cachedPointInfo)
					&& cachedPointInfo.length > 0){
					for(var item of cachedPointInfo) {
						var incre = item.extra.incre;
						if (typeof incre === 'number')
							previousRadius += incre;
					}
				}
			}
			if (typeof options.data === 'object'
				&& typeof options.data.duration === 'number'){
				options.radius = previousRadius + options.data.duration;
			}
		} else {
			options.data.forEach(function(d){
			options.radius +=d.duration;
		})
		}
		options.radius *= 2* options.donutScaleFactor;
		
		RegularShape.prototype.contructor.apply (this,
				{	radius: options.radius , 
					fill: new Fill({color: [0,0,0]}),
					rotation: options.rotation,
					snapToPixel: options.snapToPixel
				});
		if (options.scale) this.setScale(options.scale);

		this.stroke_ = options.stroke || new Stroke({
													color: "#000",
													width: 2
													});
		
		this.donutratio_ = options.donutRatio || 0.5;
		this.donutScaleFactor = options.donutScaleFactor ;
		this.type_ = options.type;
		this.offset_ = [options.offsetX ? options.offsetX : 0, options.offsetY ? options.offsetY : 0];
		this.animation_ = (typeof(options.animation) == 'number') ? { animate:true, step:options.animation } : this.animation_ = { animate:false, step:1 };
		this.max_ = options.max;
		this.startupOffset_ = options.startupOffset;
		this.data_ = options.data;
		this._stacking = options.stacking;
		if (options.feature){
			this._ext = options.feature.getGeometry().getExtent();
		}
		if (options.colors instanceof Array)
		{	this.colors_ = options.colors;
		}
		else 
		{	this.colors_ = colors[options.colors];
			if (!this.colors_) this.colors_ = colors.classic;
		}
		if (options.stacking && options.map){
			if (! N2CustomPointStyle.__stackingHistory){
				N2CustomPointStyle.__stackingHistory = new N2StackingHistory({
					map: options.map
				});
			}
		}
		this.renderChart_();
}

	/**
	 *  Get data associatied with the chart
	 */
	getData() {
		return this.data_;
	}
	/**
	 * Set data associatied with the chart
	 * 
	 * @param {Array<number>} data
	 */
	setData (data) {
		this.data_ = data;
		this.renderChart_();
	}

	/**
	 * Get symbol radius
	 */
	getRadius() {
		return this.radius_;
	}
	/** Set symbol radius
	 *	@param {number} symbol radius
	 *	@param {number} donut ratio
	 */
	setRadius(radius, ratio) {
		this.radius_ = radius;
		this.donuratio_ = ratio || this.donuratio_;
		this.renderChart_();
	}

	/** Set animation step 
	 *	@param {false|number} false to stop animation or the step of the animation [0,1]
	 */
	setAnimation (step) {
		if (step===false) {
			if (this.animation_.animate == false) return;
			this.animation_.animate = false;
		} else {
			if (this.animation_.step == step) return;
			this.animation_.animate = true;
			this.animation_.step = step;
		}
		this.renderChart_();
	}
	_getPreviousRadius (){
		var hist = N2CustomPointStyle.__stackingHistory;
		var rst = this.startupOffset_;
		if (hist){
			var ext = this._ext;
			var cachedPointInfo = hist.getStackingHistory(ext);
			if( cachedPointInfo 
				&& Array.isArray(cachedPointInfo)
				&& cachedPointInfo.length > 0){
				for(var item of cachedPointInfo) {
					var incre = item.extra.incre;
					if (typeof incre === 'number')
					rst += incre;
				}
			}
		}
		return rst;
	}
	_appendNewRadius (ext, radius){
		var hist = N2CustomPointStyle.__stackingHistory;
		
		if (hist){
			var ext = this._ext;
			var extraInfo = {
				incre: radius
			};
			hist.addStackingHistory(ext, extraInfo);
			
		}
		
	}
	_getRings (){
		var rings = [];
		var currentRing = null;

		for(var i=0,e=this.data_.length; i<e; ++i){
			var entry = this.data_[i];
			
			var duration = entry.duration;
			var type = entry.type;
			
			if( duration > 0 ) {
				if( null != currentRing 
				 && currentRing.type !== type ) {
					currentRing = null;
				};
				if( null == currentRing ) {
					currentRing = {
						typeName: type.name
						,type: type
						,duration: 0
					};
					rings.push(currentRing);
				};
				currentRing.duration = currentRing.duration + duration;
			};
		};

		return rings;
	}
	/** @private
	*/
	renderChart_ (){	
		var strokeStyle;
		var strokeWidth = 0;
	
		if (this.stroke_) {
			strokeStyle = ol_color_asString(this.stroke_.getColor());
			strokeWidth = this.stroke_.getWidth();
		}
	
	//	no atlas manager is used, create a new canvas
		var canvas = this.getImage();
	
	//	draw the circle on the canvas
		var context = (canvas.getContext('2d'));
		context.clearRect(0, 0, canvas.width, canvas.width);
		context.lineJoin = 'round';
	
		var sum=0;
		var i, c;
		for (i=0; i<this.data_.length; i++)
			sum += this.data_[i];
	
	//	reset transform
		context.setTransform(1, 0, 0, 1, 0, 0);
	
	//	then move to (x, y)
		context.translate(0,0);
	
		var step = this.animation_.animate ? this.animation_.step : 1;
	//	console.log(this.animation_.step)
	
	//	Draw pie
		switch (this.type_){
		case "treeRing":{

			c = canvas.width/2;
			context.strokeStyle = strokeStyle;
			context.lineWidth = strokeWidth;
			context.save();
			//context.beginPath();
			context.rect ( 0,0,2*c,2*c );
			let rings = this._getRings();
			let currRadius = this.startupOffset_ ;
			
			for (let i = 0, e= rings.length; i<e; ++i){
				let ring = rings[i];
				let dur = ring.duration;
				let effectiveRadiusIncre = Math.floor(
						(1 * Math.sqrt( dur / 60 ) * this.donutScaleFactor * 7.7)
					);
				var type = ring.type;
				let region = new Path2D();
				region.arc(c, c, currRadius, 0, 2* Math.PI);
				currRadius += effectiveRadiusIncre;
				region.arc(c, c, currRadius, 2* Math.PI, 0);
				region.closePath();
				//context.lineWidth = 6;
				//context.stroke();
				context.fillStyle = type.strokeColor
				context.globalAlpha = type.opacity;
				context.fill(region, 'evenodd');
				context.restore();
			}
			break;
		}
			case "treeRingB":{

				c = canvas.width/2;
				context.strokeStyle = strokeStyle;
				context.lineWidth = strokeWidth;
				context.save();
				//context.beginPath();
				context.rect ( 0,0,2*c,2*c );
				let currRadius = this._getPreviousRadius();
				let ring = this.data_;
				let dur = ring.duration;
				let effectiveRadiusIncre = Math.floor(
						(1 * Math.sqrt( dur / 60 ) * this.donutScaleFactor * 7.7)
				);
				var type = ring.type;
				let region = new Path2D();
				region.arc(c, c, currRadius, 0, 2* Math.PI);
				currRadius += effectiveRadiusIncre;
				region.arc(c, c, currRadius, 2* Math.PI, 0);
				region.closePath();
				//context.lineWidth = 6;
				//context.stroke();
				context.fillStyle = type.strokeColor
				context.globalAlpha = type.opacity;
				context.fill(region, 'evenodd');
				context.restore();
				_appendNewRadius(this._ext,effectiveRadiusIncre);
				break;
			}
			case "donut":
			case "pie3D":
			case "pie": {
				var a, a0 = Math.PI * (step-1.5);
				c = canvas.width/2;
				context.strokeStyle = strokeStyle;
				context.lineWidth = strokeWidth;
				context.save();
				if (this.type_=="pie3D") 
				{	context.translate(0, c*0.3);
					context.scale(1, 0.7);
					context.beginPath();
					context.fillStyle = "#369";
					context.arc ( c, c*1.4, this.radius_ *step, 0, 2*Math.PI);
					context.fill();
					context.stroke();
				}
				if (this.type_=="donut")
				{	context.save();
					context.beginPath();
					context.rect ( 0,0,2*c,2*c );
					context.arc ( c, c, this.radius_ *step *this.donutratio_, 0, 2*Math.PI);
					context.clip("evenodd");
				}
				for (i=0; i<this.data_.length; i++)
				{	context.beginPath();
					context.moveTo(c,c);
					context.fillStyle = this.colors_[i%this.colors_.length];
					a = a0 + 2*Math.PI*this.data_[i]/sum *step;
					context.arc ( c, c, this.radius_ *step, a0, a);
					context.closePath();
					context.fill();
					context.stroke();
					a0 = a;
				}
				if (this.type_=="donut")
				{	context.restore();
					context.beginPath();
					context.strokeStyle = strokeStyle;
					context.lineWidth = strokeWidth;
					context.arc ( c, c, this.radius_ *step *this.donutratio_, Math.PI * (step-1.5), a0);
					context.stroke();
				}
				context.restore();
				break;
			}
			case "bar":
			default: {
				var max=0;
				if (this.max_){
					max = this.max_;
				}
				else{
					for (i=0; i<this.data_.length; i++)
					{	if (max < this.data_[i]) max = this.data_[i];
					}
				}
				var s = Math.min(5,2*this.radius_/this.data_.length);
				c = canvas.width/2;
				var b = canvas.width - strokeWidth;
				var x, x0 = c - this.data_.length*s/2
				context.strokeStyle = strokeStyle;
				context.lineWidth = strokeWidth;
				for (i=0; i<this.data_.length; i++)
				{	context.beginPath();
				context.fillStyle = this.colors_[i%this.colors_.length];
				x = x0 + s;
				var h = this.data_[i]/max*2*this.radius_ *step;
				context.rect ( x0, b-h, s, h);
			//	console.log ( x0+", "+(b-this.data_[i]/max*2*this.radius_)+", "+x+", "+b);
				context.closePath();
				context.fill();
				context.stroke();
				x0 = x;
				}
		
			}
		}
	
	//	Set Anchor
		var anchor = this.getAnchor();
		anchor[0] = c - this.offset_[0];
		anchor[1] = c - this.offset_[1];

	}
	

	getChecksum () {
		var strokeChecksum = (this.stroke_!==null) ?
			this.stroke_.getChecksum() : '-';
	
		var fillChecksum;
		var recalculate = (this.checksums_===null) ||
			(strokeChecksum != this.checksums_[1] ||
			fillChecksum != this.checksums_[2] ||
			this.radius_ != this.checksums_[3] ||
			this.data_.join('|') != this.checksums_[4]);
	
		if (recalculate) {
			var checksum = 'c' + strokeChecksum + fillChecksum 
				+ ((this.radius_ !== void 0) ? this.radius_.toString() : '-')
				+ this.data_.join('|');
			this.checksums_ = [checksum, strokeChecksum, fillChecksum, this.radius_, this.data_.join('|')];
		}
	
		return this.checksums_[0];
	};
}
export default N2CustomPointStyle