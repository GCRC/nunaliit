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

import java.util.Map;

/**
 * Interface for classes that track progress information.
 * It tracks activities based on identifiers. Activities
 * have a description, a total count and a current count. 
 *
 */
public interface ProgressTracker {
	
	/**
	 * Creates and return a unique identifier that can be used to track
	 * activities.
	 * @return A unique identifier.
	 */
	public String createIdentifier();
	
	/**
	 * This is used to report a new activity on which progress is tracked.
	 * The identifier must be unique across all usage. To ensure that the
	 * identifier is unique, {@link #createIdentifier()} can be used, but it
	 * is not necessary.
	 * @param identifier Unique identifier used to track an activity
	 * @param description Description of the tracked activity
	 * @param totalCount Total count in the activity
	 */
	public void initProgress(String identifier, String description, long totalCount);

	/**
	 * This is used to update the progress of an activity. The identifier used
	 * must match one that was already initialized in {@link #initProgress(String, String, long)}.
	 * @param identifier Unique identifier used to track an activity
	 * @param currentCount Count up to date of this activity
	 */
	public void updateProgress(String identifier, long currentCount);

	/**
	 * This is used to set data associated with a an activity. The identifier used
	 * must match one that was already initialized in {@link #initProgress(String, String, long)}.
	 * @param identifier Unique identifier used to track an activity
	 * @param currentCount Count up to date of this activity
	 */
	public void updateProgressData(String identifier, Map<String,String> data);
	
	/**
	 * Before an activity is complete, it is possible to start a new activity and chain
	 * it the a previous one. This allows tracking objects to follow the path of an execution.
	 * The identifier used
	 * must match one that was already initialized in {@link #initProgress(String, String, long)}.
	 * @param identifier Unique identifier used to track an activity
	 * @param chainedActivity Activity that is being chained (follow) this one
	 */
	public void addProgressChain(String identifier, ProgressInfo chainedActivity);
	
	/**
	 * This is used to report a that an activity has completed.
	 * The identifier must be unique across all usage. To ensure that the
	 * identifier is unique, {@link #createIdentifier()} can be used, but it
	 * is not necessary.
	 * @param identifier Unique identifier used to track an activity
	 * @param errorMessage Error message if an error occurred. False otherwise.
	 */
	public void completeProgress(String identifier, String errorMessage);

	/**
	 * Returns the current status of an activity. This call
	 * is expensive, since it performs clean up. Also, when accessing
	 * the progress info (returned object), it should be synchronized
	 * since it is shared with other threads.
	 * @param identifier Unique identifier used to track an activity
	 * @return Object that contains information about a tracked activity
	 */
	public ProgressInfo getProgress(String identifier);
	
}
