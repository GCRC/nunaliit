OpenLayers.Control.EditFeatureAttributes = OpenLayers.Class(OpenLayers.Control, {

    /**
     * Property: layer
     * {<OpenLayers.Layer.Vector>}
     */
    layer: null,

    /**
    * Property: isActive
    * {boolean}
    */
   isActive: false,

    
    /**
     * Constructor: OpenLayers.Control.EditFeatureAttributes
     * Create a new feature editing form to give values to the features attributes
     * The form is auto generated from a DwescribeFeatureType response from
     * a WFS.
     * 
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *                    the control
     */
    initialize: function(layer, options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        this.layer = layer;
        this.div.className = this.displayClass;
        
        this.layer.featureSchema = new OpenLayers.Protocol.HTTP({
          url: layer.protocol.url,
          params: {
            typename: layer.protocol.params.typename,
            service: layer.protocol.params.service,
            version: layer.protocol.params.version,
            request: "DescribeFeatureType"
          },
          callback: this.onSchemaRead,
          scope: this,
          format: new OpenLayers.Format.WFSDescribeFeatureType()
        });
        this.layer.featureSchema.read();
        this.layer.events.register('featureadded', this, this.newFeature);
        this.layer.events.register('featureselected', this, this.selectFeature);
    },
    
	/**
	 * APIMethod: activate
	 * turn on the handler
	 */
	activate: function() {
		this.isActive = true;
	},
	   
	/**
	 * APIMethod: deactivate
	 * turn off the handler
	 */
	deactivate: function() {
		this.isActive = false;
	},
    
	onSchemaRead: function(schema) {
		//alert(schema.features[0].name+":"+schema.features[0].type);
		//generate dialog form from schema
		this.schema = schema;
	},
    
    newFeature: function(evt) {
		if( this.isActive ) {	
			this.selectFeature(evt);
			this.currentFeature.state = OpenLayers.State.INSERT;
		};
    },
    
    selectFeature: function(evt) {
		if( this.isActive ) {
			this.populate(evt.feature);
		};
    },
    
    // This function creates the form where the values for a
    // feature can be edited. At the end of this function:
    // - the element this.div will be updated with a form
    //   reflecting both the schema and feature selected
    // - this.fields will have a list of HTML input elements
    //   used to edit the values of the selected feature
	populate: function(feature) {
		
		this.currentFeature = feature;

		// Create new form
		var formDiv = document.createElement('ul');
		formDiv.innerHTML = 'Feature Type: '+ typename;
		this.div.innerHTML = '';
		this.div.appendChild(formDiv);
		
		// Create new fields
		this.fields = [];
		var fields = this.fields;

		// Ensure schema was read
		if( !this.schema ) {
			return;
		};
		
		var typename = this.layer.featureSchema.params.typename;
		var properties = this.schema.features.featureTypes[0].properties;
		for (var i=0; i<properties.length; ++i) {
			var element = properties[i];
			var type = element.type;
			var name = element.name;
			var fieldOpts = this.fieldOpts[name];
			var value = feature.attributes[name];
			
			if( fieldOpts ) {
				var mustHide = fieldOpts.hide;
				if( typeof mustHide === 'function' ) {
					mustHide = mustHide();
				};
				
				if( mustHide ) {
					addHidden(element, name, type, fieldOpts, value);
					
				} else if( fieldOpts.choices ) {
					addSelection(element, name, type, fieldOpts, value);
					
				} else if( fieldOpts.select ) {
					addCallback(element, name, type, fieldOpts, value);
					
				} else {
					addTextInput(element, name, type, fieldOpts, value);
				};
			} else {
				addTextInput(element, name, type, fieldOpts, value);
			};
		};
	      
		function addHidden(element, name, type, fieldOpts, value) {
			var field = document.createElement('input');
			field.type = "hidden";
			field.id = typename + "_" + name;
			field.attrName = name;
			field.schemaType = type;
			field.value = value ? value : '';
			
			if( fieldOpts && fieldOpts.defaultValue ) {
				field.defaultValue = fieldOpts.defaultValue;
			};

			fields.push(field);

			formDiv.appendChild(field);
		};
      
		function addTextInput(element, name, type, fieldOpts, value) {
			var field = null;

			//TODO: add more support for feature schema elements and types 
			switch (type) {
				case 'xsd:string':
					field = document.createElement('input');
					break;
				case 'xsd:int':
					field = document.createElement('input');
					break;
				default:
					break;
			};
			if (field) {
				field.nillable = element.nillable == 'false' ? false:true;
				field.minOccurs = parseInt(element.minOccurs);
				field.maxOccurs = parseInt(element.maxOccurs);
				field.id = typename + "_" + name;
				field.attrName = name;
				field.schemaType = type;
				field.value = value ? value : '';
				
				if( fieldOpts && fieldOpts.defaultValue ) {
					field.defaultValue = fieldOpts.defaultValue;
				};

				fields.push(field);

				//TODO: if maxOccurs > 1, add a + sign to insert another field
				var inputArea = document.createElement('li');
				formDiv.appendChild(inputArea);
				var label = document.createElement('label');
				label.innerHTML = name + " : ";
				inputArea.appendChild(label);
				inputArea.appendChild(field);
			};
		};
	      
		function addSelection(element, name, type, fieldOpts, value) {
			var field = document.createElement('select');
			for(var loop=0; loop<fieldOpts.choices.length; ++loop) {
				var choice = fieldOpts.choices[loop];
				
				var option = document.createElement('option');
				option.value = choice.value;
				var label = choice.value;
				if( choice.label ) {
					label = choice.label;
				};
				option.innerHTML = ' '+label+' ';
				
				field.appendChild(option);
			};
			
			field.nillable = element.nillable == 'false' ? false:true;
			field.minOccurs = parseInt(element.minOccurs);
			field.maxOccurs = parseInt(element.maxOccurs);
			field.id = typename + "_" + name;
			field.attrName = name;
			field.schemaType = type;
			field.value = value ? value : '';
			
			if( fieldOpts && fieldOpts.defaultValue ) {
				field.defaultValue = fieldOpts.defaultValue;
			};
			
			fields.push(field);

			var inputArea = document.createElement('li');
			formDiv.appendChild(inputArea);
			var label = document.createElement('label');
			label.innerHTML = name + " : ";
			inputArea.appendChild(label);
			inputArea.appendChild(field);
		};
	      
		function addCallback(element, name, type, fieldOpts, value) {
			var field = document.createElement('input');

			field.nillable = element.nillable == 'false' ? false:true;
			field.minOccurs = parseInt(element.minOccurs);
			field.maxOccurs = parseInt(element.maxOccurs);
			field.id = typename + "_" + name;
			field.attrName = name;
			field.schemaType = type;
			field.value = value ? value : '';
			
			if( fieldOpts && fieldOpts.defaultValue ) {
				field.defaultValue = fieldOpts.defaultValue;
			};

			fields.push(field);

			var inputArea = document.createElement('li');
			formDiv.appendChild(inputArea);
			var label = document.createElement('label');
			label.innerHTML = name + " : ";
			inputArea.appendChild(label);
			inputArea.appendChild(field);
			
			// Add a button to select via the callback
			var buttonElem = document.createElement('input');
			buttonElem.setAttributeNS(null, 'class', 'editAttrSelectButton');
			buttonElem.type = 'button';
			buttonElem.value = '...';
			buttonElem.onclick = function(){
				fieldOpts.select(feature, onSelect);
				return false;
			};
			inputArea.appendChild(buttonElem);
			
			function onSelect(value_) {
				field.value = value_;
			};
		};
	},
    
    //call this method to transfer attribute form values into the 
    //feature.attributes when the form is submitted
    updateFeature: function(feature) {
      if (feature) {
        this.currentFeature = feature;
      };
      if( this.currentFeature ) {
	      var modified = false;
	      var typename = this.layer.featureSchema.params.typename;
	      for (var i=0; i<this.fields.length; ++i) {
	        var attrName = this.fields[i].attrName;
	        var attrValue = this.currentFeature.attributes[attrName];
	        attrValue = attrValue ? attrValue : ''; //convert a null attrValue to empty string for the comparison below
	        if (attrValue != this.fields[i].value) {
	          this.currentFeature.attributes[attrName] = this.fields[i].value;
	          modified = true;
	        }
	        if (this.fields[i].minOccurs > 0) {
	          if (this.currentFeature.attributes[attrName] == '' || this.currentFeature.attributes[attrName] == undefined) {
	            this.currentFeature.attributes[attrName] = this.fields[i].defaultValue;
	            modified = true;
	          }
	        }
	        if (this.currentFeature.attributes[attrName] == '' && !this.fields[i].nillable) {
	          alert("a value must be entered for the field "+attrName);
	          modified = false;
	          break;
	        }
	      }
	      if (modified && this.currentFeature.state != OpenLayers.State.INSERT) {
	        this.currentFeature.state = OpenLayers.State.UPDATE;    
	      }
      };
    },
    
    CLASS_NAME: "OpenLayers.Control.EditFeatureAttributes"
});
