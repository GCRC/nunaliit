//
//  AppDelegate.h
//  Nunaliit
//
//  Created by Client Admin on 11-08-11.
//  Copyright __MyCompanyName__ 2011. All rights reserved.
//

#import <UIKit/UIKit.h>
#ifdef PHONEGAP_FRAMEWORK
	#import <PhoneGap/PhoneGapDelegate.h>
#else
	#import "PhoneGapDelegate.h"
#endif
#import <Couchbase/CouchbaseMobile.h>

@interface AppDelegate : PhoneGapDelegate<CouchbaseDelegate> {

	NSString* invokeString;
}

// invoke string is passed to your app on launch, this is only valid if you 
// edit Nunaliit.plist to add a protocol
// a simple tutorial can be found here : 
// http://iphonedevelopertips.com/cocoa/launching-your-own-application-via-a-custom-url-scheme.html

@property (copy)  NSString* invokeString;
@property (retain)  UIWebView* myWebView;

@property(nonatomic, retain)NSURL *couchbaseURL;
-(void) couchbaseMobile:(CouchbaseMobile*)couchbase didStart:(NSURL *)serverURL;
-(void) couchbaseMobile:(CouchbaseMobile*)couchbase failedToStart:(NSError*)error;

@end

