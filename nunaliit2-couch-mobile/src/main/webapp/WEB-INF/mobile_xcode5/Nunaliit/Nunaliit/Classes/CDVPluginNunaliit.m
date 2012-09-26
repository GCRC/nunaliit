//
//  CDVPluginNunaliit.m
//
//  Copyright (c) 2012, Geomatics and Cartographic Research Centre, Carleton 
//  University
//  All rights reserved.
//  
//  Redistribution and use in source and binary forms, with or without 
//  modification, are permitted provided that the following conditions are met:
//  
//  - Redistributions of source code must retain the above copyright notice, 
//  this list of conditions and the following disclaimer.
//  - Redistributions in binary form must reproduce the above copyright notice,
//  this list of conditions and the following disclaimer in the documentation
//  and/or other materials provided with the distribution.
//  - Neither the name of the Geomatics and Cartographic Research Centre, 
//  Carleton University nor the names of its contributors may be used to 
//  endorse or promote products derived from this software without specific 
//  prior written permission.
//  
//  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
//  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE 
//  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE 
//  ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE 
//  LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR 
//  CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF 
//                         SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS 
//                         INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN 
//  CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) 
//  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE 
//  POSSIBILITY OF SUCH DAMAGE.
//



#import "CDVPluginNunaliit.h"

static CouchbaseMobile* globalCouchbase = NULL;

@implementation CDVPluginNunaliit

- (void)installGlobalCouchbase:(CouchbaseMobile*)cb
{
    globalCouchbase = cb;
}

- (void)couchBaseInfo:(NSMutableArray *)arguments withDict:(NSMutableDictionary *)options 
{
    NSLog(@"CDVPluginNunaliit couchBaseInfo:withDict: called");
    
    NSUInteger argc = [arguments count];
    
	if(argc < 2) {
        NSLog(@"CDVPluginNunaliit couchBaseInfo:withDict: called with invalid number of arguments: %d",argc);
        return; 
    }
    
    NSString *successCallback = [arguments objectAtIndex:0];
    NSString *failureCallback = [arguments objectAtIndex:1];
    // NSString *contentType = [options valueForKey:@"contentType"];
    
    if( !globalCouchbase ) {
        [self sendErrorTo:failureCallback withStringMessage:@"Global Couchbase is not set"];
        return; 
    };
    
    NSURL* location = globalCouchbase.serverURL;
    NSString* locationStr = @"null";
    if( location ) {
        locationStr = [NSString stringWithFormat:@"\"%@\"",location];
    }
    
    NSError* error = globalCouchbase.error;
    NSString* errorStr = @"null";
    if( error ) {
        errorStr = [NSString stringWithFormat:@"\"%@\"",[error localizedDescription]];
    }
    
    // Success
    [self writeJavascript: 
        [NSString stringWithFormat:@"%@({ok:true,location:%@,errorMsg:%@});"
         ,successCallback
         ,locationStr
         ,errorStr
         ]
     ];
}

- (void)restartCouchDb:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options 
{
    NSLog(@"CDVPluginNunaliit restartCouchDb:withDict: called");
    
    NSUInteger argc = [arguments count];
    
	if(argc < 2) {
        NSLog(@"CDVPluginNunaliit restartCouchDb:withDict: called with invalid number of arguments: %d",argc);
        return; 
    }

    NSString *successCallback = [arguments objectAtIndex:0];
    NSString *failureCallback = [arguments objectAtIndex:1];
    // NSString *contentType = [options valueForKey:@"contentType"];

    if( !globalCouchbase ) {
        [self sendErrorTo:failureCallback withStringMessage:@"Global Couchbase is not set"];
        return; 
    };
    
    [globalCouchbase restart];
    
    // Success
    [self writeJavascript: [NSString stringWithFormat:@"%@({ok:true});", successCallback]];
}

- (void)sendErrorTo:(NSString*)errorCallback withStringMessage:(NSString*)errorMessage 
{
    [self writeJavascript:
        [NSString stringWithFormat:@"%@(\"%@\");", errorCallback, errorMessage]
    ];
}


@end
