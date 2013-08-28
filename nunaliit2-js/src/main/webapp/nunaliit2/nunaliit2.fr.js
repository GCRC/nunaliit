/*
  Nunaliit2 French Language Pack
*/
;(function($,$n2){

if( !$n2.l10n ) $n2.l10n = {};
if( !$n2.l10n.strings ) $n2.l10n.strings = {};	
if( !$n2.l10n.strings['fr'] ) $n2.l10n.strings['fr'] = {};

function loadStrings(strings) {
	var dic = $n2.l10n.strings['fr'];
	for(var key in strings) {
		dic[key] = strings[key];
	};
};

loadStrings({
	// Language: fr
	" definition (":" définition ("
	," definition (index: ":" définition (indice: "
	," definition null and skipped.":" définition nulle et ignorée"
	," definition: ":" définition"
	,"(by {author})":"(par {author})"
	,"<Unknown error>":"<Erreur inconnue>"
	,"A database must be provided":"Une base de données doit être spécifiée"
	,"A document identifier must be provided":"Un identificateur de document doit être spécifié"
	,"A filter function must be supplied":"Un filtre doit être donné"
	,"A list must be provided for refining":"Durant une spécialisation, une liste doit être donnée"
	,"A list name must be supplied":"Un nom de liste doit être donné"
	,"A name must be provided when refining a list":"Durant une spécialisation, un nom doit être donné"
	,"A valid schema must be provided":"Un schème valide doit être donné"
	,"Add":"Ajouter"
	,"Add Contribution":"Ajouter un contribution"
	,"Add File":"Ajouter un fichier"
	,"Add Layer":"Ajouter Couche"
	,"Add Related Item":"Relier"
	,"Add Relation":"Relier"
	,"Add a line to the map":"Ajouter une ligne à la carte"
	,"Add a point to the map":"Ajouter un point à la carte"
	,"Add a polygon to the map":"Ajouter un polygone à la carte"
	,"Add or Edit a Map Feature":"Modifier la Carte"
	,"All Documents":"Tous les documents"
	,"All LineString Geometries":"Toutes les géométries de lignes"
	,"All Point Geometries":"Toutes les géométries de points"
	,"All Polygon Geometries":"Toutes les géométries de polygones"
	,"All documents containing {searchTerm}":"Tous les documents contenant {searchTerm}"
	,"All documents filtered by script":"Tous les documents filtré par un programme"
	,"Attach":"Joindre"
	,"Attachment":"Pièce jointe"
	,"Attachment has been denied":"La pièce jointe fut rejetée"
	,"Attachment is being processed":"Travail en cours sur la pièce jointe"
	,"Attachment is waiting for approval":"Pièce jointe en attente de l'approbation"
	,"Attachment: ":"Pièce jointe: "
	,"Authentication service must be configured":"Le service d'identité doit être configuré"
	,"Author":"Auteur"
	,"Back":"Retour"
	,"Base Layer":"Couche de Fond"
	,"Brief":"Brève Affichage"
	,"CSS":"CSS"
	,"Can not perform file uploads unless jquery.form.js is included":"jquery.form.js est nécessaire pour le téléchargement de fichier"
	,"Cancel":"Annuler"
	,"Cancel Feature Editing":"Annuler les modifications"
	,"Cancelling Operation...":"Annuler l'opération..."
	,"Change Password":"Changer Mot de Passe"
	,"Clear":"Vider"
	,"Confirm":"Confirmer"
	,"Confirm password:":"Vérifier mot de passe"
	,"Contribution":"Contribution"
	,"Create User":"Création d'usager"
	,"Create a new user":"Créer un nouvel usager"
	,"Created by":"Créer par"
	,"Data Modification Application":"Application de modification des données"
	,"Date":"Date"
	,"Default":"Défaut"
	,"Delete":"Supprimer"
	,"Deletion Progress":"Progrès de suppression"
	,"Demo Document":"Document de Démonstration"
	,"Demo Media":"Média de Démonstration"
	,"Description":"Description"
	,"Display":"Affichage"
	,"Do you really want to delete this feature?":"Voulez-vous vraiment supprimer cette géométrie?"
	,"Do you really wish to delete the {count} document(s) referenced by this list?":"Désirez-vous supprimer les {count} document(s) contenu dans cette liste?"
	,"Do you wish to delete this element?":"Désirez-vous supprimer cet élément?"
	,"Do you wish to leave document editor?":"Désirez-vous quitter l'éditeur de document?"
	,"Doc ids must be supplied when creating a list from document ids":"Les identificateurs de documents doit être donnés durant la création de cette liste"
	,"Document was modified and changes will be lost. Do you wish to continue?":"Le document est modifié et les changements seront perdus. Voulez-vous continuer?"
	,"Documents from schema type {schemaName}":"Documents de type de schème {schemaName}"
	,"Done":"Complété"
	,"E-mail":"Couriel"
	,"Edit":"Modifier"
	,"Editor View":"Perspective d'Éditeur"
	,"Enter password:":"Entrez mot de passe"
	,"Error":"Erreur"
	,"Error creating ":"Erreur de création"
	,"Error during export":"Erreur pendant l'exportation"
	,"Error fetching attachment from help document":"Erreur durand l'obtention du document d'aide"
	,"Error occurred with progress service":"Erreur avec service de progrès"
	,"Error while uploading: ":"Erreur de téléchargement"
	,"Error: query error while verifying ":"Erreur: la vérification a échoué"
	//no longer in use: "Error: query error while verifying "
	,"Error: query error while verifying {label} definition ({key})":"Erreur: interrogation échouée lors de la vérification de la définition {label} ({key})"
	,"Errors in process: {count}.":"Nombre d'erreurs: {count}"
	,"Export":"Exporter"
	,"Export Geometries":"Exportation des géométries"
	,"Export service is not available":"Le service d'exportation n'est pas en ligne"
	,"Export service is not configured":"Le service d'exportation n'est pas configuré"
	,"Exporting":"Exportation en marche"
	,"Extent (Max X)":"Étendue (max x)"
	,"Extent (Max Y)":"Étendue (max y)"
	,"Extent (Min X)":"Étendue (min x)"
	,"Extent (Min Y)":"Étendue (min y)"
	,"Failure to delete {docId}":"Impossible de supprimer {docId}"
	,"Failure to fetch {docId}":"Impossible d'obtenir {docId}"
	,"Failure to save {docId}":"Impossible de sauvegarder {docId}"
	,"Fetching All Document Ids":"Obtention de tous les identificateurs de document"
	,"File":"Fichier"
	,"File Name":"Nom du fichier"
	,"File Uploaded":"Fichier téléchargé"
	,"File is not currently available":"Le ficher n'est pas disponible"
	,"Fill Out Related Document":"Entrer l'information"
	,"Find on Map":"Trouver sur la Carte"
	,"First Name":"Prénom"
	,"Form":"Formulaire"
	,"Form View":"Perspective Formulaire"
	,"From":"De"
	,"Function is required on transformation":"Une fonction est nécessaire durant les transformations"
	,"Geometries from layer {layerName}":"Les géométries de la couche {layerName}"
	,"Geometry":"Géometrie"
	,"Guest Login":"Session pour visiteur"
	,"Help":"Aide"
	,"Hover Sound":"Son descriptif"
	,"Hover Sound?":"Son descriptif?"
	,"ID":"ID"
	,"In reply to":"En réplique à"
	,"Introduction":"Introduction"
	,"Invalid attachment in help document":"Problème avec le document d'aide"
	,"Invalid content in help document":"Problème avec le contenu du document d'aide"
	,"Invalid e-mail and/or password":"Problème avec votre nom d'usager ou votre mot de passe"
	,"Invalid help document content":"Problème avec le contenu du document d'aide"
	,"Javascript":"Javascript"
	,"Javascript Replace":"Remplacer par Javascript"
	,"Key already in use: ":"Clé déjà utilisée: "
	,"Label":"Intitulé"
	,"Language":"Langue"
	,"Last Name":"Dernier Nom"
	,"Last updated by":"Mis-à jour par"
	,"Layer":"Couche"
	,"Layer Definition":"Définition de Couche"
	,"Layer Selector":"Sélecteur de couches"
	,"Layer name":"Nom de couche"
	,"Layers":"Couches"
	,"Less":"Moins"
	,"List Creation Progress":"Progrès de la création de liste"
	,"List Refinement Progress":"Progrès du refinement de liste"
	,"List is required on transformation":"Une liste est nécessaire durant les transformations"
	,"Login":"Ouvrir session"
	,"Logout":"Fermer session"
	,"Logs":"Journal"
	,"Made with Nunaliit":"Construit avec Nunaliit"
	,"Media":"Média"
	,"Module":"Module"
	,"More":"Plus"
	,"More Info":"Détails"
	,"Must enter a layer name":"Nom de couche manquant"
	,"Must enter a schema name":"Nom de schème manquant"
	,"Name":"Nom"
	,"Name of new list":"Nom de la nouvelle liste"
	,"No Document":"Aucun document"
	,"No document modified.":"Aucun document modifié."
	,"No list Selected":"Aucune liste sélectionée"
	,"No media found on {docId}":"Aucun média trouvé avec {docId}"
	,"Nunaliit Atlas":"Atlas Nunaliit"
	,"OK":"Accepter"
	,"Operation cancelled by user":"Opération annulée par l'usager"
	,"Order":"Ordre"
	,"Original String":"Chaîne de caractères originale"
	,"Overlays":"Calques"
	,"Password":"Mot de Passe"
	,"Password is too short":"Mot de passe est trop court"
	,"Password should have at least 6 characters":"Le mot de passe devrait contenir au moins 6 caractères"
	,"Passwords do not match":"Mots de passe sont différents"
	,"Please login":"Ouverture de session"
	,"Problem obtaining documents from layer":"Problème détecté pendant l'obtention des documents d'une couche"
	,"Problem obtaining documents from schema":"Problème détecté pendant l'obtention des documents d'un type de schème"
	,"Proceed":"Procéder"
	,"Process completed.":"Processus complété."
	,"Progress":"Progrès"
	,"Queries":"Interrogations"
	,"Re-Submit Media":"Resoumettre les média"
	,"Reference":"Référence"
	,"Reference:":"Référence:"
	,"Refine List":"Spécialiser la liste"
	,"Relation: ":"Relation"
	,"Remove":"Supprimer"
	,"Replace Text":"Texte de remplacement"
	,"Required fields missing for ":"Champs nécessaires manquants pour "
	,"Reset":"Redémarrer"
	,"Revision":"Version"
	,"Roles":"Roles"
	,"Root Schema":"Schème de Base"
	,"STOPPING: Failed verifying view ":"ARRET. Impossible de vérifier la perspective. "
	,"Save":"Sauvegarder"
	,"Schema":"Schème"
	,"Scroll Map":"Faire défiler la carte"
	,"Search":"Rechercher"
	,"Search error:":"Erreur durant la recherche"
	,"Search results empty":"Recherche sans résultats"
	,"Search term":"Terme recherché"
	,"Search:":"Rechercher:"
	,"Select Document":"Choisir Document"
	,"Select Document Schema":"Choisir un schème de document"
	,"Select Document Transform":"Choisir une transformation de document"
	,"Select Language":"Choisir une Langue"
	,"Select Layers":"Choisir couches"
	,"Select Roles":"Choisir les Roles"
	,"Select Search Filter":"Choisir un filtre de recherche"
	,"Select a media":"Choisir un média"
	,"Select a schema":"Choisir un schème"
	,"Select a schema:":"Choisir un schème:"
	,"Select application started":"L'application de sélection a débuté"
	,"Select documents from a schema type":"Choisir les documents d'un type de schème"
	,"Select from Javascript":"Choisir à partir de Javascript"
	,"Select geometries from a layer":"Choisir les géométries d'une couche"
	,"Select schema":"Choisir un schème"
	,"Set Password":"Changer Mot de Passe"
	,"Temporary View":"Perspective temporaire"
	,"Test Temporary View":"Tester une perspective temporaire"
	,"Text Replace":"Remplacer le texte"
	,"Text Search":"Rechercher un texte"
	,"The projection {srsName} is not supported. Atlas may no function properly.":"La projection {srsName} n'est pas disponible, L'atlas pourrait tomber en panne."
	,"The two passwords should match":"Les deux mots de passe devrait être pareils"
	,"This object is being modified. Do you wish to continue and revert current changes?":"L'objet en cours d'être modifié. Désirez-vous continuer?"
	,"Title":"Titre"
	,"To":"À"
	,"Transform":"Transformer"
	,"Transform Progress":"Progrès de la transformation"
	,"Transformations completed with some failures":"Transformations complétées. Erreurs détectées."
	,"Transformations completed. Successful: {ok} Failures: {fail} Skipped: {skipped}":"Transformations complétées. Accomplies: {ok} Erreurs: {fail} Ignorées: {skipped}"
	,"Translation":"Traduction"
	,"Tree View":"Perspective en Arbre"
	,"Type of refinement":"Type de spécialisation"
	,"Unable to access help document: {{docId}}":"Impossible d'accéder le document d'aide: {{docId}}"
	,"Unable to create a new list":"Impossible de créer une nouvelle liste"
	,"Unable to create user: ":"La création d'usager a échoué"
	,"Unable to delete user document: ":"Incapable de supprimer le document d'usager"
	,"Unable to display brief description":"Impossible d'afficher la brève description"
	,"Unable to display document":"Impossible d'afficher le document"
	,"Unable to fetch schema":"Impossible d'obtenir le schème"
	,"Unable to find document search filter":"Impossible de trouver le filtre de recherche"
	,"Unable to find document transform":"Impossible de trouver la transformation"
	,"Unable to find search filter":"Impossible de trouver le filtre de recherche"
	,"Unable to obtain document {docId}":"Impossible d'obtenir le document {docId}"
	,"Unable to obtain list of layers":"Impossible d'obtenir la liste des couches"
	,"Unable to obtain list of schemas":"Impossible d'obtenir la liste des schèmes"
	,"Unable to parse JSON string: ":"Incapable de lire l'expression JSON: "
	,"Unable to parse key: ":"Incapable de comprendre la clé: "
	,"Unable to retrieve document":"Impossible de trouver le document"
	,"Unable to retrieve documents":"Impossible de trouver les documents"
	,"Unable to save user document: ":"Incapable de sauvegarder le document d'usager"
	,"Unable to set password: ":"Impossible de changer le mot de passe"
	,"Unable to upload file. Related document was kept. Error: ":"Incapable de télécharger le fichier. Le document relié est sauvegardé. Erreur: "
	,"Uncategorized":"Sans catégorie"
	,"Unknown Filter":"Filtre inconnu"
	,"Unknown List":"Liste inconnue"
	,"Unknown Transform":"Transformation inconnue"
	,"Unsupported Browser":"Fureteur incompatible"
	,"Upload":"Télécharger"
	,"Upload service can not be reached. Unable to submit a related document.":"Le service de téléchargement n'est pas disponible."
	,"User":"Usager"
	,"User Creation":"Creation d'un Usager"
	,"User created but unable to log in: ":"Le nouvel usager fut créé, mais il est impossible d'ouvrir la session."
	,"User name should have at least 3 characters":"Le nom d'usager devrait avoir au moins 3 caractères"
	,"View":"Afficher"
	,"View Media":"Visualiser le Média"
	,"Welcome":"Bienvenue"
	,"You are about to delete this document. Do you want to proceed?":"Voulez-vous vraiment supprimer ce document?"
	,"You are about to leave this page. Do you wish to continue?":"Vous quittez cette page. Voulez-vous continuer?"
	,"You must enter a valid function":"Vous devez soumettre une fonction valide"
	,"You must leave the atlas to view this file.":"Vous devez quitter l'atlas pour accéder à ce fichier."
	,"Your browser is not supported by this web site.":"Votre fureteur est incompatible avec ce site"
	,"Your file was uploaded and will become available when it has been approved.":"Votre fichier est téléchargé. Il sera disponible lorsqu'un adminitrateur l'aura approuvé"
	,"Zoom In":"Rapprocher la carte"
	,"Zoom Out":"Eloigner la carte"
	,"a Checkbox":"une Boîte"
	,"a Number":"un Chiffre"
	,"a String":"une Chaîne de Caractères"
	,"an Array":"une Chaîne"
	,"an Object":"un Objet"
	,"an image":"une image"
	,"confirm password":"vérifier le mot de passe"
	,"display name":"nom d'affichage"
	,"empty":"vide"
	,"id":"id"
	,"is":"est"
	,"password":"mot de passe"
	,"search the atlas":"recherche de l'atlas"
	,"top":"en haut"
	,"user name":"Nom d'usager"
	,"{count} document(s)":"{count} document(s)"
	,"{count} document(s) modified.":"{count} document(s) modifiés."
	,"{docId} deleted":"{docId} supprimé"
	,"{docId} transformed and saved":"{docId} transformé et sauvegardé"
	,"{label} definition ({key}) already exists - not loaded or updated":"Définition {label} ({key}) existe déjà - ignorée"
});

if( $ && $.datepicker ) {
	var regional = {
		renderer: $.ui.datepicker.defaultRenderer
		,monthNames: [
			'Janvier'
			,'Février'
			,'Mars'
			,'Avril'
			,'Mai'
			,'Juin'
			,'Juillet'
			,'Août'
			,'Septembre'
			,'Octobre'
			,'Novembre'
			,'Décembre'
		]
		,monthNamesShort: [
			'Jan'
			,'Fév'
			,'Mar'
			,'Avr'
			,'Mai'
			,'Jun'
			,'Jul'
			,'Aoû'
			,'Sep'
			,'Oct'
			,'Nov'
			,'Déc'
		]
		,dayNames: [
			'Dimanche'
			,'Lundi'
			,'Mardi'
			,'Mercredi'
			,'Jeudi'
			,'Vendredi'
			,'Samedi'
		]
		,dayNamesShort: [
			'Dim'
			,'Lun'
			,'Mar'
			,'Mer'
			,'Jeu'
			,'Ven'
			,'Sam'
		]
		,dayNamesMin: [
			'Di'
			,'Lu'
			,'Ma'
			,'Me'
			,'Je'
			,'Ve'
			,'Sa'
		]
		,dateFormat: 'dd/mm/yyyy'
		,firstDay: 1
		,prevText: '&#x3c;Préc'
		,prevStatus: 'Voir le mois précédent'
		,prevJumpText: '&#x3c;&#x3c;'
		,prevJumpStatus: 'Voir l\'année précédent'
		,nextText: 'Suiv&#x3e;'
		,nextStatus: 'Voir le mois suivant'
		,nextJumpText: '&#x3e;&#x3e;'
		,nextJumpStatus: 'Voir l\'année suivante'
		,currentText: 'Courant'
		,currentStatus: 'Voir le mois courant'
		,todayText: 'Aujourd\'hui'
		,todayStatus: 'Voir aujourd\'hui'
		,clearText: 'Effacer'
		,clearStatus: 'Effacer la date sélectionnée'
		,closeText: 'Fermer'
		,closeStatus: 'Fermer sans modifier'
		,yearStatus: 'Voir une autre année'
		,monthStatus: 'Voir un autre mois'
		,weekText: 'Sm'
		,weekStatus: 'Semaine de l\'année'
		,dayStatus: '\'Choisir\' le DD d MM'
		,defaultStatus: 'Choisir la date'
		,isRTL: false
	};

	$.datepicker.setDefaults( regional );
};
	
})(jQuery,nunaliit2);