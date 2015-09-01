#!/usr/bin/perl

use Data::Dumper;

my %dict;

print STDERR qq|Accumulate _loc() strings\n|;
Capture_loc(\%dict);

print STDERR qq|Accumulate n2s_localize strings\n|;
Capture_localized(\%dict);

print STDERR qq|Load translation files\n|;
Load_Translations(\%dict);

print STDERR qq|Report\n|;

#print Dumper(\%dict);
#exit 0;

# Figure out available languages
my %languages;
foreach $key (keys %dict)
{
    my %translations = %{$dict{$key}->{"translations"}};
	foreach $lang (keys %translations)
	{
		$languages{$lang} = 1;
	}
}

foreach $lang (keys %languages)
{
	print STDERR qq|// Language: $lang\n|;
	my $count = 0;
	foreach $engString (sort {$a cmp $b} keys %dict)
	{
		my $translation = $dict{$engString}->{"translations"}->{$lang};

		if( $count > 0 )
		{
			print qq|,|;
		}
		
		print qq|"$engString":"$translation"|;

		print qq|\n|;

		if( !defined $dict{$engString}->{"found"} )
		{
			print qq|//no longer in use: "$engString"\n|;
		}

		
		$count++;
	}

	print qq|\n|;
}


#
# Scans all the files for the pattern "_loc(.*)"
# and adds all the strings to be localized to the
# hash given in argument.
#
sub Capture_loc
{
	my ($dictRef) = @_;
	
	my $cmd = qq|grep -R "_loc\s*(" *|;    
	my @output = `$cmd`;    
	chomp @output;
	
	foreach my $line (@output) {
		if( $line =~ m/(nunaliit2[^\/]*\.js):/ ) {
			# ignore the geenrated files such as nunaliit2.js and nunaliit2-couch.js
			my $fileName = $1;
			#print STDERR qq|Skip *** $fileName\n|;
		
		} elsif(( $line =~ m/(SchemaAttribute\.java):/ ) ) {
			# ignore the file SchemaAttribute.java
			my $fileName = $1;
			#print STDERR qq|Skip *** $fileName\n|;
		
		} elsif(( $line =~ m/^.\/dump.*/ ) ) {
			# ignore files in dump directory
			my $fileName = $1;
			#print STDERR qq|Skip *** $fileName\n|;
		
		} elsif(( $line =~ m/^.\/upgrade.*/ ) ) {
			# ignore files in upgrade directory
			my $fileName = $1;
			#print STDERR qq|Skip *** $fileName\n|;
		
		} elsif(( $line =~ m/^.\/logs.*/ ) ) {
			# ignore files in logs directory
			my $fileName = $1;
			#print STDERR qq|Skip *** $fileName\n|;
		
		} else {
			if( $line =~ m/_loc\s*\(\s*'([^']*?)'\s*\)/ ) {
				my $str = EscapeString($1);
				$dictRef->{$str}->{"found"} = 1;
				#print qq|$str\n|;
			}
			
			if( $line =~ m/_loc\s*\(\s*'([^']*?)'\s*,/ ) {
				my $str = EscapeString($1);
				$dictRef->{$str}->{"found"} = 1;
				#print qq|$str\n|;
			}
			
			if( $line =~ m/_loc\s*\(\s*"([^"]*?)"\s*\)/ ) {
				my $str = EscapeString($1);
				$dictRef->{$str}->{"found"} = 1;
				#print qq|$str\n|;
			}
			
			if( $line =~ m/_loc\s*\(\s*"([^"]*?)"\s*,/ ) {
				my $str = EscapeString($1);
				$dictRef->{$str}->{"found"} = 1;
				#print qq|$str\n|;
			}
		}
	}
}

#
# Scans all the files for the pattern "n2s_localize"
# and adds all the strings to be localized to the
# hash given in argument.
#
sub Capture_localized
{
	my ($dictRef) = @_;

	my $cmd = qq|grep -R -E 'n2s?_localize[ "]' *|;    
	my @output = `$cmd`;    
	chomp @output;
	
	foreach my $line (@output) {
		if( $line =~ m/(nunaliit2[^\/]*\.js):/ ) {
			# ignore the geenrated files such as nunaliit2.js and nunaliit2-couch.js
			my $fileName = $1;
			#print STDERR qq|Skip *** $fileName\n|;
		
		} elsif(( $line =~ m/(SchemaAttribute\.java):/ ) ) {
			# ignore the file SchemaAttribute.java
			my $fileName = $1;
			#print STDERR qq|Skip *** $fileName\n|;
		
		} elsif(( $line =~ m/^.\/dump.*/ ) ) {
			# ignore files in dump directory
			my $fileName = $1;
			#print STDERR qq|Skip *** $fileName\n|;
		
		} elsif(( $line =~ m/^.\/upgrade.*/ ) ) {
			# ignore files in upgrade directory
			my $fileName = $1;
			#print STDERR qq|Skip *** $fileName\n|;
		
		} elsif(( $line =~ m/^.\/logs.*/ ) ) {
			# ignore files in logs directory
			my $fileName = $1;
			#print STDERR qq|Skip *** $fileName\n|;
		
		} else {
			if( $line =~ m/n2s?_localize[^>]*>([^<]*)</ ) {
				my $str = EscapeString($1);
				$dictRef->{$str}->{"found"} = 1;
			}
		}
	}
}

sub Load_Translations
{
	my ($dictRef) = @_;

	# Find translation files in nunaliit2 project
	my $cmd = qq|find ./nunaliit2-js -name nunaliit2.??.js|;    
		
	my @output = `$cmd`;    
	chomp @output;
	
	foreach my $line (@output) {
		if( $line =~ m/\/nunaliit2-js\/src\/main\/js\/nunaliit2\// ){
			if( $line =~ m/nunaliit2\.([a-zA-Z][a-zA-Z])\.js\s*$/ ) {
				my $file = $line;
				my $lang = $1;
				Load_TranslationFile($file, $lang, $dictRef);
			}
		}
	}

	# Find translation files in atlas directory
	my $cmd = qq|find . -name nunaliit_lang.??.js|;    
		
	my @output = `$cmd`;    
	chomp @output;
	
	foreach my $line (@output) {
		if( $line =~ m/\.\/htdocs\/nunaliit_lang/ ){
			if( $line =~ m/nunaliit_lang\.([a-zA-Z][a-zA-Z])\.js\s*$/ ) {
				my $file = $line;
				my $lang = $1;
				Load_TranslationFile($file, $lang, $dictRef);
			}
		}
	}
}


sub Load_TranslationFile
{
	my ($file, $lang, $dictRef) = @_;

	print STDERR qq|Load translations ($lang): $file\n|;

	open FILE, "<$file" or die $!;

	while (my $line = <FILE>)
	{
		if( $line =~ m/^\s*,?"(.*)":"(.*)"\s*$/ ) {
			my $engString = $1;
			my $translation = $2;
			
			if( !defined $dictRef->{$engString} )
			{
				$dictRef->{$engString} = {};
			}
			
			$dictRef->{$engString}->{"translations"}->{$lang} = $translation;
		}
	}

	close(FILE);
}

# Convert the characters found in a string with escaped version
sub EscapeString
{
	my ($str) = @_;

	$str =~ s/"/\\"/g;

	return $str;
}
