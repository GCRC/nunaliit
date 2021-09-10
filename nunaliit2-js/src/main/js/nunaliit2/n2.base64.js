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

;(function($n2){
  "use strict";
  var stringFromCharCode = String.fromCharCode;
  
          // Taken from https://mths.be/punycode
          function ucs2decode(string) {
                  var output = [];
                  var counter = 0;
                  var length = string.length;
                  var value;
                  var extra;
                  while (counter < length) {
                          value = string.charCodeAt(counter++);
                          if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
                                  // high surrogate, and there is a next character
                                  extra = string.charCodeAt(counter++);
                                  if ((extra & 0xFC00) == 0xDC00) { // low surrogate
                                          output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
                                  } else {
                                          // unmatched surrogate; only append this code unit, in case the next
                                          // code unit is the high surrogate of a surrogate pair
                                          output.push(value);
                                          counter--;
                                  }
                          } else {
                                  output.push(value);
                          }
                  }
                  return output;
          }
  
          /*--------------------------------------------------------------------------*/
  
          function createByte(codePoint, shift) {
                  return stringFromCharCode(((codePoint >> shift) & 0x3F) | 0x80);
          }
  
          function encodeCodePoint(codePoint) {
                  if ((codePoint & 0xFFFFFF80) == 0) { // 1-byte sequence
                          return stringFromCharCode(codePoint);
                  }
                  var symbol = '';
                  if ((codePoint & 0xFFFFF800) == 0) { // 2-byte sequence
                          symbol = stringFromCharCode(((codePoint >> 6) & 0x1F) | 0xC0);
                  }
                  else if ((codePoint & 0xFFFF0000) == 0) { // 3-byte sequence
                          symbol = stringFromCharCode(((codePoint >> 12) & 0x0F) | 0xE0);
                          symbol += createByte(codePoint, 6);
                  }
                  else if ((codePoint & 0xFFE00000) == 0) { // 4-byte sequence
                          symbol = stringFromCharCode(((codePoint >> 18) & 0x07) | 0xF0);
                          symbol += createByte(codePoint, 12);
                          symbol += createByte(codePoint, 6);
                  }
                  symbol += stringFromCharCode((codePoint & 0x3F) | 0x80);
                  return symbol;
          }
  
          function utf8encode(string) {
                  var codePoints = ucs2decode(string);
                  var length = codePoints.length;
                  var index = -1;
                  var codePoint;
                  var byteString = '';
                  while (++index < length) {
                          codePoint = codePoints[index];
                          byteString += encodeCodePoint(codePoint);
                  }
                  return byteString;
          }
  
          /*--------------------------------------------------------------------------*/
          // Taken from https://mths.be/punycode

/**
 * UTF-8 Decoder is not currently used anywhere in Nunaliit, but left in commented out in case of future need.
 */

        //   function ucs2encode(array) {
        //         var length = array.length;
        //         var index = -1;
        //         var value;
        //         var output = '';
        //         while (++index < length) {
        //                 value = array[index];
        //                 if (value > 0xFFFF) {
        //                         value -= 0x10000;
        //                         output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
        //                         value = 0xDC00 | value & 0x3FF;
        //                 }
        //                 output += stringFromCharCode(value);
        //         }
        //         return output;
        // }
  
        //   function readContinuationByte() {
        //           if (byteIndex >= byteCount) {
        //                   throw Error('Invalid byte index');
        //           }
  
        //           var continuationByte = byteArray[byteIndex] & 0xFF;
        //           byteIndex++;
  
        //           if ((continuationByte & 0xC0) == 0x80) {
        //                   return continuationByte & 0x3F;
        //           }
  
        //           // If we end up here, it’s not a continuation byte
        //           throw Error('Invalid continuation byte');
        //   }
  
        //   function decodeSymbol() {
        //           var byte1;
        //           var byte2;
        //           var byte3;
        //           var byte4;
        //           var codePoint;
  
        //           if (byteIndex > byteCount) {
        //                   throw Error('Invalid byte index');
        //           }
  
        //           if (byteIndex == byteCount) {
        //                   return false;
        //           }
  
        //           // Read first byte
        //           byte1 = byteArray[byteIndex] & 0xFF;
        //           byteIndex++;
  
        //           // 1-byte sequence (no continuation bytes)
        //           if ((byte1 & 0x80) == 0) {
        //                   return byte1;
        //           }
  
        //           // 2-byte sequence
        //           if ((byte1 & 0xE0) == 0xC0) {
        //                   var byte2 = readContinuationByte();
        //                   codePoint = ((byte1 & 0x1F) << 6) | byte2;
        //                   if (codePoint >= 0x80) {
        //                           return codePoint;
        //                   } else {
        //                           throw Error('Invalid continuation byte');
        //                   }
        //           }
  
        //           // 3-byte sequence (may include unpaired surrogates)
        //           if ((byte1 & 0xF0) == 0xE0) {
        //                   byte2 = readContinuationByte();
        //                   byte3 = readContinuationByte();
        //                   codePoint = ((byte1 & 0x0F) << 12) | (byte2 << 6) | byte3;
        //                   if (codePoint >= 0x0800) {
        //                           return codePoint;
        //                   } else {
        //                           throw Error('Invalid continuation byte');
        //                   }
        //           }
  
        //           // 4-byte sequence
        //           if ((byte1 & 0xF8) == 0xF0) {
        //                   byte2 = readContinuationByte();
        //                   byte3 = readContinuationByte();
        //                   byte4 = readContinuationByte();
        //                   codePoint = ((byte1 & 0x0F) << 0x12) | (byte2 << 0x0C) |
        //                           (byte3 << 0x06) | byte4;
        //                   if (codePoint >= 0x010000 && codePoint <= 0x10FFFF) {
        //                           return codePoint;
        //                   }
        //           }
  
        //           throw Error('Invalid UTF-8 detected');
        //   }
  
        //   var byteArray;
        //   var byteCount;
        //   var byteIndex;
        //   function utf8decode(byteString) {
        //           byteArray = ucs2decode(byteString);
        //           byteCount = byteArray.length;
        //           byteIndex = 0;
        //           var codePoints = [];
        //           var tmp;
        //           while ((tmp = decodeSymbol()) !== false) {
        //                   codePoints.push(tmp);
        //           }
        //           return ucs2encode(codePoints);
        //   }
  
  $n2.Base64 = {
  
      encodeMultibyte: function(input) {
        var utf8encodedInput = utf8encode(input);
        return btoa(utf8encodedInput)
      }
//       Decoder is not currently used, but left in commented out in case of future need.
//       ,decodeMultibyte : function(input) {
//         var output = atob(input)
//         var utf8decodedOutput = utf8decode(output);
//         return utf8decodedOutput;
//       }
      ,encode: function(input) {
          return btoa(input)
      }
  
      ,decode : function(input) {
          return atob(input)
      }
  };
  
  })(nunaliit2);