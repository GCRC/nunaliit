#!/usr/bin/env python

import sys
sys.path.append("./libs")
import mergejs

def merging_js(sourceDirectory, outputFilename = None, configFilename = None):

	print "Merging libraries."
	merged = mergejs.run(sourceDirectory, configFilename, None)
	if have_compressor == "jsmin":
	    print "Compressing using jsmin."
	    minimized = jsmin.jsmin(merged)
	else: # fallback
	    print "Not compressing."
	    minimized = merged 
	print "Adding license file."
	minimized = file("license.txt").read() + minimized
	
	print "Writing to %s." % outputFilename
	file(outputFilename, "w").write(minimized)
	
	print "Done."


have_compressor = None
try:
    import jsmin
    have_compressor = "jsmin"
except ImportError, E:
    print E
    pass

merging_js("../src/main/webapp/nunaliit2", "../src/main/webapp/nunaliit2/nunaliit2.js", "nunaliit2.cfg")
merging_js("../src/main/webapp/nunaliit2", "../src/main/webapp/nunaliit2/isiuop.js", "isiuop.cfg")
merging_js("../src/main/webapp/nunaliit2", "../src/main/webapp/nunaliit2/nunaliit2-couch.js", "nunaliit2-couch.cfg")
merging_js("../src/main/webapp/nunaliit2", "../src/main/webapp/nunaliit2/nunaliit2-couch-mobile.js", "nunaliit2-couch-mobile.cfg")

