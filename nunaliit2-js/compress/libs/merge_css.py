#!/usr/bin/env python
#
# Merge multiple CSS files into one.
#
# This script should be executed like so:
#
#     merge_css.py <output.css> <file1.css> [...]
#
# e.g.
#
#     merge_css.py combined.css file1.css file2.css
#

import re
import os
import sys

class SourceFile:
    """
    Represents a CSS source code file.
    """

    def __init__(self, filepath, source):
        """
        """
        self.filepath = filepath
        self.source = source


def usage(filename):
    """
    Displays a usage message.
    """
    print "%s [-c <config file>] <output.css>" % filename


class Config:
    """
    Represents a parsed configuration file.

    A configuration file should be of the following form:

        [input]
        3rd/prototype.css
        core/application.css
        # A comment

    All headings are required.

    Any text appearing after a # symbol indicates a comment.
    
    """

    def __init__(self, filename):
        """
        Parses the content of the named file and stores the values.
        """
        lines = [re.sub("#.*?$", "", line).strip() # Assumes end-of-line character is present
                 for line in open(filename)
                 if line.strip() and not line.strip().startswith("#")] # Skip blank lines and comments

        self.input = lines[lines.index("[input]") + 1:]

def run (sourceDirectory, outputFilename = None, configFile = None):
    cfg = None
    if configFile:
        cfg = Config(configFile)

    allFiles = []

    ## Header inserted at the start of each file in the output
    HEADER = "/* " + "=" * 70 + "\n    %s\n" + "   " + "=" * 70 + " */\n\n"

    files = {}

    for filepath in cfg.input:
        print "Importing: %s" % filepath
        fullpath = os.path.join(sourceDirectory, filepath).strip()
        content = open(fullpath, "U").read()
        files[filepath] = SourceFile(filepath, content)
    
    print
    ## Output the files in the determined order
    result = []

    for fp in cfg.input:
        f = files[fp]
        print "Exporting: ", f.filepath
        result.append(HEADER % f.filepath)
        source = f.source
        result.append(source)
        if not source.endswith("\n"):
            result.append("\n")

    print "\nTotal files merged: %d " % len(files)

    if outputFilename:
        print "\nGenerating: %s" % (outputFilename)
        open(outputFilename, "w").write("".join(result))
    return "".join(result)

if __name__ == "__main__":
    import getopt

    options, args = getopt.getopt(sys.argv[1:], "-c:")
    
    try:
        outputFilename = args[0]
    except IndexError:
        usage(sys.argv[0])
        raise SystemExit
    else:
        sourceDirectory = args[1]
        if not sourceDirectory:
            usage(sys.argv[0])
            raise SystemExit

    configFile = None
    if options and options[0][0] == "-c":
        configFile = options[0][1]
        print "Parsing configuration file: %s" % configFile

    run( sourceDirectory, outputFilename, configFile )
