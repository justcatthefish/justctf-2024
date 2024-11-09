package main

import (
	"context"
	"fmt"
	"io"
	"math/rand/v2"
	"net"
	"os/exec"
	"strconv"
	"sync"
	"syscall"
	"time"
)

const (
	port    = ":1337"
	timeout = 120 * time.Second
)

var (
	commands        = []string{"/work/run-chall.sh"}
	commandsKill    = []string{"/work/kill-chall.sh"}
	commandsKillAll = []string{"/work/kill-allchall.sh"}
)

func killCmd(RANDID string) error {
	ctxKill, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()
	cmdkill := exec.CommandContext(ctxKill, commandsKill[0], RANDID)
	cmdkill.Dir = "/tmp/"
	if err := cmdkill.Start(); err != nil {
		return err
	}
	return cmdkill.Wait()
}

func killAllCmd() error {
	ctxKill, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()
	cmdkill := exec.CommandContext(ctxKill, commandsKillAll[0])
	cmdkill.Dir = "/tmp/"
	if err := cmdkill.Start(); err != nil {
		return err
	}
	return cmdkill.Wait()
}

func handleConnection(conn net.Conn) {
	defer conn.Close()
	conn.SetDeadline(time.Now().Add(timeout))
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	RANDID := strconv.Itoa(int(rand.Int32()))

	// Start the process
	cmd := exec.CommandContext(ctx, commands[0], RANDID)
	cmd.Dir = "/tmp/"
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Setpgid:   true,
		Pdeathsig: syscall.SIGTERM,
	}
	cmd.Cancel = func() error {
		syscall.Kill(-cmd.Process.Pid, syscall.SIGTERM)
		return killCmd(RANDID)
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
	killAllCmd()

	// Listen on TCP port 1337
	ln, err := net.Listen("tcp", port)
	if err != nil {
		fmt.Println("Error starting TCP listener:", err)
		return
	}
	defer ln.Close()

	fmt.Println("Listening on port", port)
	mu := &sync.Mutex{}
	activeConn := 0
	for {
		conn, err := ln.Accept()
		if err != nil {
			fmt.Println("Error accepting connection:", err)
			continue
		}
		fmt.Println("Accepting connection:", conn.RemoteAddr().String(), "activeConn", strconv.Itoa(activeConn))
		go func() {
			mu.Lock()
			// 0,1,2,3,4,5,6
			if (activeConn + 1) > 7 { // max 7 vms concurrently
				mu.Unlock()

				fmt.Fprintln(conn, "Too many machines, please try again after 1min")
				conn.Close()
				return
			}
			activeConn += 1
			mu.Unlock()

			handleConnection(conn)

			mu.Lock()
			activeConn -= 1
			mu.Unlock()
		}()
	}
}
