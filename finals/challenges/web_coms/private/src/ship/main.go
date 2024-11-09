package main

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
)

var flag string

func init() {
	flag = os.Getenv("FLAG")
	if flag == "" {
		panic("FLAG not found in env")
	}
}

func verifyWires(wires [][]float64) bool {
	if len(wires) != 20 {
		return false
	}
	for _, wire := range wires {
		if len(wire) != 8 {
			return false
		}
		correct := wire[0] <= wire[1] && wire[2] >= wire[3] && wire[4] <= wire[5] && wire[6] >= wire[7]
		if !correct {
			return false
		}
	}
	return true
}

func verifyShips(ships []struct {
	Ship    string `json:"ship"`
	Correct bool   `json:"correct"`
}) bool {
	for _, ship := range ships {
		if !ship.Correct {
			return false
		}
	}
	return true
}

func verifyPasscode(passcode string) bool {
	return len(passcode) > 8
}

func taskHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if r.Header.Get("Content-Type") != "application/json" {
		http.Error(w, "Content-Type must be application/json", http.StatusUnsupportedMediaType)
		return
	}
	var req struct {
		Wires [][]float64 `json:"wires"`
		Ships []struct {
			Ship    string `json:"ship"`
			Correct bool   `json:"correct"`
		} `json:"ships"`
		Passcode string `json:"passcode"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Write([]byte("Invalid request"))
		return
	}
	if !verifyWires(req.Wires) {
		w.Write([]byte("Invalid wires. Please be careful next time, the ship is now in a very bad condition!"))
		return
	}
	if !verifyShips(req.Ships) {
		w.Write([]byte("Invalid ships. Please be careful next time, the ship is now in a very bad condition!"))
		return
	}
	if !verifyPasscode(req.Passcode) {
		w.Write([]byte("Invalid passcode. Please be careful next time, the ship is now in a very bad condition!"))
		return
	}
	w.Write([]byte("The ship is now fixed! Thank you for your efforts. Here is your flag: " + flag))
}

func main() {
	slog.Info("The ship has too many failures! We need a crew to fix it! Quickly, grab the endpoints, fill the holes and get the flag!")
	server := &http.Server{Addr: ":80"}
	http.HandleFunc("/task", taskHandler)
	server.ListenAndServe()
}
