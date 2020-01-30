;(function ($, $n2) {
    "use strict";

    // Localization
    var _loc = function (str, args) {
        return $n2.loc(str, 'nunaliit2-couch', args);
    };

    var DH = 'metadata.js';
    var HASH_NEW_PREFIX = "new_";

    var defaultMetadata = JSON.parse('{\n' +
        '        "license": "",\n' +
        '        "creator": {\n' +
        '          "contactPoint": {\n' +
        '            "@type": "ContactPoint",\n' +
        '            "contactType": "",\n' +
        '            "telephone": "",\n' +
        '            "email": ""\n' +
        '          },\n' +
        '          "@type": "Organization",\n' +
        '          "name": "",\n' +
        '          "url": ""\n' +
        '        },\n' +
        '        "dateCreated": "",\n' +
        '        "keywords": [],\n' +
        '        "temporalCoverage": "",\n' +
        '        "@type": "Dataset",\n' +
        '        "name": "",\n' +
        '        "description": "",\n' +
        '        "spatialCoverage": {\n' +
        '          "geo": {\n' +
        '            "@type": "GeoShape",\n' +
        '            "box": ""\n' +
        '          },\n' +
        '          "@type": "Place"\n' +
        '        },\n' +
        '        "@context": {\n' +
        '          "@vocab": "http://schema.org"\n' +
        '        },\n' +
        '        "url": ""\n' +
        '      }');

    var config = null;
    var authService = null;
    var dispatcher = null;
    var atlasDb = null;
    var atlasDesign = null;
    var schemaRepository = null;
    var showService = null;
    var couchEditor = null;
    var $metadataAppDiv = null;

    function getDocumentDiv() {
        var $docDiv = $('#metadataAppDocument');
        if ($docDiv.length < 1) {
            $docDiv = $('<div id="#metadataAppDocument"></div>');
            $metadataAppDiv.append($docDiv);
        }
        return $docDiv;
    }

    function viewDocument(docId) {
        var $div = getDocumentDiv();
        $div.html('<h1>' + docId + '</h1><div class="olkit_wait"></div>');

        atlasDb.getDocument({
            docId: docId,
            skipCache: true,
            revs_info: false,
            onSuccess: function (doc) {
                $div.empty();

                var $h = $('<h1></h1>');
                $div.append($h);
                $h.text(docId);

                var $tree = $('<div></div>');
                $div.append($tree);

                new $n2.tree.ObjectTree($tree, doc);

                var $buttons = $('<div></div>');
                $div.append($buttons);

                var $edit = $('<button></button>');
                $edit.text(_loc('Edit'));
                $buttons.append($edit);
                $edit.click(function () {
                    editDocument(doc);
                    return false;
                });
            },
            onError: function (err) {
                reportError(err);
                console.log("Error viewing doc: " + err)
            }
        });
    } // viewDocument

    function editDocument(doc) {
        var editDoc = $n2.document.clone(doc);
        var $div = getDocumentDiv();
        $div.empty();

        var $header = $('<h1></h1>');
        $div.append($header);
        $header.text(editDoc._id);

        var editDivId = $n2.getUniqueId();
        var $editDiv = $('<div id="' + editDivId + '"></div>');
        $div.append($editDiv);

        couchEditor.showDocumentForm(doc, {
            panelName: editDivId,
            onCancelFn: function () {
                viewDocument(doc._id);
            }
        });

    } // editDocument

    function startRequestWait() {
        getDocumentDiv().html('<div class="olkit_wait"></div>');
    }

    function reportErrorsOnElem(errors, $elem) {
        $elem.append($('<div>Error occurred during the request<div>'));

        for (var i = 0; i < errors.length; i++) {
            var e = errors[i];
            if (typeof (e) === 'object') {
                e = JSON.stringify(e);
            }
            if (typeof (e) === 'string') {
                $elem.append($('<div>' + e + '<div>'));
            }
        }
    }

    function reportError() {
        $('.olkit_wait').remove();

        getDocumentDiv().empty();
        reportErrorsOnElem(arguments, getDocumentDiv());
    }

    function initiateEdit(docId) {
        // Get document
        startRequestWait();
        atlasDb.getDocument({
            docId: docId,
            onSuccess: function (doc) {
                var schemaName = doc.nunaliit_schema;
                if (!schemaName) {
                    showEdit(doc);
                } else {
                    schemaRepository.getSchema({
                        name: schemaName
                        , onSuccess: function (schema) {
                            showEdit(doc, schema);
                        }
                        , onError: function () {
                            showEdit(doc);
                        }
                    });
                }
            },
            onError: reportError
        });

        function showEdit(doc, schema) {
            var $div = getDocumentDiv();
            $div.empty();

            // Add metadata data if it doesn't already exist.
        
            if (doc.hasOwnProperty("nunaliit_module") && !doc.nunaliit_module.hasOwnProperty("nunaliit_metadata")) {
                doc.nunaliit_module.nunaliit_metadata = defaultMetadata;
            }
            else if (doc.hasOwnProperty("nunaliit_atlas") && !doc.nunaliit_atlas.hasOwnProperty("nunaliit_metadata")) {
                doc.nunaliit_atlas.nunaliit_metadata = defaultMetadata;
            }

            couchEditor.cancelDocumentForm({suppressEvents: true});

            // Couch Editor
            var couchEditorId = $n2.getUniqueId();
            var $couchEditorDiv = $('<div id="' + couchEditorId + '"></div>');
            $div.append($couchEditorDiv);
            couchEditor.showDocumentForm(doc, {
                panelName: couchEditorId,
                schema: schema,
                onCloseFn: function (doc_, editor, closeOptions) {
                    if (closeOptions.inserted) {
                        initiateEdit(doc._id);
                    } else if (closeOptions.updated) {
                        initiateEdit(doc._id);
                    }
                }
            });

            // References from other objects
            $div.append($('<h3>Documents referencing this module</h3>'));
            $div.append($('<div id="referencesToThis"><div class="olkit_wait"></div></div>'));
            atlasDesign.queryView({
                viewName: 'link-references',
                startkey: doc._id,
                endkey: doc._id,
                onSuccess: function (rows) {
                    var $table = $('<table></table>');
                    $('#referencesToThis').empty().append($table);
                    for (var i = 0, e = rows.length; i < e; ++i) {
                        var docId = rows[i].id;
                        var $tr = $('<tr></tr>');

                        $table.append($tr);

                        var $td = $('<td class="docId"></td>');
                        $tr.append($td);

                        var $a = $('<a href="#' + docId + '" id="' + docId + '">' + docId + '</a>');
                        $td.append($a);
                        $a.click(function () {
                            var $a = $(this);
                            var docId = $a.attr('alt');
                            initiateEdit(docId);
                            return true;
                        });
                        showService.printBriefDescription($a, docId);
                    }
                },
                onError: reportError
            });

            // Attachments
            if (doc._attachments) {
                $div.append($('<h3>Attachments</h3>'));
                var $table = $('<table></table>');
                $div.append($table);
                for (var key in doc._attachments) {
                    var att = doc._attachments[key];
                    var $tr = $('<tr></tr>');

                    $table.append($tr);

                    var $td = $('<td class="attachment"></td>');
                    $tr.append($td);

                    var attUrl = atlasDb.getDocumentUrl(doc);
                    attUrl = attUrl + '/' + key;
                    var $a = $('<a href="' + attUrl + '">' + key + '</a>');
                    $td.append($a);

                    var type = '';
                    if (att.content_type) {
                        type = att.content_type;
                    }

                    $td = $('<td class="type">' + type + '</td>');
                    $tr.append($td);

                    var size = '';
                    if (att.length) {
                        size = att.length;
                    }

                    $td = $('<td class="type">' + size + '</td>');
                    $tr.append($td);
                }
            }

            var $errors = $('<div id="editErrors"></div>');
            $div.append($errors);
        }
    } // initiateEdit

    function refreshModuleList() {
        // startRequestWait();
        var $moduleSelect = $("#moduleSelect");
        $moduleSelect.empty();
        $moduleSelect.change(function () {
            var $sel = $(this);
            moduleSelectChanged($sel);
            return true;
        });

        var metadataDesignDoc = atlasDb.getDesignDoc({ddName: 'atlas'});
        metadataDesignDoc.queryView({
            viewName: 'modules',
            include_docs: false,
            onSuccess: function (rows) {
                for (var i = 0; i < rows.length; i++) {
                    // id is the module doc Id
                    var docId = rows[i].id;

                    var $opt = $('<option>')
                        .text(docId)
                        .val(docId);
                    $moduleSelect.append($opt);
                    showService.printBriefDescription($opt, docId);
                }
            }
        });

        moduleSelectChanged($moduleSelect);
    } // refreshModuleList

    function moduleSelectChanged($select) {
        var moduleDocId = $select.val();
        console.log("SELECTED: " + moduleDocId);
        console.log("nunaliit-document: " + $('option:checked', $select).attr('nunaliit-document'));

        if (moduleDocId !== undefined && moduleDocId !== '') {
            dispatcher.send(DH, {
                type: 'userSelect',
                docId: moduleDocId
            });
        } else {
            reportError('Module document Id is undefined');
        }
    } // moduleSelectChanged

    function display() {
        $('#metadataEditorTitle').text(_loc('Metadata Editor'));

        var $selectDiv = $('<div id="metadataAppSelection" class="metadataForm"></div>')
            .append($('<input type="radio" name="metadataType" value="atlas" id="atlasRadio" class="metadataForm"/>'))
            .append($('<label for="atlasRadio" class="metadataForm">' + _loc('Atlas') + '</label>'))
            .append($('<input type="radio" name="metadataType" value="module" id="moduleRadio" class="metadataForm"/>'))
            .append($('<label for="moduleRadio" class="metadataForm">' + _loc('Module') + '</label>'))
            .append($('<select id="moduleSelect" class="metadataForm"/>'));

        $metadataAppDiv
            .empty()
            .append($selectDiv)
            .append($('<div id="metadataAppDocument" class="metadataForm"></div>'));

        // Only enable module drop down when module radio is selected.
        $('#moduleRadio').click(function () {
            $('#moduleSelect').attr("disabled", false);
            getDocumentDiv().empty();
            moduleSelectChanged($('#moduleSelect'));
        });
        $('#atlasRadio').click(function () {
            $('#moduleSelect').attr("disabled", true);
            getDocumentDiv().empty();
            showAtlasMetadata();
        });

        refreshModuleList();

        // Select atlas by default.
        $('#atlasRadio').click();
    }

    function showAtlasMetadata() {
        startRequestWait();

        var atlasDesignDoc = atlasDb.getDesignDoc({ddName: 'atlas'});
        atlasDesignDoc.queryView({
            viewName: 'atlas',
            include_docs: false,
            onSuccess: function (rows) {
                // Should only be one atlas document.
                if (rows.length >= 1) {
                    var docId = rows[0].id;
                    console.log("SARAH: atlas doc found: " + docId);

                    dispatcher.send(DH, {
                        type: 'userSelect',
                        docId: docId
                    });
                } else {
                    console.log("SARAH: atlas document not found");
                }
            }
        });
    } // showAtlasMetadata

    function handleDispatch(msg) {
        if (msg.type === 'selected') {
            initiateEdit(msg.docId);
        }
    }

    function main(opts_) {
        $n2.log('Options', opts_);
        config = opts_.config;
        atlasDb = config.atlasDb;
        atlasDesign = config.atlasDesign;
        couchEditor = config.couchEditor;
        authService = config.directory.authService;
        showService = config.directory.showService;
        schemaRepository = config.directory.schemaRepository;
        dispatcher = config.directory.dispatchService;

        dispatcher.register(DH, 'selected', handleDispatch);

        $metadataAppDiv = opts_.div;

        display();
    }

    $n2.metadataEditorApp = {
        main: main
    };
})(jQuery, nunaliit2);