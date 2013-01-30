var atlasDb = null;
var atlasDesign = null;
var serverDesign = null;
var atlasNotifier = null;

function findInvalidGeoms(){
	clearLogs();
	
	// Get all geometries
	atlasDesign.queryView({
		viewName: 'geom'
		,onSuccess: function(rows){
			var geomDocIdsDic = {};
			for(var i=0,e=rows.length;i<e;++i){
				var geomDocId = rows[i].id;
				geomDocIdsDic[geomDocId] = true;
			};
			
			var geomDocIds = [];
			for(geomDocId in geomDocIdsDic){
				geomDocIds.push(geomDocId);
			};
			
			if( geomDocIds.length < 1 ) {
				reportError('Can not find document containing a geometry');
			} else {
				fetchDocuments(geomDocIds);
			};
		}
		,onError: function(err){
			reportError('Unable to fetch geometries: '+err);
		}
	});
	
	function fetchDocuments(geomDocIds){
		// Get documents with geometries
		log('Fecthing '+geomDocIds.length+' document(s)');
		atlasDb.getDocuments({
			docIds: geomDocIds
			,onSuccess: analyzeDocuments
			,onError: function(err){
				reportError('Unable to fetch documents with geometries: '+err);
			}
		});
	};
	
	function analyzeDocuments(geomDocs){
		// Verify each document
		log('Analyzing '+geomDocs.length+' document(s)');
		var invalidCount = 0;
		for(var i=0,e=geomDocs.length; i<e; ++i){
			var geomDoc = geomDocs[i];
			var geoms = [];
			n2utils.extractGeometries(geomDoc, geoms);
			for(var j=0,k=geoms.length; j<k; ++j){
				var geom = geoms[j];
				var wkt = geom.wkt;
				if( wkt ) {
					var olGeom = OpenLayers.Geometry.fromWKT(wkt);
					if( olGeom ) {
						var isValid = $n2.olUtils.isValidGeom(olGeom);
						if( !isValid ) {
							++invalidCount;
							reportError('('+geomDoc._id+') contains invalid wkt: '+wkt);
						};
					} else {
						++invalidCount;
						reportError('('+geomDoc._id+') OpenLayers not able to read: '+wkt);
					};
				} else {
					++invalidCount;
					reportError('('+geomDoc._id+') contains a geometry without a "wkt" field');
				};
			};
		};
		if( invalidCount ) {
			log('Number of invalid geometries: '+invalidCount);
		};
		log('Done.');
	};
};

function reportError(err){
	var $logs = $('.logs');
	if( $logs.length < 1 ) {
		$logs = $('<div class="logs"></div>');
		$('body').append($logs);
	};
	
	var $d = $('<div class="error"></div>');
	$d.text(err);
	$logs.append($d);
};

function log(msg){
	var $logs = $('.logs');
	if( $logs.length < 1 ) {
		$logs = $('<div class="logs"></div>');
		$('body').append($logs);
	};
	
	var $d = $('<div></div>');
	$d.text(msg);
	$logs.append($d);
};

function clearLogs(){
	var $logs = $('.logs');
	$logs.empty();
};

function geometryMain() {
	var $findInvalidGeomsBtn = $('<button>Find Invalid Geoms</button>');
	$('#geometryButtons').append($findInvalidGeomsBtn);
	$findInvalidGeomsBtn.click(function(){
		findInvalidGeoms();
		return false;
	});
};

function geometryMainInit(config) {
	atlasDb = config.atlasDb;
	atlasDesign = config.atlasDesign;
	serverDesign = atlasDb.getDesignDoc({ddName:'server'});
	mediaDir = config.mediaRelativePath;
	atlasNotifier = config.atlasNotifier;

	if( config.directory && config.directory.authService ) {
		config.directory.authService.createAuthWidget({
			elemId: 'login'
		});
	};
	
	geometryMain();
};
