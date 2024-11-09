package main

import (
	"context"
	"github.com/sirupsen/logrus"
	"os"
	"time"
)

func GetLogLevel() logrus.Level {
	r := os.Getenv("LOG_LEVEL")
	if len(r) == 0 {
		return logrus.InfoLevel
	}
	l, err := logrus.ParseLevel(r)
	if err != nil {
		logrus.WithError(err).Warning("invalid env LOG_LEVEL")
		return logrus.InfoLevel
	}
	return l
}

func InitLog(closeTimeout time.Duration) (main *logrus.Logger, flushLogs func()) {
	main = logrus.StandardLogger()
	main.SetLevel(GetLogLevel())

	if closeTimeout == 0 {
		closeTimeout = time.Second * 1
	}

	flushLogs = func() {
		for _, hooks := range main.Hooks {
			for _, hook := range hooks {
				ctx, cancel := context.WithTimeout(context.Background(), closeTimeout)

				if hookh, ok := hook.(interface {
					Close(ctx context.Context) error
				}); ok {
					hookh.Close(ctx)
				}
				cancel()
			}
		}
	}
	return main, flushLogs
}
