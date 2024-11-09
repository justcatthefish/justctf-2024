package main

import (
	"context"
	"errors"
	"strings"

	"github.com/sirupsen/logrus"
	"golang.org/x/sys/windows/svc/eventlog"
)

type WindowsEventLogHook struct {
	Formatter logrus.Formatter
	WinLog    *eventlog.Log
	LogLevel  logrus.Level

	closeFunc func() error
}

func (hook *WindowsEventLogHook) Fire(entry *logrus.Entry) error {
	line, err := hook.Formatter.Format(entry)
	if err != nil {
		return err
	}

	switch entry.Level {
	case logrus.DebugLevel, logrus.InfoLevel, logrus.TraceLevel:
		return hook.WinLog.Info(0, string(line))
	case logrus.WarnLevel:
		return hook.WinLog.Warning(0, string(line))
	case logrus.ErrorLevel, logrus.FatalLevel, logrus.PanicLevel:
		return hook.WinLog.Error(0, string(line))
	}
	return errors.New("unknown level")
}

func (hook *WindowsEventLogHook) Levels() []logrus.Level {
	var levels []logrus.Level
	for _, level := range logrus.AllLevels {
		if level <= hook.LogLevel {
			levels = append(levels, level)
		}
	}
	return levels
}

func (hook *WindowsEventLogHook) Close(ctx context.Context) error {
	return hook.closeFunc()
}

func NewHook(serviceName string, logLevel logrus.Level) (*WindowsEventLogHook, error) {
	isService := IsWindowsService()
	if !isService {
		return nil, nil
	}

	err := eventlog.InstallAsEventCreate(serviceName, eventlog.Info|eventlog.Warning|eventlog.Error)
	if err != nil && !strings.Contains(err.Error(), "registry key already exists") {
		return nil, err
	}

	logWin, err := eventlog.Open(serviceName)
	if err != nil {
		return nil, err
	}

	return &WindowsEventLogHook{
		Formatter: &logrus.JSONFormatter{},
		WinLog:    logWin,
		LogLevel:  logLevel,
		closeFunc: logWin.Close,
	}, nil
}
