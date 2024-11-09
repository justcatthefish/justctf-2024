use strict;
use warnings;

use Dancer2;
use Template;

my @greetings = ("Hello", "Ebe", "Greetings", "Hi", "Good day");

get '/' => sub {
    my $greeting = $greetings[rand @greetings];
    template 'index' => {
        greeting => $greeting
    };
};

post '/debug' => sub {
    my $input = body_parameters->get('debug');
    my $output;

    debug "Debug: $input\n";
    
    my $template = Template->new({
        INCLUDE_PATH => './views'
    });
    $template->process(\$input, {}, \$output) or die $template->error();
    return $output;
};

start;
