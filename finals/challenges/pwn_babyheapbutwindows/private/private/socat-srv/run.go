package main

import (
	"context"
	"flag"
	"fmt"
	"github.com/sirupsen/logrus"
	"io"
	"net"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

func run(logger *logrus.Logger, ctx context.Context) error {
	// notify
	ctx, stop := signal.NotifyContext(ctx, os.Interrupt)
	defer stop()

	var args = Args{}
	// args
	{
		flagSet := flag.NewFlagSet(os.Args[0], flag.ExitOnError)

		// -install
		var tmpInstallArg bool
		flagSet.BoolVar(&tmpInstallArg, "install", false, "install service")

		// -port 1337 -timeout 10 -exec C:\chall\note.exe
		var tmpPortArg uint
		flagSet.UintVar(&tmpPortArg, "port", 1337, "listen port")
		args.Port = uint16(tmpPortArg)

		flagSet.StringVar(&args.Exec, "exec", "C:\\chall\\note.exe", "exec binary")

		var tmpTimeoutArg uint
		flagSet.UintVar(&tmpTimeoutArg, "timeout", 0, "timeout duration in seconds")
		args.Timeout = time.Duration(tmpTimeoutArg) * time.Second

		if err := flagSet.Parse(os.Args[1:]); err != nil {
			return err
		}

		if tmpInstallArg {
			return installService()
		}

		if _, err := os.Stat(args.Exec); os.IsNotExist(err) {
			return fmt.Errorf("exec binary not found")
		}
	}
	return runProxy(logger, ctx, args)
}

type Args struct {
	Port    uint16
	Exec    string
	Timeout time.Duration
}

func runProxy(logger *logrus.Logger, ctx context.Context, args Args) error {
	ln, err := net.Listen("tcp", ":"+strconv.Itoa(int(args.Port)))
	if err != nil {
		return err
	}

	chDone := make(chan bool, 1)
	defer close(chDone)
	go func() {
		select {
		case <-ctx.Done():
		case <-chDone:
		}
		ln.Close()
	}()

	logger.WithField("port", args.Port).Info("Listening on port")
	for {
		conn, err := ln.Accept()
		if err != nil && strings.Contains(err.Error(), "use of closed network connection") {
			return nil
		}
		if err != nil {
			logger.WithError(err).Error("Error accepting connection")
			continue
		}
		go handleConnection(conn, ctx, args)
	}
}

func handleConnection(conn net.Conn, ctxMaster context.Context, args Args) {
	defer conn.Close()
	var ctx context.Context
	if args.Timeout > 0 {
		conn.SetDeadline(time.Now().Add(args.Timeout))

		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctxMaster, args.Timeout)
		defer cancel()
	} else {
		var cancel context.CancelFunc
		ctx, cancel = context.WithCancel(ctxMaster)
		defer cancel()
	}

	// Start the process
	cmd := exec.CommandContext(ctx, args.Exec)
	cmd.Dir = filepath.Dir(args.Exec)

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
