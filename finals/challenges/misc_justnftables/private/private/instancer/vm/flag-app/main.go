package main

import (
	"bytes"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
)

func flagHandler(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/flag" {
		http.NotFound(w, r)
		return
	}

	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	flag := "Here is your flag: " + os.Getenv("FLAG")
	fmt.Fprintln(w, flag)
}

func setupFirewall() error {
	cmd := exec.Command("nft", "-f", "-")
	cmd.Stdin = bytes.NewBuffer([]byte(`
flush ruleset
table inet stateless_firewall {
        chain PREROUTING {
                type filter hook prerouting priority raw; policy accept;
                notrack comment "disable conntrack"
        }
        chain INPUT {
                type filter hook prerouting priority filter; policy accept;
                tcp flags == syn drop comment "deny SYN traffic"
        }
}
`))
	return cmd.Run()
}

func main() {
	err := setupFirewall()
	if err != nil {
		log.Fatalln("Error setup firewall:", err)
	}

	http.HandleFunc("/flag", flagHandler)

	fmt.Println("Flag-App is listening on 192.168.0.1:8080")
	err = http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatalln("Error starting server:", err)
	}
}
