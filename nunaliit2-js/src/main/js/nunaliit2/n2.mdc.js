/*
Copyright (c) 2019, Geomatics and Cartographic Research Centre, Carleton 
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

;(function($,$n2){
"use strict";

var DH = 'n2.mdc';
	
// ===========================================================================
var attachMDCComponents = function(){

	// attach ripple to buttons 
	var mdc_buttons = document.getElementsByClassName('mdc-button');
	for(i = 0, e = mdc_buttons.length; i < e; i++){
		try {
			mdc.ripple.MDCRipple.attachTo(mdc_buttons[i]);
		} catch(error){
			$n2.log("Unable to attach material design component to button ripple: " + error);
		}
	};

	// attach textFields 
	var text_fields = document.getElementsByClassName('mdc-text-field');
	var i, e;
	for(i = 0, e = text_fields.length; i < e; i++){
		try {
			mdc.textField.MDCTextField.attachTo(text_fields[i]);
		} catch(error) {
			$n2.log("Unable to attach text field material design component: " + error);
		}
	}

	// attach text field helper text
	var helper_text = document.getElementsByClassName('mdc-text-field-helper-text');
	for(i = 0, e = helper_text.length; i < e; i++){
		try {
			mdc.textField.MDCTextFieldHelperText.attachTo(helper_text[i]);
		} catch(error) {
			$n2.log("Unable to attach helper text material design component: " + error);
		}
	}

	// attach floating labels
	var floating_labels = document.getElementsByClassName('mdc-floating-label');
	for(i = 0, e = floating_labels.length; i < e; i++){
		try {
		mdc.floatingLabel.MDCFloatingLabel.attachTo(floating_labels[i]); 
		} catch(error) {
			$n2.log("Unable to attach floating label material design component: " + error);
		}
	}

	// attach select menus
	var select_menus = document.getElementsByClassName('mdc-select');

	for(i = 0, e = select_menus.length; i < e; i++){
		try {
			mdc.select.MDCSelect.attachTo(select_menus[i]);
		} catch(error) {
			$n2.log("Unable to attach select menu material design component: " + error);
		}
	}

	// attach notched outlines
	var notched_outlines = document.getElementsByClassName('mdc-notched-outline');
	for(i = 0, e = notched_outlines.length; i < e; i++){
		try {
			mdc.notchedOutline.MDCNotchedOutline.attachTo(notched_outlines[i]);
		} catch(error) {
			$n2.log("Unable to attach notched outline material design component: " + error);
		}
	}

	// attach checkboxes
	var lists = document.getElementsByClassName('mdc-list');
	for(i = 0, e = lists.length; i < e; i++){
		try {
			mdc.list.MDCList.attachTo(lists[i]);
		} catch(error) {
			$n2.log("Unable to attach list material design component: " + error);
		}
	}

	// attach form fields
	var formFields = document.getElementsByClassName('mdc-form-field');
	for(i = 0, e = formFields.length; i < e; i++){
		try {
			mdc.formField.MDCFormField.attachTo(formFields[i]);
		} catch(error) {
			$n2.log("Unable to attach form field material design component: " + error);
		}
	}

	// attach checkboxes
	var checkboxes = document.getElementsByClassName('mdc-checkbox');
	for(i = 0, e = checkboxes.length; i < e; i++){
		try {
			mdc.checkbox.MDCCheckbox.attachTo(checkboxes[i]);
		} catch(error) {
			$n2.log("Unable to attach checkbox material design component: " + error);
		}
	}
};

// ===========================================================================
// MDC handlebar templates for various web components


// MDC Component: Textarea field
// Required Handlebar Expressions:
//  * {{id}} = textarea id
//  * {{label}} = floating label used by the textarea field
var mdcTextareaTemplate = '\
	<div class="mdc-text-field mdc-text-field--textarea">\
		<textarea id="{{id}}" class="mdc-text-field__input" rows="8" cols="40"></textarea>\
		<div class="mdc-notched-outline">\
			<div class="mdc-notched-outline__leading"></div>\
			<div class="mdc-notched-outline__notch">\
				<label for="{{id}}" class="mdc-floating-label">{{label}}</label></div>\
				<div class="mdc-notched-outline__trailing"></div>\
			</div>\
	</div>';

// ===========================================================================

$n2.mdc = {
	attachMDCComponents: attachMDCComponents,
	mdcTextareaTemplate: mdcTextareaTemplate
};

})(jQuery,nunaliit2);