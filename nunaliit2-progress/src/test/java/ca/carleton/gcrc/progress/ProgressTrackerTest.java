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
package ca.carleton.gcrc.progress;

import junit.framework.TestCase;

public class ProgressTrackerTest extends TestCase {

	public void testTracking() {
		String desc = "description";
		long totalCount = 25;
		
		ProgressTracker progressTracker = new ProgressTrackerImpl();
		String id = progressTracker.createIdentifier();
		progressTracker.initProgress(id, desc, totalCount);
		
		// Check init
		{
			ProgressInfo info = progressTracker.getProgress(id);
			if( false == desc.equals( info.getDescription() ) ) {
				fail("Description no set correctly after init()");
			}
			if( totalCount != info.getTotalCount() ) {
				fail("Total count no set correctly after init()");
			}
			if( 0 != info.getCurrentCount() ) {
				fail("Current count no set correctly after init()");
			}
		}

		long updateCount = 10;
		progressTracker.updateProgress(id, updateCount);
		
		// Check update
		{
			ProgressInfo info = progressTracker.getProgress(id);
			if( false == desc.equals( info.getDescription() ) ) {
				fail("Description no set correctly after update()");
			}
			if( totalCount != info.getTotalCount() ) {
				fail("Total count no set correctly after update()");
			}
			if( updateCount != info.getCurrentCount() ) {
				fail("Current count no set correctly after update()");
			}
		}

		updateCount = 25;
		progressTracker.updateProgress(id, updateCount);
		
		// Check update
		{
			ProgressInfo info = progressTracker.getProgress(id);
			if( false == desc.equals( info.getDescription() ) ) {
				fail("Description no set correctly after update()");
			}
			if( totalCount != info.getTotalCount() ) {
				fail("Total count no set correctly after update()");
			}
			if( updateCount != info.getCurrentCount() ) {
				fail("Current count no set correctly after update()");
			}
		}
	}
}
