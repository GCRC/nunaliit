/*
Copyright (c) 2011, Geomatics and Cartographic Research Centre, Carleton 
University
All rights reserved.

Redistribution and use in source and binary forms, with or without 
modification, are permitted provided that the following conditions are met:

 - Redistributions of source code must retain the above copyright notice, 
   this list of conditions and the following disclaimer.
 - Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.
 - Neither the name of the Geomatics and Cartographic Research Centre, 
   Carleton University nor the names of its contributors may be used to 
   endorse or promote products derived from this software without specific 
   prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE 
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE 
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE 
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR 
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF 
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS 
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN 
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) 
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE 
POSSIBILITY OF SUCH DAMAGE.

*/

// @ requires n2.utils.js

;(function($,$n2){

    var codex = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	
$n2.Base64 = {

    encode: function(input) {
        var output = [];

        var index = 0;
        while( index < input.length ) {
            var chr1 = input.charCodeAt(index++);
            var chr2 = input.charCodeAt(index++);
            var chr3 = input.charCodeAt(index++);

            var enc1 = chr1 >> 2;
            var enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            var enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            var enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output.push(codex.charAt(enc1) + codex.charAt(enc2) + codex.charAt(enc3) + codex.charAt(enc4));
        };

        return output.join('');
    }

    ,decode : function(input) {
    	var output = [];
 
		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
 
		var i = 0;
		while (i < input.length) {
 
			var enc1 = codex.indexOf(input.charAt(i++));
			var enc2 = codex.indexOf(input.charAt(i++));
			var enc3 = codex.indexOf(input.charAt(i++));
			var enc4 = codex.indexOf(input.charAt(i++));
 
			var chr1 = (enc1 << 2) | (enc2 >> 4);
			var chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			var chr3 = ((enc3 & 3) << 6) | enc4;
 
			output.push( String.fromCharCode(chr1) );
 
			if (enc3 != 64) {
				output.push( String.fromCharCode(chr2) );
			}
			if (enc4 != 64) {
				output.push( String.fromCharCode(chr3) );
			}
 
		}
 
		return output.join('');
    }
};

})(jQuery,nunaliit2);