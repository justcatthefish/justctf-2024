package main

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"net/http/httputil"
	"os"
	"strings"
	"time"
)

type TrustedBlindingReverseProxy struct {
	rp *httputil.ReverseProxy
}

type TrustedBlindingRequest struct {
	Email    string `json:"email,omitempty"`
	Password string `json:"password,omitempty"`

	OidcUser string `json:"oidcUser,omitempty"`
	OidcKey  string `json:"oidcKey,omitempty"`

	Poem           string `json:"poem,omitempty"`
	RsaVariant     string `json:"rsaVariant,omitempty"`
	Type           string `json:"type,omitempty"`
	BlindSignature string `json:"blindSignature,omitempty"`
}

func validate(req *http.Request) bool {
	// forbid remote access to /admin
	if strings.Contains(req.URL.Path, "admin") || strings.Contains(strings.ToLower(req.URL.Path), "admin") {
		log.Println("admin path")
		return false
	}

	bodyBytes, _ := io.ReadAll(req.Body)
	req.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	if len(bytes.Trim(bodyBytes, " \r\n")) == 0 {
		return true
	}

	// stop mathematicians
	const forbiddenChars = "0123456789"
	if bytes.Contains(bodyBytes, []byte("type")) || strings.Contains(req.URL.Path, "api/blind/init") {
		if bytes.ContainsAny(bodyBytes, forbiddenChars) {
			log.Println("math chars", bodyBytes)
			return false
		}
	}

	// stop other adversaries
	var data TrustedBlindingRequest
	if err := json.Unmarshal(bodyBytes, &data); err != nil {
		log.Println("cannot unmarshall")
		return false
	}

	if strings.ContainsAny(data.Poem, "{#$}") {
		log.Println("special chars")
		return false
	}

	return true
}

func (p *TrustedBlindingReverseProxy) ServeHTTP(rw http.ResponseWriter, req *http.Request) {
	if !validate(req) {
		rw.WriteHeader(http.StatusForbidden)
		rw.Write([]byte("FORBIDDEN"))
		return
	}

	p.rp.ServeHTTP(rw, req)
}

func director(req *http.Request) {
	host := os.Getenv("BACKEND_ADDR")
	if host == "" {
		host = "localhost:9000"
	}
	req.URL.Scheme = "http"
	req.URL.Host = host
	req.Host = host

	req.Header.Del("Forwarded")
	req.Header.Del("X-Forwarded-For")
	req.Header.Del("X-Forwarded-Host")
	req.Header.Del("X-Forwarded-Proto")

	req.Header["Trusted-Blinding-Proxy-Key"] = []string{os.Getenv("REV_PROXY_SECRET")}
}

func main() {
	cert, err := GenX509KeyPair()
	if err != nil {
		log.Fatalln(err)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}
	server := &http.Server{
		Addr: "0.0.0.0:" + port,
		TLSConfig: &tls.Config{
			Certificates: []tls.Certificate{cert},
		},
		Handler: &TrustedBlindingReverseProxy{
			&httputil.ReverseProxy{
				Director: director,
			},
		},
		ReadTimeout:       3 * time.Second,
		ReadHeaderTimeout: 3 * time.Second,
		WriteTimeout:      2 * time.Second,
	}

	if err := server.ListenAndServeTLS("", ""); err != nil {
		log.Fatalln("Cannot start server")
	}
}
