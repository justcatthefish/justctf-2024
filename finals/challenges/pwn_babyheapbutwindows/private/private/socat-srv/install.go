package main

import (
	"golang.org/x/sys/windows/svc/mgr"
	"log"
)

const (
	serviceName        = "NotePwn"
	serviceDisplayName = "NotePwn Service"
	serviceExePath     = `C:\chall\socat-srv.exe`
)

var (
	serviceExecParams = []string{"-timeout", "0", "-port", "1337", "-exec", "C:\\chall\\note.exe"}
)

func installService() error {
	instance, err := mgr.Connect()
	if err != nil {
		log.Fatalf("Failed to connect to service manager: %v", err)
	}
	defer instance.Disconnect()

	if _, err := instance.OpenService(serviceName); err == nil {
		log.Println("Service already exists.")
		return nil
	}

	cfg := mgr.Config{
		//ServiceType:  uint32
		StartType:    mgr.StartAutomatic,
		ErrorControl: mgr.ErrorCritical,
		//BinaryPathName:   string // fully qualified path to the service binary file, can also include arguments for an auto-start service
		//ServiceStartName: string // name of the account under which the service should run
		DisplayName: serviceDisplayName,
	}
	serviceInstance, err := instance.CreateService(serviceName, serviceExePath, cfg, serviceExecParams...)
	if err != nil {
		log.Fatalf("Failed to create service: %v", err)
	}
	_ = serviceInstance

	log.Printf("Service %s created successfully.", serviceName)
	return nil
}
