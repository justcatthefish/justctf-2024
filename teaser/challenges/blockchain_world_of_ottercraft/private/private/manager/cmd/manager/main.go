package main

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"log"
	"net"
	"strings"
	"time"
)

func main() {
	CleanAllSandbox()

	// Listen on port 1337
	listener, err := net.Listen("tcp", Config.Listen)
	if err != nil {
		log.Fatalf("Failed to listen on port 31337: %v", err)
	}
	defer listener.Close()
	Log.Info("Listening on port 31337...")

	for {
		// Accept a connection
		conn, err := listener.Accept()
		if err != nil {
			Log.WithError(err).Warning("Failed to accept connection:")
			continue
		}

		// Handle the connection in a new goroutine
		go handleConnection(conn)
	}
}

func isPortReachable(host string, port int, timeout time.Duration) bool {
	address := fmt.Sprintf("%s:%d", host, port)
	conn, err := net.DialTimeout("tcp", address, timeout)
	if err != nil {
		return false
	}
	defer conn.Close()

	// Send "foo" to the server
	_, err = conn.Write([]byte("foo\n"))
	if err != nil {
		return false
	}

	// Set a read deadline
	conn.SetReadDeadline(time.Now().Add(timeout))

	// Read the response from the server
	response, err := bufio.NewReader(conn).ReadString(':')
	if err != nil {
		return false
	}

	// Check if the response matches the expected string
	expectedResponse := "[SERVER] Challenge modules published at"
	if strings.Contains(response, expectedResponse) {
		return true
	}
	return false
}

func handleConnection(conn net.Conn) {
	logger := Log.WithField("user", conn.RemoteAddr())
	logger.Info("connected")

	ctx, cancel := context.WithTimeout(context.Background(), Config.RequestTimeout)
	defer cancel()

	var outErr error
	var outErr2 error
	defer func() {
		if outErr != nil {
			Log.WithError(outErr).Error("Failed setup")
			conn.Close()
		}
	}()

	token, err := GenerateRandomLowercaseAscii(15)
	if err != nil {
		outErr = err
		return
	}
	randomPort := RandomPort()
	if err := CreateSandbox(token, randomPort); err != nil {
		outErr = err
		return
	}

	defer func() {
		DestroySandbox(token)
		conn.Close()
		logger.WithError(outErr2).Info("closed")
	}()

	ctxLower, cancel := context.WithTimeout(ctx, time.Second*20)
	defer cancel()

	for {
		isOk := isPortReachable("127.0.0.1", randomPort, time.Second*10)
		if !isOk && ctxLower.Err() != nil {
			outErr2 = ctxLower.Err()
			return
		}
		if isOk {
			break
		}
		time.Sleep(time.Millisecond * 100)
	}

	targetConn, err := net.DialTimeout("tcp", fmt.Sprintf("127.0.0.1:%d", randomPort), Config.RequestTimeout)
	if err != nil {
		outErr2 = err
		return
	}
	defer targetConn.Close()

	// Create channels to signal when copying is done
	done := make(chan struct{}, 2)

	go func() {
		select {
		case <-ctx.Done():
			targetConn.Close()
		case <-done:
		}
	}()

	// Copy data from conn to targetConn
	go func() {
		if _, err := io.Copy(targetConn, conn); err != nil {
			outErr2 = err
		}
		done <- struct{}{}
	}()

	// Copy data from targetConn to conn
	go func() {
		if _, err := io.Copy(conn, targetConn); err != nil {
			outErr2 = err
		}
		done <- struct{}{}
	}()

	<-done
}
