package main

import (
	"context"
	"fmt"
	"io"
	"net"
	"os/exec"
	"syscall"
	"time"
)

const (
	port        = ":1337"
	timeout      = 30 * time.Minute
)
var (
	commands      = []string{"/vm/result/bin/run"}
)

func handleConnection(conn net.Conn) {
	defer conn.Close()
	conn.SetDeadline(time.Now().Add(timeout))
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	// Start the process
	cmd := exec.CommandContext(ctx, commands[0], commands[1:]...)
	cmd.Dir = "/tmp/"
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Setpgid:   true,
		Pdeathsig: syscall.SIGTERM,
	}
	cmd.Cancel = func() error {
		return syscall.Kill(-cmd.Process.Pid, syscall.SIGTERM)
	}
	cmd.WaitDelay = time.Second * 1

	// Set up the stdout and stderr redirection
	stdoutPipe, err := cmd.StdoutPipe()
	if err != nil {
		fmt.Fprintln(conn, "error1:", err)
		return
	}
	cmd.Stderr = cmd.Stdout // Redirect stderr to stdout

	stdinPipe, err := cmd.StdinPipe()
	if err != nil {
		fmt.Fprintln(conn, "error2:", err)
		return
	}

	// Start the process
	if err := cmd.Start(); err != nil {
		fmt.Fprintln(conn, "error3:", err)
		return
	}

	done := make(chan struct{}, 2)
	go func() {
		io.Copy(conn, stdoutPipe)
		done <- struct{}{}
	}()
	go func() {
		io.Copy(stdinPipe, conn)
		done <- struct{}{}
	}()
	<-done
}

func main() {
	// Listen on TCP port 1337
	ln, err := net.Listen("tcp", port)
	if err != nil {
		fmt.Println("Error starting TCP listener:", err)
		return
	}
	defer ln.Close()

	fmt.Println("Listening on port", port)
	for {
		conn, err := ln.Accept()
		if err != nil {
			fmt.Println("Error accepting connection:", err)
			continue
		}
		go handleConnection(conn)
	}
}
