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

		if( !defined $dict{$engString}->{"found"} )
		{
			print qq| // no longer used|;
		}

		print qq|\n|;
		
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
	
	my $cmd = qq|grep -R "_loc([^)]*)" *|;    
	my @output = `$cmd`;    
	chomp @output;
	
	foreach my $line (@output) {
		if( $line =~ m/_loc\s*\(\s*'([^']*?)'\s*\)/ ) {
			$dictRef->{$1}->{"found"} = 1;
			#print qq|$1\n|;
		}
		
		if( $line =~ m/_loc\s*\(\s*'([^']*?)'\s*,/ ) {
			$dictRef->{$1}->{"found"} = 1;
			#print qq|$1\n|;
		}
		
		if( $line =~ m/_loc\s*\(\s*"([^"]*?)"\s*\)/ ) {
			$dictRef->{$1}->{"found"} = 1;
			#print qq|$1\n|;
		}
		
		if( $line =~ m/_loc\s*\(\s*"([^"]*?)"\s*,/ ) {
			$dictRef->{$1}->{"found"} = 1;
			#print qq|$1\n|;
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

	my $cmd = qq|grep -R -E "n2s?_localize" *|;    
	my @output = `$cmd`;    
	chomp @output;
	
	foreach my $line (@output) {
		if( $line =~ m/n2s?_localize[^>]*>([^<]*)</ ) {
			$dictRef->{$1}->{"found"} = 1;
		}
	}
}

sub Load_Translations
{
	my ($dictRef) = @_;

	# Find translation files
	my $cmd = qq|find . -name nunaliit2.??.js|;    
		
	my @output = `$cmd`;    
	chomp @output;
	
	foreach my $line (@output) {
		if( $line =~ m/nunaliit2\.([a-zA-Z][a-zA-Z])\.js\s*$/ ) {
			my $file = $line;
			my $lang = $1;
			Load_TranslationFile($file, $lang, $dictRef);
		}
	}
}


sub Load_TranslationFile
{
	my ($file, $lang, $dictRef) = @_;

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