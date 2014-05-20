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
	,"A file must be selected":"Un fichier doit être sélectionné"
	,"A filter function must be supplied":"Un filtre doit être donné"
	,"A list must be provided for refining":"Durant une spécialisation, une liste doit être donnée"
	,"A list name must be supplied":"Un nom de liste doit être donné"
	,"A name must be provided when refining a list":"Durant une spécialisation, un nom doit être donné"
	,"A valid schema must be provided":"Un schème valide doit être donné"
	,"Accept":"Accepter"
	,"Accept User Agreement":"Accepter l'entente de l'utilisateur"
	,"Add":"Ajouter"
	,"Add Comment":"Ajouter un commentaire"
	,"Add File":"Ajouter un fichier"
	,"Add Layer":"Ajouter Couche"
	,"Add Related Item":"Relier"
	,"Add Relation":"Relier"
	,"Add User":"Ajouter un usager"
	,"Add a feature to the map based on a gazetteer service":"Ajouter une géométrie à partir d'un service de nomenclature."
	,"Add a line to the map":"Ajouter une ligne à la carte"
	,"Add a point to the map":"Ajouter un point à la carte"
	,"Add a polygon to the map":"Ajouter un polygone à la carte"
	,"Add or Edit a Map Feature":"Modifier la Carte"
	,"All":"Tout"
	,"All Documents":"Tous les documents"
	,"All LineString Geometries":"Toutes les géométries de lignes"
	,"All Point Geometries":"Toutes les géométries de points"
	,"All Polygon Geometries":"Toutes les géométries de polygones"
	,"All documents containing {searchTerm}":"Tous les documents contenant {searchTerm}"
	,"All documents filtered by script":"Tous les documents filtré par un programme"
	,"Approve":"Approuver"
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
	,"Commands for removal":"Instructions de suppression"
	,"Confirm":"Confirmer"
	,"Confirm password:":"Vérifier mot de passe"
	,"Content":"Contenue"
	,"Contribution":"Contribution"
	,"Create User":"Création d'usager"
	,"Create a new user":"Créer un nouvel usager"
	,"Create feature from name":"Créer une géométrie à partir d'un nom"
	,"Created by":"Créer par"
	,"Creating a user associated with the e-mail address: {address}":"Creation d'un usager associé avec l'adresse couriel: {address}"
	,"Data Modification Application":"Application de modification des données"
	,"Date":"Date"
	,"Default":"Défaut"
	,"Delete":"Supprimer"
	,"Delete document":"Supprimer le document"
	,"Deletion Progress":"Progrès de suppression"
	,"Demo Document":"Document de Démonstration"
	,"Demo Media":"Média de Démonstration"
	,"Deny":"Rejetter"
	,"Description":"Description"
	,"Display":"Affichage"
	,"Display Name":"Nom d'affichage"
	,"Do not show this warning again":"Supprimer cet avertissement"
	,"Do you really want to delete this feature?":"Voulez-vous vraiment supprimer cette géométrie?"
	,"Do you really wish to delete the {count} document(s) referenced by this list?":"Désirez-vous supprimer les {count} document(s) contenu dans cette liste?"
	,"Do you wish to delete this element?":"Désirez-vous supprimer cet élément?"
	,"Do you wish to leave document editor?":"Désirez-vous quitter l'éditeur de document?"
	,"Doc ids must be supplied when creating a list from document ids":"Les identificateurs de documents doit être donnés durant la création de cette liste"
	,"Document Id":"Identificateur de document"
	,"Document was modified and changes will be lost. Do you wish to continue?":"Le document est modifié et les changements seront perdus. Voulez-vous continuer?"
	,"Documents from schema type {schemaName}":"Documents de type de schème {schemaName}"
	,"Documents referencing {docId}":"Les documents en référence de {docId}"
	,"Documents with media files in analyzed state":"Documents avec des médias numériques en phase analysée"
	,"Documents with media files in approved state":"Documents avec des médias numériques en phase approuvée"
	,"Documents with media files in attached state":"Documents avec des médias numériques en phase jointe"
	,"Documents with media files in submitted state":"Documents avec des médias numériques en phase soumise"
	,"Documents with media files in waiting state":"Documents avec des médias numériques en phase d'attente"
	,"Done":"Complété"
	,"Done.":"Complété."
	,"E-Mail address must be specified":"Adresse couriel doit être spécifié"
	,"E-mail":"Couriel"
	,"E-mail Template":"Gabarit de message couriel"
	,"E-mail addresses":"Adresses couriel"
	,"E-mail me my password":"Envoyez-moi un couriel avec mon mot de passe"
	,"E-mails":"Couriels"
	,"Edit":"Modifier"
	,"Edit Proposed Document":"Modifier le document proposé"
	,"Edit User":"Modifier l'usager"
	,"Editor View":"Perspective d'Éditeur"
	,"Empty search results":"Résultats de recherche vide"
	,"Enabled":"Activé"
	,"Enter password:":"Entrez mot de passe"
	,"Enter reason for rejecting submission":"Donnez la raison pour la réjection"
	,"Error":"Erreur"
	,"Error attempting to accept user agreement":"Erreur durand le processus d'accepter l'entente de l'utilisateur"
	,"Error creating ":"Erreur de création"
	,"Error during export":"Erreur pendant l'exportation"
	,"Error fetching attachment from help document":"Erreur durand l'obtention du document d'aide"
	,"Error obtaining user document for {id}: {err}":"Erreur durand l'obtention du document {id}: {err}"
	,"Error occurred after document was saved. Error: {err}":"Erreur détectée après que le document fut sauvegardé: {err}"
	,"Error occurred after related document was created. Error: {err}":"Erreur détectée après que le document fut créé: {err}"
	,"Error occurred with progress service":"Erreur avec service de progrès"
	,"Error while uploading: ":"Erreur de téléchargement"
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
	,"Get a different password":"Obtenir un mot de passe différent"
	,"Graph application started":"Application graphique a démarré"
	,"Guest Login":"Session pour visiteur"
	,"Help":"Aide"
	,"Hover Sound":"Son descriptif"
	,"Hover Sound?":"Son descriptif?"
	,"I have forgotten my password":"J'ai oublié mon mot de passe"
	,"I want to choose my own password":"Je veux choisir mon propre mot de passe"
	,"ID":"ID"
	,"Identifier":"Identificateur"
	,"In reply to":"En réplique à"
	,"Introduction":"Introduction"
	,"Invalid attachment in help document":"Problème avec le document d'aide"
	,"Invalid content in help document":"Problème avec le contenu du document d'aide"
	,"Invalid e-mail and/or password":"Problème avec votre nom d'usager ou votre mot de passe"
	,"Invalid help document content":"Problème avec le contenu du document d'aide"
	,"Invalid result returned by GeoNames":"Problèmes avec les résultats obtenus de GeoNames"
	,"Invalid submission document":"Soumission invalide"
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
	,"Layer Selector Initially Opened":"Sélecteur de couches initialement ouvert"
	,"Layer Selector Suppressed":"Sélecteur de couches supprimé"
	,"Layer name":"Nom de couche"
	,"Layers":"Couches"
	,"Less":"Moins"
	,"List Creation Progress":"Progrès de la création de liste"
	,"List Refinement Progress":"Progrès du refinement de liste"
	,"List is required on transformation":"Une liste est nécessaire durant les transformations"
	,"Load Info From Database":"Charger l'information de la base de données"
	,"Load Listing of Media Directory":"Charger la liste des fichiers médiatiques"
	,"Loading document: ":"Chargement de document"
	,"Login":"Ouvrir session"
	,"Logout":"Fermer session"
	,"Logs":"Journal"
	,"Made with Nunaliit":"Construit avec Nunaliit"
	,"Media":"Média"
	,"Media Application":"Application médiatique"
	,"Media application started":"Application médiatique a débuté"
	,"Module":"Module"
	,"More":"Plus"
	,"More Details":"Plus de détails"
	,"More Info":"Détails"
	,"Must enter a document identifier":"Vous devez préciser un identificateur de document"
	,"Must enter a layer name":"Nom de couche manquant"
	,"Must enter a schema name":"Nom de schème manquant"
	,"My User":"Mon utilisateur"
	,"Name":"Nom"
	,"Name of new list":"Nom de la nouvelle liste"
	,"No Document":"Aucun document"
	,"No document modified.":"Aucun document modifié."
	,"No list Selected":"Aucune liste sélectionée"
	,"No media found on {docId}":"Aucun média trouvé avec {docId}"
	,"No submission available":"Aucune soumission disponible"
	,"Nunaliit Atlas":"Atlas Nunaliit"
	,"Nunaliit Graph":"Graphe Nunaliit"
	,"OK":"Accepter"
	,"Operation cancelled by user":"Opération annulée par l'usager"
	,"Order":"Ordre"
	,"Original Id":"Identificateur original"
	,"Original String":"Chaîne de caractères originale"
	,"Overlays":"Calques"
	,"Password":"Mot de Passe"
	,"Password Recovery Initiated":"Une récupération de mot de passe a débuté"
	,"Password is too short":"Mot de passe est trop court"
	,"Password recovery initiated. Check for an e-mail to complete password recovery":"Une récupération de mot de passe a débuté. Vérifiez vos couriels pour continuer le processus."
	,"Password should have at least 6 characters":"Le mot de passe devrait contenir au moins 6 caractères"
	,"Password was recovered successfully.":"Le mot de passe est récupéré"
	,"Passwords do not match":"Mots de passe sont différents"
	,"Perform Analysis":"Débuter l'analyze"
	,"Please login":"Ouverture de session"
	,"Problem obtaining documents from layer":"Problème détecté pendant l'obtention des documents d'une couche"
	,"Problem obtaining documents from schema":"Problème détecté pendant l'obtention des documents d'un type de schème"
	,"Problem obtaining documents with media files in analyzed state":"Problème détecté pendant l'obtention de fichiers médiatiques dans la phase analyzée"
	,"Problem obtaining documents with media files in approved state":"Problème détecté pendant l'obtention de fichiers médiatiques dans la phase approuvée"
	,"Problem obtaining documents with media files in attached state":"Problème détecté pendant l'obtention de fichiers médiatiques dans la phase jointe"
	,"Problem obtaining documents with media files in submitted state":"Problème détecté pendant l'obtention de fichiers médiatiques dans la phase soumise"
	,"Problem obtaining documents with media files in waiting state":"Problème détecté pendant l'obtention de fichiers médiatiques dans la phase d'attente"
	,"Proceed":"Procéder"
	,"Process completed.":"Processus complété."
	,"Progress":"Progrès"
	,"Queries":"Interrogations"
	,"Query Users":"Interrogation des usagers"
	,"Re-Submit Media":"Resoumettre les média"
	,"Recover Password":"Récupérer un mot de passe"
	,"Recovering password for a user associated with the e-mail address: {address}":"Récupération du mot de passe de l'utilisateur associé avec l'adresse couriel: {address}"
	,"Reference":"Référence"
	,"Reference:":"Référence:"
	,"Refine List":"Spécialiser la liste"
	,"Refresh":"Rafraîchir"
	,"Registration Initiated":"L'enregistrement a débuté"
	,"Reject":"Refuser"
	,"Relation: ":"Relation"
	,"Remind me later":"Rappelez-moi plus tard"
	,"Remove":"Supprimer"
	,"Replace Text":"Texte de remplacement"
	,"Reply":"Répondre"
	,"Required fields missing for ":"Champs nécessaires manquants pour "
	,"Reset":"Redémarrer"
	,"Reset Password":"Remise à zéro du mot de passe"
	,"Revision":"Version"
	,"Roles":"Roles"
	,"Root Schema":"Schème de Base"
	,"STOPPING: Failed verifying view ":"ARRET. Impossible de vérifier la perspective. "
	,"Save":"Sauvegarder"
	,"Schema":"Schème"
	,"Schema Display":"Affichage de schème"
	,"Scroll Map":"Faire défiler la carte"
	,"Search":"Rechercher"
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
	,"Select documents that reference another one":"Choisir les documents qui référencent un autre"
	,"Select documents with analyzed media files":"Choisir les documents contenant des fichiers médiatiques en phase d'analyze"
	,"Select documents with approved media files":"Choisir les documents contenant des fichiers médiatiques en phase approuvée"
	,"Select documents with attached media files":"Choisir les documents contenant des fichiers médiatiques en phase jointe"
	,"Select documents with submitted media files":"Choisir les documents contenant des fichiers médiatiques en phase soumise"
	,"Select documents with waiting media files":"Choisir les documents contenant des fichiers médiatiques en phase d'attente"
	,"Select from Javascript":"Choisir à partir de Javascript"
	,"Select geometries from a layer":"Choisir les géométries d'une couche"
	,"Select schema":"Choisir un schème"
	,"Send e-mail to submitter with reason for rejection":"Envoyer la raison de réjection par couriel"
	,"Send mail to {name}":"Envoyer un couriel à {name}"
	,"Set Password":"Changer Mot de Passe"
	,"Show my password":"Montrer mon mot de passe"
	,"Subject":"Sujet"
	,"Submision approved":"Soumission approuvée"
	,"Submision denied":"Soumission rejetée"
	,"Submission Id":"Identificateur de soumission"
	,"Submission State":"État de la soumission"
	,"Submission Type":"Type de soumission"
	,"Submissions to the database will not appear until they are approved":"Les soumissions à la base de données ne seront pas visibles avant l'approbation"
	,"Submitter":"Usage qui a suggéré la soumission"
	,"Temporary View":"Perspective temporaire"
	,"Test Temporary View":"Tester une perspective temporaire"
	,"Text Replace":"Remplacer le texte"
	,"Text Search":"Rechercher un texte"
	,"The information is expired.":"L'information est périmée"
	,"The projection {srsName} is not supported. Atlas may no function properly.":"La projection {srsName} n'est pas disponible, L'atlas pourrait tomber en panne."
	,"The provided passwords must match":"Les mots de passe doivent être identiques"
	,"The two passwords should match":"Les deux mots de passe devrait être pareils"
	,"There was a problem saving your answers. You will be prompted again next time you log in.":"Problèmes détectés pendant la sauvegarde de vos réponses. Vous serez questionnés à nouveau lors de la prochaine connexion."
	,"This cluster contains {count} features":"Ce groupe contient {count} géométries"
	,"This feature is a cluster and can not be edited directly. Please, zoom in to see features within cluster.":"Vous essayez d'éditer un groupe. SVP, rapprocher la carte pour voir les géométries individuelles."
	,"This object is being modified. Do you wish to continue and revert current changes?":"L'objet en cours d'être modifié. Désirez-vous continuer?"
	,"Title":"Titre"
	,"To":"À"
	,"Transform":"Transformer"
	,"Transform Progress":"Progrès de la transformation"
	,"Transformations completed with some failures":"Transformations complétées. Erreurs détectées."
	,"Transformations completed. Successful: {ok} Failures: {fail} Skipped: {skipped}":"Transformations complétées. Accomplies: {ok} Erreurs: {fail} Ignorées: {skipped}"
	,"Translation":"Traduction"
	,"Tree Display":"Affichage en Arbre"
	,"Tree View":"Perspective en Arbre"
	,"Type of refinement":"Type de spécialisation"
	,"Unable to access help document: {{docId}}":"Impossible d'accéder le document d'aide: {{docId}}"
	,"Unable to complete operation : {err}":"Impossible de compléter l'opération: {err}"
	,"Unable to complete operation because the user information has been updated.":"Impossible de compléter l'opération parce que l'information associé avec l'utilisateur fut modifiée."
	,"Unable to create a new list":"Impossible de créer une nouvelle liste"
	,"Unable to create user":"Impossible de créer un nouvel utilisateur"
	,"Unable to create user: ":"La création d'usager a échoué"
	,"Unable to delete user document: ":"Incapable de supprimer le document d'usager"
	,"Unable to display brief description":"Impossible d'afficher la brève description"
	,"Unable to display document":"Impossible d'afficher le document"
	,"Unable to fetch schema":"Impossible d'obtenir le schème"
	,"Unable to find document search filter":"Impossible de trouver le filtre de recherche"
	,"Unable to find document transform":"Impossible de trouver la transformation"
	,"Unable to find search filter":"Impossible de trouver le filtre de recherche"
	,"Unable to load document":"Impossible de charger le document"
	,"Unable to obtain document {docId}":"Impossible d'obtenir le document {docId}"
	,"Unable to obtain information about user":"Impossible d'obtenir l'information associé avec l'utilisateur"
	,"Unable to obtain list of documents with attachments":"Impossible d'obtenir la liste des documents avec pièces jointes"
	,"Unable to obtain list of layers":"Impossible d'obtenir la liste des couches"
	,"Unable to obtain list of schemas":"Impossible d'obtenir la liste des schèmes"
	,"Unable to obtain submision document: {err}":"Impossible d'obtenir la soumission: {err}"
	,"Unable to obtain user agreement":"Impossible d'obtenir l'entente de l'utilisateur"
	,"Unable to parse JSON string: ":"Incapable de lire l'expression JSON: "
	,"Unable to parse key: ":"Incapable de comprendre la clé: "
	,"Unable to reach database to submit document: {err}":"Incapable de contacter la base de données pour soumissions"
	,"Unable to reach server: {err}":"Incapable de contacter le serveur: {err}"
	,"Unable to recover password":"Incapable de récupérer le mot de passe"
	,"Unable to recover password: ":"Incapable de récupérer le mot de passe: "
	,"Unable to register user: ":"Incapable d'enregistrer l'utilisateur"
	,"Unable to retrieve document":"Impossible de trouver le document"
	,"Unable to retrieve documents":"Impossible de trouver les documents"
	,"Unable to save user document: ":"Incapable de sauvegarder le document d'usager"
	,"Unable to set password: ":"Impossible de changer le mot de passe"
	,"Unable to update submision document: {err}":"Incapable de mettre à jour le document de soumission"
	,"Unable to upload file. Cause: {err}":"Incapable de télécharger le fichier. Raison: {err}"
	,"Unable to verify password recovery token":"Incapable de vérifier le jeton pour récupération de mot de passe"
	,"Unable to verify token":"Incapable de vérifier le jeton"
	,"Uncategorized":"Sans catégorie"
	,"Unknown Filter":"Filtre inconnu"
	,"Unknown List":"Liste inconnue"
	,"Unknown Transform":"Transformation inconnue"
	,"Unsupported Browser":"Fureteur incompatible"
	,"Upload":"Télécharger"
	,"Upload Media Directory Listing":"Liste du répertoire de fichiers médiatiques"
	,"Upload service can not be reached. Unable to submit a related document.":"Le service de téléchargement n'est pas disponible."
	,"User":"Usager"
	,"User Agreement":"Entente de l'utilisateur"
	,"User Agreement and Terms of Service":"Entente de l'utilisateur et conditions d'utilisation"
	,"User Creation":"Creation d'un Usager"
	,"User Questionnaire":"Questionnaire de l'utilisateur"
	,"User Registration":"Enregistrement de l'utilisateur"
	,"User agreement has changed. You must accept before you can authenticate.":"L'entente de l'utilisateur a été mise à jour. Vous devez accepter la nouvelle version avant de procéder."
	,"User created but unable to log in: ":"Le nouvel usager fut créé, mais il est impossible d'ouvrir la session."
	,"User created successfully.":"Utilisateur créé"
	,"User name should have at least 3 characters":"Le nom d'usager devrait avoir au moins 3 caractères"
	,"User refused agreement":"L'utilisateur a rejeté l'entente"
	,"User registration initiated. Check for e-mail to complete user creation":"L'enregistrement de l'utilisateur a débuté. Vérifiez vos couriels pour continuer le processus."
	,"Validated E-mail":"Adresse couriel vérifiée"
	,"Verify Password":"Vérifiez le mot de passe"
	,"Verifying token":"Vérification du jeton"
	,"View":"Afficher"
	,"View Media":"Visualiser le Média"
	,"View Original":"Visionner le document original"
	,"View Submission":"Visionner la soumission"
	,"View Submitted":"Visionner la soumission"
	,"Warning on Database Submissions":"Avertissement à la base de données des soumissions"
	,"Welcome":"Bienvenue"
	,"You are about to delete this document. Do you want to proceed?":"Voulez-vous vraiment supprimer ce document?"
	,"You are about to leave this page. Do you wish to continue?":"Vous quittez cette page. Voulez-vous continuer?"
	,"You must agree to the User Agreement before creating a user.":"Vous devez accepter l'entente de l'utilisateur avant d'enregistrer un nouvel utilisateur"
	,"You must enter a valid function":"Vous devez soumettre une fonction valide"
	,"You must first load the database info.":"Vous devez en premier charger l'information de la base données"
	,"You must first load the media directory listing.":"Vous devez en premier charger la liste du répertoire des fichiers médiatiques"
	,"You must leave the atlas to view this file.":"Vous devez quitter l'atlas pour accéder à ce fichier."
	,"You must provide a display name":"Vous devez préciser un nom d'affichage"
	,"You must provide a password":"Vous devez préciser un mot de passe"
	,"Your browser is not supported by this web site.":"Votre fureteur est incompatible avec ce site"
	,"Your file was uploaded and will become available when it has been approved.":"Votre fichier est téléchargé. Il sera disponible lorsqu'un adminitrateur l'aura approuvé"
	,"Your password is too short":"Votre mot de passe est trop court"
	,"Zoom In":"Rapprocher la carte"
	,"Zoom Out":"Eloigner la carte"
	,"a Checkbox":"une Boîte"
	,"a Number":"un Chiffre"
	,"a String":"une Chaîne de Caractères"
	,"an Array":"une Chaîne"
	,"an Object":"un Objet"
	,"an image":"une image"
	,"confirm password":"vérifier le mot de passe"
	,"creation":"création"
	,"deletion":"supression"
	,"display name":"nom d'affichage"
	,"e-mail address":"adresse couriel"
	,"empty":"vide"
	,"id":"id"
	,"is":"est"
	,"password":"mot de passe"
	,"search the atlas":"recherche de l'atlas"
	,"top":"en haut"
	,"update":"mise à jour"
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