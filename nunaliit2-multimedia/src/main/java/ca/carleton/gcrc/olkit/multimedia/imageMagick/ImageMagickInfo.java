/*
Copyright (c) 2010, Geomatics and Cartographic Research Centre, Carleton 
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

$Id$
*/
package ca.carleton.gcrc.olkit.multimedia.imageMagick;

import ca.carleton.gcrc.olkit.multimedia.converter.MultimediaConversionProgress;

public class ImageMagickInfo {
	
	enum ProcessorType {
		VERSION_6_5_AND_PREVIOUS
		,VERSION_6_6
	}

	public boolean isAvailable = false;
	
	public boolean isIdentifyAvailable = false;
	public String identifyVersion;
	
	public boolean isConvertAvailable = false;
	public String convertVersion;
	
	public ProcessorType processorType = null;
	
	public ImageMagickProcessor getProcessor() {
		if( ProcessorType.VERSION_6_5_AND_PREVIOUS == processorType ) {
			return new ImageMagickProcessor_6_5();
		}
		if( ProcessorType.VERSION_6_6 == processorType ) {
			return new ImageMagickProcessorDefault();
		}
		return null;
	}
	
	public ImageMagickProcessor getProcessor(MultimediaConversionProgress progress) {
		if( ProcessorType.VERSION_6_5_AND_PREVIOUS == processorType ) {
			return new ImageMagickProcessor_6_5(progress);
		}
		if( ProcessorType.VERSION_6_6 == processorType ) {
			return new ImageMagickProcessorDefault(progress);
		}
		return null;
	}
}
