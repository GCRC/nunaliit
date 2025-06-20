/**
 * @module n2es6/n2mapModule/N2Select
 */

import {default as Interaction} from 'ol/interaction/Interaction.js';
import Collection from 'ol/Collection.js';
import {click, pointerMove} from 'ol/events/condition.js';
import Event from 'ol/events/Event.js';
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };
var DH = 'n2.canvasMap';

const N2SelectEventType = {
		/**
		 * Triggered when features has been (de)selected.
		 * @event N2SelectEvent#hover
		 * @api
		 */
		HOVER : 'hover',
		/**
		 * Triggered when features has been (de)selected.
		 * @event N2SelectEvent#clicked
		 * @api
		 */
		CLICKED : 'clicked',
		/**
		 * Triggered when features has been (de)selected.
		 * @event N2SelectEvent#focus
		 */
		FOCUS : 'focus',
		/**
		 * Triggered when features has been (de)selected.
		 * @event N2SelectEvent#find
		 * @api
		 */
		FIND : 'find'
}

/**
 * @classdesc
 * @extends Event
 */
class N2SelectEvent extends Event {

	/**
	 * 
	 */
	constructor(type, selected ,deselected, upstreamEvent) {
		super(type);
		this.selected  = selected;
		this.deselected = deselected;
		this.upstreamEvent = upstreamEvent;
	}
}

/**
 * @classdesc
 * @extends Interaction
 * @fires N2SelectEvent
 * @api
 */
class N2Select extends Interaction {
	constructor(opt_options){
		const options = $n2.extend({

		}, opt_options)

		super({
			handleEvent: handleEvent_
		});
		this.hitTolerance_ = options.hitTolerance ? options.hitTolerance : 2;

		/**
		 * @private
		 * @type {boolean}
		 */
		this.multi_ = options.multi ? options.multi : false;
		this.clickedFeaturesCollection = new Collection();
		this.clickCondition_ = click;
		//clicked can return multiple ones.
		this.clickedFeatures_ = [];

		//hover can only hover one
		this.hoveredFeature_ = null;

		this.map_ = options.map ? options.map : null;

		this.setActive(true);

	}
	getHoveredFeatures() {
		return this.hoveredFeatures_;
	}

	getClickedFeatures(){
		return this.clickedFeatures_;
	}
	getHitTolerance() {
		return this.hitTolerance_;
	}

	setHitTolerance(hitTolerance) {
		this.hitTolerance_ = hitTolerance;
	}
	setActive(b){
		super.setActive(b)
	}
	getFeatures(){
		return this.clickedFeaturesCollection;
	}

}
/**
 * handleMove_ description
 * @this {N2Select}
 */
function handleEvent_(mapBrowserEvent) {

	const map = mapBrowserEvent.map;
	if (!pointerMove(mapBrowserEvent) && !click(mapBrowserEvent) ) {
		return true;
	}

	if (mapBrowserEvent.type == "pointermove") {
		if (mapBrowserEvent.dragging){
			return true;
		}
		let selected = null ;
		let deselected = null;

		map.forEachFeatureAtPixel(mapBrowserEvent.pixel,
				(function(f){
					selected = f;
					return true;
				}).bind(this),
				{
					hitTolerance: this.hitTolerance_
				});


		deselected = this.hoveredFeature_;
		this.hoveredFeature_ = selected;

		if (!selected && !deselected ){
			return true;
		} else if (selected && deselected 
				&& selected.fid === deselected.fid){
			return true;
		}
		this.dispatchEvent(
				new N2SelectEvent(N2SelectEventType.HOVER,
						selected || null, deselected, mapBrowserEvent)
		);

	} else if (this.clickCondition_(mapBrowserEvent)) {
		let selected = [];
		let deselected = [];
		this.clickedFeaturesCollection.clear();
		map.forEachFeatureAtPixel(mapBrowserEvent.pixel,
			(
				function(feature, layer) {
					if (feature) {
						selected.push(feature);
						this.clickedFeaturesCollection.push(feature);
						return true;
					}
				}
			).bind(this), {
				hitTolerance: this.hitTolerance_
			}
		);
		this.dispatchEvent(
				new N2SelectEvent(N2SelectEventType.CLICKED,
						selected, deselected, mapBrowserEvent));
	}

	return pointerMove(mapBrowserEvent);
}

export default N2Select;
