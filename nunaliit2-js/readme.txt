Adding a new file to the Nunaliit2 library
==========================================

When adding a new file to the Nunaliit2 js library,
it must be referenced in 3 places:

1. .../compress/nunaliit2.cfg
   This is the place the file is referenced for the
   compressor that creates nunaliit2.js

2. .../src/main/js/nunaliit2/nunaliit2-debug.js
   This is the uncompressed debug version of the library

3. .../tools/build.xml
   This is the reference to the file that includes it in
   the documentation.

Documentation
=============

To generate the documentation from the nunaliit2 library, perform
the following commands:
> cd tools
> ant

The documentation will be generated in a directory called:
  .../jsdoc
  

Testing
=======

Some testing of the Javascript code is performed on every build. The
test cases are found in:

./src/test/javascript/test_cases.js

The Javascript files loaded during testing are defined in the file:

./compress/nunaliit2-test.cfg