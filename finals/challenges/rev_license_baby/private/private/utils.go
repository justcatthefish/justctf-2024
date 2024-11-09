package main

import (
	"bufio"
	"os"
)

func multiply(a int, b int) int {
	return a * b
}

func getFlag() string {
	file, err := os.Open("/flag.txt")
	if err != nil {
		return "Error: flag.txt not found. Please contact organizer for help."
	}
	defer file.Close()
	scanner := bufio.NewScanner(file)
	scanner.Scan()
	return scanner.Text()
}
