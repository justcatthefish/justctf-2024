class AvatarsController < ApplicationController

  def show
    @images = [
      "hacker.jpg",
      "bot.jpg",
      "basement.jpg",
      "center.jpg",
      "vision.jpg",
    ]
  end

  def serve
    # Make a request to the njs script to validate the image
    image_url = url_for(request.query_parameters.merge(controller: 'avatars', action: 'get', host: 'justcattheimages.s3.eu-central-1.amazonaws.com', subdomain: false, domain: 'justcattheimages.s3.eu-central-1.amazonaws.com', protocol: 'http', only_path: false, port: 80))
    image = HTTParty.get("http://nginx:8000/fetch?url=#{image_url}")
    send_data image, type: 'image/jpeg', disposition: 'inline'
  end

  def get

  end
end
