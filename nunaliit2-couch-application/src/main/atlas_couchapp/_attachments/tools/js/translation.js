;(function($,$n2){

var DH = 'translation.js';	

var atlasDb = null;
var atlasDesign = null;
var currentView = 'l10n-pending';
var requestPanelName = null;

function selectionChanged() {
	var $select = $(this);
	currentView = $select.val();
	refreshView();
};

function upload() {
	var $btn = $(this);
	var $tr = $btn.parents('tr');
	
	var json = $tr.find('.json').val();
	var data = JSON.parse(json);
	
	var trans = $tr.find('.trans').val();
	
	data.trans = trans;

	atlasDb.updateDocument({
		data: data
		,onSuccess: refreshView
	});
};

function showRequests(arr) {
	
	var $table = $('<table class="translations"></table>');
	$('#'+requestPanelName).empty().append($table);
	
	$('<tr></tr>')
		.append('<th>String</th>')
		.append('<th>Lang</th>')
		.append('<th>Translation</th>')
		.append('<th></th>')
		.append('<th>Doc ID</th>')
		.append('<th>Package</th>')
		.append('<th>User</th>')
		.append('<th>Time</th>')
		//.append('<th></th>')
		.appendTo($table);
	
	for(var i=0,e=arr.length; i<e; ++i) {
		var $tr = $('<tr></tr>');
		$table.append($tr);
		
		var row = arr[i];
		var req = row.doc;
		
		$tr.append( $('<td>'+req.str+'</td>') );
		$tr.append( $('<td>'+req.lang+'</td>') );
		$tr.append( $('<td><input class="trans" type="text"/></td>') );
		$tr.append( $('<td><input class="uploadBtn" type="button" value="Upload"/></td>') );
		$tr.append( $('<td class="docId">'+req._id+'</td>') );
		$tr.append( $('<td class="packageName">'+req.packageName+'</td>') );
		
		if( req.nunaliit_created && req.nunaliit_created.name ){
			// Insert name
			$('<td></td>')
				.text(req.nunaliit_created.name)
				.appendTo($tr);
		} else {
			$tr.append('<td></td>');
		};
		
		if( req.nunaliit_created && req.nunaliit_created.time ){
			// Insert time
			var time = new Date(1 * req.nunaliit_created.time);
			//var timeStr = time.toString();
			var timeStr = $n2.utils.formatDate(time,'%Y-%m-%d %H:%M:%S');
			$('<td></td>')
				.text(timeStr)
				.appendTo($tr);
		} else {
			$tr.append('<td></td>');
		};
		
//		var langStrInfo = $n2.l10n.getStringForLang(req.str,req.lang);
//		if( langStrInfo.str ){
//			$('<td></td>')
//				.text(langStrInfo.str)
//				.appendTo($tr);
//		} else {
//			$tr.append('<td></td>');
//		};
		
		
		$tr.append( $('<td><input class="json" type="hidden"/></td>') );
		
		
		
		var json = JSON.stringify(req);
		$tr.find('.json').val(json);
		
		if( req.trans ) {
			$tr.find('.trans').val(req.trans);
		};
	};
	
	$table.find('.uploadBtn').click(upload);
};

function displayTranslated() {
	
	$('#'+requestPanelName)
		.empty()
		.append( $('<div class="translationLangSelect"></div>') )
		.append( $('<div class="translationResult"></div>') )
		;
	
	// Fetch all pending requests
	atlasDesign.queryView({
		viewName: 'l10n-translated'
		,reduce: true
		,group: true
		,onSuccess: function(rows){
			var $select = $('<select></select>');
			for(var i=0,e=rows.length;i<e;++i){
				var r = rows[i];
				var $opt = $('<option></option>');
				$opt.text(r.key);
				$opt.attr('value',r.key);
				$select.append( $opt );
			};
			
			$('#'+requestPanelName).find('.translationLangSelect')
				.empty()
				.append($select)
				;
			$select.change(languageChanged);
			
			languageChanged();
		}
	});
	
	function languageChanged(){
		var $select = $('#'+requestPanelName).find('.translationLangSelect').find('select');
		var lang = $select.val();
		
		atlasDesign.queryView({
			viewName: 'l10n-translated'
			,include_docs: true
			,reduce: false
			,startkey: lang
			,endkey: lang
			,onSuccess: function(rows){
				var translations = {};
				for(var i=0,e=rows.length;i<e;++i){
					var r = rows[i];
					var original = r.doc.str;
					var trans = r.doc.trans;
					translations[original] = trans;
				};
				
				showTranslations(lang,translations);
			}
		});
	};
	
	function showTranslations(lang,translations){
		var $div = $('#'+requestPanelName).find('.translationResult');
		$div.empty();
		
		var $pre = $('<pre></pre>');
		$div.append($pre);
		
		var content = [];

		content.push(';(function($n2){\n\n');

		content.push('if( !$n2.l10n ) $n2.l10n = {};\n');
		content.push('if( !$n2.l10n.strings ) $n2.l10n.strings = {};\n');	
		content.push('if( !$n2.l10n.strings["'+lang+'"] ) $n2.l10n.strings["'+lang+'"] = {};\n\n');

		content.push('function loadStrings(strings) {\n');
		content.push('\tvar dic = $n2.l10n.strings["'+lang+'"];\n');
		content.push('\tfor(var key in strings) {\n');
		content.push('\t\tdic[key] = strings[key];\n');
		content.push('\t};\n');
		content.push('};\n\n');

		content.push('loadStrings({\n');
		
		var first = true;
		for(var original in translations){
			var trans = translations[original];
			if( first ){
				first = false;
			} else {
				content.push(',');
			};
			content.push( JSON.stringify(original) );
			content.push(':');
			content.push( JSON.stringify(trans) );
			content.push('\n');
		};

		content.push('});\n');
		content.push('})(nunaliit2);\n');
		
		$pre.text( content.join('') );
		
		$('<div></div>')
			.text('To include the above translations in the release, create a javascript '
				+ 'file with the content above and include in page.')
			.appendTo($div)
			;
	};
};

function refreshView() {
	if( 'translated' === currentView ){
		displayTranslated();
	} else {
		// Fetch all pending requests
		atlasDesign.queryView({
			viewName: currentView
			,reduce: false
			,include_docs: true
			,onSuccess: showRequests
		});
	};
};

function main() {
	var $select = $('<select></select>');
	$select.append( $('<option value="l10n-pending" selected="selected">Pending</option>') );
	$select.append( $('<option value="l10n-all">All</option>') );
	$select.append( $('<option value="translated">Translated</option>') );
	$('#'+requestPanelName).before($select);
	$select.change(selectionChanged);
	
	refreshView();
};

function main_init(opts_) {
	var opts = $n2.extend({
		config: null
		,requestPanelName: null
		,loginPanelName: null
	},opts_);
	
	var config = opts.config;
	
	atlasDb = config.atlasDb;
	atlasDesign = config.atlasDesign;
	
	requestPanelName = opts.requestPanelName;

 	$n2.couchL10n.Configure({
		db: atlasDb
 		,designDoc: atlasDesign 
 	});

 	if( config.directory && config.directory.authService ) {
		config.directory.authService.createAuthWidget({
			elemId: opts.loginPanelName
		});
	};
 	
 	main(atlasDb, atlasDesign);
};

$n2.translation = {
	main_init: main_init
};
	
})(jQuery,nunaliit2);
