/*
  Nunaliit2 French Language Pack
*/
;(function($n2){

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
	'user':'usager'
	,'user name':'nom d\'usager'
	,'password':'mot de passe'
	,'Login':'Ouvrir session'
	,'Logout':'Fermer session'
	,'Please login':'Ouverture de session'
	,'Create a new user':'Créer un nouvel usager'
	,'OK':'Accepter'
	,'Cancel':'Annuler'
	,'Welcome':'Bienvenue'
	
	// tree
	,"Do you wish to delete this element?":"Désirez-vous supprimer cet élément?"
	,"This object is being modified. Do you wish to continue and revert current changes?":"L'objet en cours d'être modifié. Désirez-vous continuer?"
	,"Unable to parse JSON string: ":"Incapable de lire l'expression JSON: "
	,"Unable to parse key: ":"Incapable de comprendre la clé: "
	,"Key already in use: ":"Clé déjà utilisée: "
});
	
})(nunaliit2);