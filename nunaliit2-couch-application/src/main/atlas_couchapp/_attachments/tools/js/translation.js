;(function($,$n2){
"use strict";

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };

//var DH = 'translation.js';	

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

	if( $('.translationButtonLine .translationLangSelect').length ){
		$('.translationButtonLine .translationLangSelect').remove();
	}
	
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
	
		var $btnTd = $('<td>');

		$tr.append( $('<td>'+req.str+'</td>') );
		$tr.append( $('<td>'+req.lang+'</td>') );
		$tr.append( $('<td><input class="trans" type="text"/></td>') );
		$tr.append($btnTd);
		$tr.append( $('<td class="docId">'+req._id+'</td>') );
		$tr.append( $('<td class="packageName">'+req.packageName+'</td>') );
		
		new $n2.mdc.MDCButton({
			parentId: $n2.utils.getElementIdentifier($btnTd),
			mdcClasses: ['uploadBtn'],
			btnLabel: 'Upload',
			onBtnClick: upload
		});

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
};

function displayTranslated() {

	$('#'+requestPanelName)
		.empty()
		.append( $('<div class="translationResult mdc-card"></div>') );
		
	$('<div>')
		.addClass('translationLangSelect mdc-select mdc-select--outlined n2s_attachMDCSelect')
		.appendTo($('.translationButtonLine'));
	
	var $langMenuIcon = $('<i>')
		.addClass('mdc-select__dropdown-icon');

	var $langMenuNotchedOutline = $('<div>')
		.addClass('mdc-notched-outline');

	$('<div>')
		.addClass('mdc-notched-outline__leading')
		.appendTo($langMenuNotchedOutline);

	var $langMenuNotchedOutlineNotch = $('<div>')
		.addClass('mdc-notched-outline__notch')
		.appendTo($langMenuNotchedOutline);

	$('<label>')
		.addClass('mdc-floating-label')
		.text(_loc('Language'))
		.appendTo($langMenuNotchedOutlineNotch);

	$('<div>')
		.addClass('mdc-notched-outline__trailing')
		.appendTo($langMenuNotchedOutline);
	
	// Fetch all pending requests
	atlasDesign.queryView({
		viewName: 'l10n-translated'
		,reduce: true
		,group: true
		,onSuccess: function(rows){

			var $langMenu = $('<select>')
				.addClass('mdc-select__native-control');

			for(var i=0,e=rows.length;i<e;++i){
				var r = rows[i];
				var $opt = $('<option></option>');
				$opt.text(r.key);
				$opt.attr('value',r.key);
				$langMenu.append( $opt );
			};
			
			$('.translationButtonLine').find('.translationLangSelect')
				.empty()
				.append($langMenuIcon)
				.append($langMenu)
				.append($langMenuNotchedOutline);

			$langMenu.change(languageChanged);

			languageChanged();
		}
	});
	
	function languageChanged(){
		var $select = $('.translationButtonLine').find('.translationLangSelect').find('select');
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

		$('<div>')
			.text('Create the file "htdocs/nunaliit_lang.'+lang+'.js" with the following content:')
			.appendTo($div)
			;
		
		var $pre = $('<pre></pre>');
		$div.append($pre);
		
		var content = [];

		content.push(';(function($n2){\n\n');

		content.push('$n2.l10n.addLocalizedStrings("'+lang+'",{\n');
		
		// Sort keys
		var originals = [];
		for(var original in translations){
			originals.push(original);
		};
		originals.sort();
		
		var first = true;
		for(var i=0,e=originals.length; i<e; ++i){
			var original = originals[i];
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
	var $buttonLine = $('<div>')
		.addClass('translationButtonLine');

	$('#'+requestPanelName).before($buttonLine);

	var $status = $('<div>')
		.addClass('mdc-select mdc-select--outlined n2s_attachMDCSelect')
		.appendTo($buttonLine);

	$('<i>')
		.addClass('mdc-select__dropdown-icon')
		.appendTo($status);

	var $statusMenu = $('<select>')
		.addClass('mdc-select__native-control')
		.appendTo($status)
		.change(selectionChanged);

	$('<option>')
		.attr('value','l10n-pending')
		.attr('selected','selected')
		.text(_loc('Pending'))
		.appendTo($statusMenu);

	$('<option>')
		.attr('value','l10n-all')
		.text(_loc('All'))
		.appendTo($statusMenu);

	$('<option>')
		.attr('value','translated')
		.text(_loc('Translated'))
		.appendTo($statusMenu);

	var $statusMenuNotchedOutline = $('<div>')
		.addClass('mdc-notched-outline')
		.appendTo($status);

	$('<div>')
		.addClass('mdc-notched-outline__leading')
		.appendTo($statusMenuNotchedOutline);

	var $statusMenuNotchedOutlineNotch = $('<div>')
		.addClass('mdc-notched-outline__notch')
		.appendTo($statusMenuNotchedOutline);

	$('<label>')
		.addClass('mdc-floating-label')
		.text(_loc('Status'))
		.appendTo($statusMenuNotchedOutlineNotch);

	$('<div>')
		.addClass('mdc-notched-outline__trailing')
		.appendTo($statusMenuNotchedOutline);
	
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

 	if( config.directory && config.directory.authService ) {
		config.directory.authService.createAuthWidget({
			elemId: opts.loginPanelName
		});
	};
 	
 	main(atlasDb, atlasDesign);
};

function addHamburgerMenu(){
	//Tools Drawer
	var drawer = new $n2.mdc.MDCDrawer({
		hamburgerDrawer: true,
		navHeaderTitle: 'Nunaliit Tools',
		navItems: [
			{"text": "User Management", "href": "./users.html"},
			{"text": "Approval for Uploaded Files", "href": "./upload.html"},
			{"text": "Data Browser", "href": "./browse.html"},
			{"text": "Localization", "href": "./translation.html", "activated": true},
			{"text": "Data Export", "href": "./export.html"},
			{"text": "Data Modification", "href": "./select.html"},
			{"text": "Schemas", "href": "./schemas.html"},
			{"text": "Restore Tool", "href": "./restore.html"},
			{"text": "Submission Tool", "href": "./submission.html"},
			{"text": "Import Tool", "href": "./import.html"},
			{"text": "Debug Tool", "href": "./debug.html"},
			{"text": "Schema Editor", "href": "./schema_editor.html"}
		]	
	});

	// Top-App-Bar
	var topAppBar = new $n2.mdc.MDCTopAppBar({
		barTitle: 'Translations'
	});
};

$n2.translation = {
	main_init: main_init,
	addHamburgerMenu: addHamburgerMenu
};
	
})(jQuery,nunaliit2);
