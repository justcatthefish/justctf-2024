#!/bin/bash
set -e

# Generate a new secret key
export SECRET_KEY_BASE=$(rails secret)

# Precompile assets if they are not already precompiled
if [ ! -f /rails/public/assets/manifest.yml ]; then
  bundle exec rake assets:precompile
fi

# Start the Rails server
exec "$@"