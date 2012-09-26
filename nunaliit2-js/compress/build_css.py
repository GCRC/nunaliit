#!/usr/bin/env python

import sys
sys.path.append("./libs")
import merge_css

def merging(sourceDirectory, outputFilename = None, configFilename = None):

	print "Merging CSS files."
	merged = merge_css.run(sourceDirectory, None, configFilename)
	
	print "Writing to %s." % outputFilename
	file(outputFilename, "w").write(merged)
	
	print "Done."



merging("../src/main/webapp/nunaliit2/css/basic", "../src/main/webapp/nunaliit2/css/basic/nunaliit2.css", "nunaliit2-css.cfg")
merging("../src/main/webapp/nunaliit2/css/basic", "../src/main/webapp/nunaliit2/css/basic/nunaliit2-mobile.css", "nunaliit2-css-mobile.cfg")

