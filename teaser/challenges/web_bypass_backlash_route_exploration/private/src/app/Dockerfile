FROM ruby:3.2.2-slim

WORKDIR /rails

RUN groupadd -r appuser && useradd -r -g appuser appuser

# Install necessary dependencies
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
    build-essential git libvips pkg-config

# Set environment variable for production
ENV RAILS_ENV production
ENV RACK_ENV production


# Copy the Gemfile and Gemfile.lock
COPY Gemfile Gemfile.lock ./

# Install gems for production
RUN bundle install --without development test && \
    rm -rf ~/.bundle/ /usr/local/bundle/ruby/*/cache /usr/local/bundle/ruby/*/bundler/gems/*/.git

# Copy the rest of the application code
COPY . .
COPY precompile.sh /usr/bin/
RUN chmod +x /usr/bin/precompile.sh

# Precompile Bootsnap cache
RUN bundle exec bootsnap precompile --gemfile

RUN chown -R appuser:appuser /rails

# Switch to the less privileged user
USER appuser

# Precompile assets for production
# RUN bundle exec rake assets:precompile

ENTRYPOINT ["precompile.sh"]

# Command to run the application
CMD ["rails", "server", "-b", "0.0.0.0"]