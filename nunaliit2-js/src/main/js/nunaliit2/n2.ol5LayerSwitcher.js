/* Copyright (c) 2018-2024 by ol-layerswitcher Contributors (see authors.txt for 
 * full list of contributors). Published under the MIT license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

;(function($,$n2){
"use strict";
if( typeof(ol) !== 'undefined' ) {
//default export
ol.control.N2LayerSwitcher = $n2.Construct('N2LayerSwitcher', ol.control.Control,{
	constructor: function(opt_options){
		 var options = opt_options || {};

	        var tipLabel = options.tipLabel ?
	          options.tipLabel : 'Legend';

	        this.mapListeners = [];

	        this.hiddenClassName = 'ol-unselectable ol-control layer-switcher';
	        if (ol.control.N2LayerSwitcher.isTouchDevice_()) {
	            this.hiddenClassName += ' touch';
	        }
	        this.shownClassName = 'shown';

	        var element = document.createElement('div');
	        element.className = this.hiddenClassName;

	        var button = document.createElement('button');
	        button.setAttribute('title', tipLabel);
	        element.appendChild(button);

	        this.panel = document.createElement('div');
	        this.panel.className = 'panel';
	        element.appendChild(this.panel);
	        ol.control.N2LayerSwitcher.enableTouchScroll_(this.panel);

	        var this_ = this;

	        button.onmouseover = function(e) {
	            this_.showPanel();
	        };

	        button.onclick = function(e) {
	            e = e || window.event;
	            this_.showPanel();
	            e.preventDefault();
	        };

	        this_.panel.onmouseout = function(e) {
	            e = e || window.event;
	            if (!this_.panel.contains(e.toElement || e.relatedTarget)) {
	                this_.hidePanel();
	            }
	        };

	        ol.control.Control.call(this, {
	            element: element,
	            target: options.target
	        })
	}
	, showPanel: function(){
		 if (!this.element.classList.contains(this.shownClassName)) {
	            this.element.classList.add(this.shownClassName);
	            this.renderPanel();
		 }
		
	}
	,hidePanel : function() {
        if (this.element.classList.contains(this.shownClassName)) {
            this.element.classList.remove(this.shownClassName);
        }
	}
	,renderPanel : function() {

        this.ensureTopVisibleBaseLayerShown_();

        while(this.panel.firstChild) {
            this.panel.removeChild(this.panel.firstChild);
        }

        var ul = document.createElement('ul');
        this.panel.appendChild(ul);
        this.renderLayers_(this.getMap(), ul);

		}	
	,setMap : function(map) {
        // Clean up listeners associated with the previous map
        for (var i = 0, key; i < this.mapListeners.length; i++) {
            ol.Observable.unByKey(this.mapListeners[i]);
        }
        this.mapListeners.length = 0;
        // Wire up listeners etc. and store reference to new map
        ol.control.Control.prototype.setMap.call(this, map);
        if (map) {
            var this_ = this;
            this.mapListeners.push(map.on('pointerdown', function() {
                this_.hidePanel();
            }));
            this.renderPanel();
        }
	}
	,ensureTopVisibleBaseLayerShown_ : function() {
        var lastVisibleBaseLyr;
        ol.control.N2LayerSwitcher.forEachRecursive(this.getMap(), function(l, idx, a) {
            if (l.get('type') === 'base' && l.getVisible()) {
                lastVisibleBaseLyr = l;
            }
        });
        if (lastVisibleBaseLyr) this.setVisible_(lastVisibleBaseLyr, true);
	}
	,setVisible_ : function(lyr, visible) {
        var map = this.getMap();
        lyr.setVisible(visible);
        if (visible && lyr.get('type') === 'base') {
            // Hide all other base layers regardless of grouping
            ol.control.N2LayerSwitcher.forEachRecursive(map, function(l, idx, a) {
                if (l != lyr && l.get('type') === 'base') {
                    l.setVisible(false);
                }
            });
        }
	}
	,renderLayer_ : function(lyr, idx) {

        var this_ = this;

        var li = document.createElement('li');

        var lyrTitle = lyr.get('title');
        var lyrId = ol.control.N2LayerSwitcher.uuid();

        var label = document.createElement('label');

        if (lyr.getLayers && !lyr.get('combine')) {

            li.className = 'group';
            label.innerHTML = lyrTitle;
            li.appendChild(label);
            var ul = document.createElement('ul');
            li.appendChild(ul);

            this.renderLayers_(lyr, ul);

        } else {

            li.className = 'layer';
            var input = document.createElement('input');
            if (lyr.get('type') === 'base') {
                input.type = 'radio';
                input.name = 'base';
            } else {
                input.type = 'checkbox';
            }
            input.id = lyrId;
            input.checked = lyr.get('visible');
            input.onchange = function(e) {
                this_.setVisible_(lyr, e.target.checked);
            };
            li.appendChild(input);

            label.htmlFor = lyrId;
            label.innerHTML = lyrTitle;

            var rsl = this.getMap().getView().getResolution();
            if (rsl > lyr.getMaxResolution() || rsl < lyr.getMinResolution()){
                label.className += ' disabled';
            }

            li.appendChild(label);

        }

        return li;

	}
	,renderLayers_ : function(lyr, elm) {
        var lyrs = lyr.getLayers().getArray().slice().reverse();
        for (var i = 0, l; i < lyrs.length; i++) {
            l = lyrs[i];
            if (l.get('title')) {
                elm.appendChild(this.renderLayer_(l, i));
            }
        }
	}

})
	
ol.control.N2LayerSwitcher.forEachRecursive = function(lyr, fn) {
    lyr.getLayers().forEach(function(lyr, idx, a) {
        fn(lyr, idx, a);
        if (lyr.getLayers) {
            ol.control.N2LayerSwitcher.forEachRecursive(lyr, fn);
        }
    });
};

ol.control.N2LayerSwitcher.uuid = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
};

ol.control.N2LayerSwitcher.enableTouchScroll_ = function(elm) {
    if(ol.control.N2LayerSwitcher.isTouchDevice_()){
        var scrollStartPos = 0;
        elm.addEventListener("touchstart", function(event) {
            scrollStartPos = this.scrollTop + event.touches[0].pageY;
        }, false);
        elm.addEventListener("touchmove", function(event) {
            this.scrollTop = scrollStartPos - event.touches[0].pageY;
        }, false);
    }
};

ol.control.N2LayerSwitcher.isTouchDevice_ = function() {
    try {
        document.createEvent("TouchEvent");
        return true;
    } catch(e) {
        return false;
    }
};

}; // if(typeof(ol) !== 'undefined')

})(jQuery,nunaliit2);