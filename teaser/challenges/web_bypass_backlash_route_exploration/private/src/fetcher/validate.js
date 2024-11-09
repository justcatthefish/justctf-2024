function valid_url(r) {
    // Retrieve the URL parameter from the request
    var targetUrl = r.args.url;
    r.log(targetUrl);
    return targetUrl.match(/^https?:\/\/justcattheimages\.s3\.eu-central-1\.amazonaws\.com\/img\/[a-z]+\.jpg$/m) ? "" : "Forbidden"
}

export default { valid_url };