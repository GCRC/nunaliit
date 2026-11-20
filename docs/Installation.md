<h2>Obtaining and Installing Nunaliit</h2>
<p>Nunaliit is a developer framework for building web applications. It is also packaged in a way that makes it straightforward to get up and running with an atlas with only a moderate amount of configuration and without having to write any JavaScript.</p>
<p>Nunaliit is server software and does require some system administration skills to install and configure properly. If you are not comfortable using the command-line terminal in your operating system, then you may need some assistance from someone to get up and running.</p>
<ol>
<li><a href="#requirements">System Requirements</a></li>
<li><a href="#prerequisites">Installing Prerequisites</a></li>
<li><a href="#obtaining">Obtaining Nunaliit</a></li>
<li><a href="#installing">Installing Nunaliit</a></li>
</ol>

<!-- ****************************************************************************** -->
<h2><a name="requirements">System Requirements</a></h2>
<p>With a few rare exceptions, everyone who develops and uses Nunaliit does so on Ubuntu Linux. If you are using that, there are [[some documents in this wiki|Prerequisite install on Ubuntu 18.04 LTS]] to help you get Ubuntu set up and ready for Nunaliit. If you aren't using Ubuntu, we recommend [[trying it out|https://www.lifewire.com/beginners-guide-to-ubuntu-2205722]] on an old computer, a virtual machine, or in the cloud (search for "linux VPS" services). If you want to try installing on a different operating system, that is great. Please let us know how it goes but understand we can't spend too much time trying to solve any problems you run into.</p>
<p>For hardware (or virtual hardware), Nunaliit and it's dependancies are happiest with a bit of room to breathe. When running Ubuntu (server edition), a 64-bit, dual-core system (or VPS) with 4GB of RAM is a safe minimum for experimenting with Nunaliit and putting an atlas into production for a relatively small audience. Nunaliit itself only takes up about 100MB so the amount of storage you need will depend on the amount of data (and especially multimedia) you intend to build into your atlas. Storage is relatively cheap, growing it after the fact can be a big pain, and running out of space can be disastrous, so start with enough.</p>
<p>Note: If you have a bit more experience and are thinking about running Nunaliit in Docker/Kubernetes, don't. Docker disk and network IO is not fast enough for any serious use with CouchDB, according to the developers.</p>

<h2><a name="prerequisites">Installing Prerequisites</a></h2>

<p>Nunaliit depends on several other open-source pieces of software.</p>

<p>Ubuntu 20.04 Server or newer is recommended to run Nunaliit. If that is what you are using, then follow this document for detailed instructions: [[Prerequisite Install on Ubuntu 20.04 Server]].</p>
<p>It may be possible to run Nunaliit on other platforms if the prerequisites are met and we'd appreciate your documentation of the process if you are successful. In broad strokes, you will need:
<ul>
<li><b>Java</b> : Nunaliit server side code is written in Java. A Java Runtime Environment
must be installed on the system where the framework is to be used. Java JRE version 11 or better is recommended. Note that to compile Nunaliit from source, a Java Development Kit (JDK) is required.</li>

<li><b>CouchDb</b> : This version of Nunaliit stores
it information in CouchDb, a schema-less database. CouchDB 2.x and 3.x currently work with Nunaliit.</li>

<li><b>ImageMagick</b> : The command-line tools from ImageMagick are called
to transform images uploaded to the atlas. ImageMagick with a version of 6.6
or better is recommended.</li>
	
<li><b>FFMpeg</b> : The command-line tools from the FFMpeg suite are used
to transform video and audio files uploaded to the atlas. FFMpeg with a
version of 0.8 or better is recommended. Also, the CODECs necessary to FFMpeg
to handle X.264 are required.</li>
</ul>
</p>

<p>Besides installed prerequisites, some platforms may require small configuration changes so that the framework will function properly:
<ul>
	<li><b>File Magic Fix</b> : The file command tool is used to determine the type of
	files uploaded to the atlas. However, some files are not recognized appropriately
	without applying a fix to the magic file.</li>
</ul>
</p>
<p>
If you run into issues, have a look at the Ubuntu-specific instructions above as they may help clarify things.
</p>

<!-- ****************************************************************************** -->
<h2><a name="obtaining">Obtaining Nunaliit</a></h2>
<p>Once you have the prerequisites installed, it is time to get Nunaliit installed.</p>
<p>Nunaliit is packaged as a zip or tar.gz file. The latest version can be downloaded from <a href="http://nunaliit.org">nunaliit.org</a></p>

<!-- ****************************************************************************** -->
<h2><a name="installing">Installing Nunaliit</a></h2>

<p>On a UNIX-like installation such as Ubuntu, uncompress the installation file in a suitable location for applications and add its bin folder to your path. e.g:</p>
<pre>
cd /usr/local
tar -zxvf nunaliit_VERSION_DATE_BUILD.tar.gz
chmod -R o+r,o+x nunaliit_VERSION_DATE_BUILD
export PATH=$PATH:/usr/local/nunaliit_VERSION_DATE_BUILD/bin
</pre>

<!-- ****************************************************************************** -->
<p>Once installed, return to the [[Nunaliit Documentation for Atlas Builders]] to get started.</p>