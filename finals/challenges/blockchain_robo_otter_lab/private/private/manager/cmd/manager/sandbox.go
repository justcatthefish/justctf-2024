package main

import (
	"os/exec"
	"strconv"
)

func CreateSandbox(userToken string, port int) error {
	cmd := exec.Command("/tmp/create_sandbox.sh", userToken, strconv.Itoa(port))
	out, err := cmd.CombinedOutput()
	if err != nil {
		Log.WithField("out", string(out)).WithError(err).Warning("err CreateSandbox")
		return err
	}
	return nil
}

func DestroySandbox(userToken string) error {
	cmd := exec.Command("/tmp/destroy_sandbox.sh", userToken)
	out, err := cmd.CombinedOutput()
	if err != nil {
		Log.WithField("out", string(out)).WithError(err).Warning("err DestroySandbox")
		return err
	}
	return nil
}

func CleanAllSandbox() error {
	cmd := exec.Command("/tmp/clean_all_sandbox.sh")
	out, err := cmd.CombinedOutput()
	if err != nil {
		Log.WithField("out", string(out)).WithError(err).Warning("err CleanAllSandbox")
		return err
	}
	return nil
}
