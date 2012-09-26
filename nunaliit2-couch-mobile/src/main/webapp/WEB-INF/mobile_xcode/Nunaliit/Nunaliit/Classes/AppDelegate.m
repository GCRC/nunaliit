//
//  AppDelegate.m
//  Nunaliit
//
//  Created by Client Admin on 11-08-11.
//  Copyright __MyCompanyName__ 2011. All rights reserved.
//

#import "AppDelegate.h"
#ifdef PHONEGAP_FRAMEWORK
	#import <PhoneGap/PhoneGapViewController.h>
#else
	#import "PhoneGapViewController.h"
#endif

@implementation AppDelegate

@synthesize invokeString;

- (id) init
{	
	/** If you need to do any extra app-specific initialization, you can do it here
	 *  -jm
	 **/
    return [super init];
}

/**
 * This is main kick off after the app inits, the views and Settings are setup here. (preferred - iOS4 and up)
 */
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
//    [CouchbaseMobile startCouchbase:self];
    CouchbaseMobile* couchServer = [[CouchbaseMobile alloc] init];
    couchServer.delegate = self;
    //couchServer.iniFilePath = @"couchdb_app.ini";
    couchServer.iniFilePath = [[NSBundle mainBundle] pathForResource:@"couchdb_app.ini" ofType:nil];
    [couchServer start];
	
	NSArray *keyArray = [launchOptions allKeys];
	if ([launchOptions objectForKey:[keyArray objectAtIndex:0]]!=nil) 
	{
		NSURL *url = [launchOptions objectForKey:[keyArray objectAtIndex:0]];
		self.invokeString = [url absoluteString];
		NSLog(@"Nunaliit launchOptions = %@",url);
	}
	
	return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

// this happens while we are running ( in the background, or from within our own app )
// only valid if Nunaliit.plist specifies a protocol to handle
- (BOOL)application:(UIApplication *)application handleOpenURL:(NSURL *)url 
{
    // must call super so all plugins will get the notification, and their handlers will be called 
	// super also calls into javascript global function 'handleOpenURL'
    NSLog(@"application:handleOpenURL: = %@",url);
    return [super application:application handleOpenURL:url];
    
    // Do something with the url here
    //NSString* jsString = [NSString stringWithFormat:@"handleOpenURL(\"%@\");", url];
    //[webView stringByEvaluatingJavaScriptFromString:jsString];
        
    //return YES;

}

-(id) getCommandInstance:(NSString*)className
{
	/** You can catch your own commands here, if you wanted to extend the gap: protocol, or add your
	 *  own app specific protocol to it. -jm
	 **/
	return [super getCommandInstance:className];
}

/**
 Called when the webview finishes loading.  This stops the activity view and closes the imageview
 */
- (void)webViewDidFinishLoad:(UIWebView *)theWebView 
{
    NSLog(@"webViewDidFinishLoad:");
    
    self.myWebView = theWebView;
    
	// only valid if Nunaliit.plist specifies a protocol to handle
	if(self.invokeString)
	{
		// this is passed before the deviceready event is fired, so you can access it in js when you receive deviceready
		NSString* jsString = [NSString stringWithFormat:@"var invokeString = \"%@\";", self.invokeString];
        NSLog(@"Web View evaluates: %@", jsString);
		[theWebView stringByEvaluatingJavaScriptFromString:jsString];
	}
    
    // If couch base URL has already been reported
    if( self.couchbaseURL ) 
    {
        NSString* openNunaliit = [NSString stringWithFormat:@"window.couchLocation = \"%@\"", self.couchbaseURL];
        NSLog(@"Web View evaluates: %@", openNunaliit);
        [self.myWebView stringByEvaluatingJavaScriptFromString:openNunaliit];
    }
    
	return [ super webViewDidFinishLoad:theWebView ];
}

- (void)webViewDidStartLoad:(UIWebView *)theWebView 
{
	return [ super webViewDidStartLoad:theWebView ];
}

/**
 * Fail Loading With Error
 * Error - If the webpage failed to load display an error with the reason.
 */
- (void)webView:(UIWebView *)theWebView didFailLoadWithError:(NSError *)error 
{
	return [ super webView:theWebView didFailLoadWithError:error ];
}

/**
 * Start Loading Request
 * This is where most of the magic happens... We take the request(s) and process the response.
 * From here we can re direct links and other protocalls to different internal methods.
 */
- (BOOL)webView:(UIWebView *)theWebView shouldStartLoadWithRequest:(NSURLRequest *)request navigationType:(UIWebViewNavigationType)navigationType
{
	return [ super webView:theWebView shouldStartLoadWithRequest:request navigationType:navigationType ];
}


- (BOOL) execute:(InvokedUrlCommand*)command
{
	return [ super execute:command];
}

- (void)dealloc
{
	[ super dealloc ];
}

- (void)couchbaseMobile:(CouchbaseMobile*)couchbase didStart:(NSURL *)serverURL {
    self.couchbaseURL = serverURL;
    NSLog(@"[INFO] CouchDB is ready at serverURL %@",serverURL);
         
    NSString* openNunaliit = [NSString stringWithFormat:@"window.couchLocation = \"%@\"", serverURL];
    NSLog(@"Web View evaluates: %@", openNunaliit);
    [self.myWebView stringByEvaluatingJavaScriptFromString:openNunaliit];
}

- (void)couchbaseMobile:(CouchbaseMobile*)couchbase failedToStart:(NSError*)error {
    // TBD
}

@synthesize couchbaseURL;
@synthesize myWebView;

@end
