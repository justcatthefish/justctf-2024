package main

import (
	"context"
	"fmt"
	"time"

	"github.com/sirupsen/logrus"
	"golang.org/x/sys/windows/svc"
)

type winService struct {
	Ctx        context.Context
	MainLog    *logrus.Logger
	cancelFunc context.CancelFunc
	chClose    chan bool
}

func (m *winService) Execute(args []string, r <-chan svc.ChangeRequest, changes chan<- svc.Status) (bool, uint32) {
	m.start(changes)
loop:
	for {
		select {
		case <-m.chClose:
			break loop
		case c := <-r:
			switch c.Cmd {
			case svc.Interrogate:
				changes <- c.CurrentStatus
			case svc.Stop, svc.Shutdown:
				m.stop()
				break loop
			default:
				m.MainLog.WithField("cmd", c.Cmd).Warning("unexpected control request")
			}
		}
	}

	return false, 0
}

func (m *winService) start(changes chan<- svc.Status) {
	changes <- svc.Status{State: svc.StartPending}

	ctx, cancel := context.WithCancel(m.Ctx)
	m.cancelFunc = cancel

	go func() {
		defer func() {
			close(m.chClose)
		}()
		changes <- svc.Status{State: svc.Running, Accepts: svc.AcceptStop | svc.AcceptShutdown}
		if err := run(m.MainLog, ctx); err != nil {
			m.MainLog.WithError(err).Error("failed start run")
		}
		changes <- svc.Status{State: svc.StopPending}
	}()
}

func (m *winService) stop() {
	if m.cancelFunc != nil {
		m.cancelFunc()
	}
}

func run_srv(mainLog *logrus.Logger, ctxMaster context.Context) error {
	err := svc.Run(ServiceName, &winService{
		Ctx:     ctxMaster,
		MainLog: mainLog,
		chClose: make(chan bool),
	})
	if err != nil {
		return err
	}
	return nil
}

func IsWindowsService() bool {
	isService, err := svc.IsWindowsService()
	if err != nil {
		logrus.StandardLogger().WithError(err).Fatal("failed to determine if we are running in an Windows service")
	}
	return isService
}

const ServiceName = "NotePwn"

func main() {
	// recover panic
	defer func() {
		if err := recover(); err != nil {
			logrus.WithError(fmt.Errorf("%#v", err)).Panic("main unhandled panic")
		}
	}()

	// logger
	logger, flushLogs := InitLog(time.Second * 1)
	defer flushLogs()

	// srv logic
	isService := IsWindowsService()
	if isService {
		if hook, err := NewHook(ServiceName, GetLogLevel()); err != nil {
			logger.WithError(err).Fatal("windows log problem")
		} else if hook != nil {
			logger.AddHook(hook)
		}
	}

	var err error
	if isService {
		err = run_srv(logger, context.Background())
	} else {
		err = run(logger, context.Background())
	}
	if err != nil {
		logrus.WithError(err).Fatal()
	}
}
