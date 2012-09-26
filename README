This project is built using Maven. To build project:

> mvn install


Release
-------

To create a new release of the project:

> mvn release:prepare
> mvn release:perform


Notes on releasing to public repository
---------------------------------------

- create a gpg key
  - upload gpg key to server:
    gpg --keyserver hkp://pgp.mit.edu --send-keys 1B2CABB8
  - Add repository passwords to .m2/settings.xml
- To upload a snapshot to the SonaType repository
  > mvn clean deploy
- To perform a release:
  > mvn release:prepare
  > mvn release:perform
  - Go to OSS NExus and publish: https://docs.sonatype.org/display/Repository/Sonatype+OSS+Maven+Repository+Usage+Guide
    - Log in at https://oss.sonatype.org/index.html
    - Select "Staging Repositories"
    - Select checkbox next to uploaded bundle
    - Press button "Close"
    - Select checkbox next to uploaded bundle
    - Press button "Release"
  - Verify that release is pushed to public repository (might take an hour)
    http://repo1.maven.org/maven2/ca/carleton/gcrc/nunaliit2

Eclipse
-------

Using Eclipse, you need to install the Maven plug-in. Repository:

http://m2eclipse.sonatype.org/update/

Check out project by using the menu option "Check out as Maven Project" This
should save you grief.