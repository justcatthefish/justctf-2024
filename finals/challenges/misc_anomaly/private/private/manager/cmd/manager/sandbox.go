package main

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"os/exec"
	"time"
	"crypto/rand"
	"encoding/base64"
)

func CreateSandbox(userData UserData) error {
	cmd := exec.Command("/tmp/create_sandbox.sh", userData.Token, userData.TargetURL.Port())
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

func DestroySandboxOnExpire(db *db, userToken string) {
	for {
		userData, err := db.GetSandboxByToken(userToken)
		if err != nil || (-1*time.Since(userData.ExpireAt).Seconds()) < 0 {
			DestroySandbox(userToken)
			db.DeleteSandbox(userToken)
			break
		}
		time.Sleep((-1 * time.Since(userData.ExpireAt)) + time.Second)
	}
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

const SandboxExpired = `sandbox expired or not exists`

const StampNotValid = `
Provided stamp was not valid!<br>
Try again: <a href="/">link</a>
`

const InternalError = `
An internal error has occured, ask an admin what happenen!<br>
Try again: <a href="/">link</a>
`

const NoFreeCpuError = `
There was an error! Please try again!<br>
Try again: <a href="/">link</a>
`

const FormGet1 = `
Access to this challenge is rate limited via hashcash.<br>
<br>
Please use the following command to solve the Proof of Work: <br>
%s<br>
<br>
<form method="post" action="/">
<label>PoW:</label>
<input name="stamp" type="text" value="" style="width: 200px;" placeholder="eg. 1:25:191204:yehspcop::hiATMGBMcicFX6Pt:000000000kwmP">
<button type="submit">Send PoW</button>
</form>
<br>
<span>* only hashcash v1 supported</span>
`

const FormGet2 = `
You already have a sandbox at %s.<br>
You need wait %d seconds to be able create new sandbox.
`

const FormCreated = `
We created separate sandbox instance for you.<br>
Sandbox should be available up to 1min<br>
<br>
Here is your instance: %s<br>
Sandbox will be available to you until: %s<br>
`


func generateNonce() string {
	nonceBytes := make([]byte, 32)
	_, err := rand.Read(nonceBytes)
	if err != nil {
		return ""
	}

	return base64.URLEncoding.EncodeToString(nonceBytes)
}

func getIP(r *http.Request, w http.ResponseWriter) string {

	//ip, _, err := net.SplitHostPort(r.RemoteAddr)
	cookie, err := r.Cookie("nonce")
	if err != nil {
		nonce := generateNonce()
		cookie2 := http.Cookie{
        		Name:     "nonce",
		        Value:    nonce,
		        Path:     "/",
		        MaxAge:   3600,
		        HttpOnly: true,
		        Secure:   false,
        		SameSite: http.SameSiteLaxMode,
		}
		http.SetCookie(w, &cookie2)
		return nonce
	}
	return cookie.Value
}

func SandboxHandler(d *db) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !(r.URL.Path == "" || r.URL.Path == "/") {
			w.WriteHeader(404)
			return
		}
		if !(r.Method == "GET" || r.Method == "POST") {
			w.WriteHeader(405)
			return
		}

		userIP := getIP(r, w)
		logger := Log.WithField("user_ip", userIP)
		logger = logger.WithField("host", r.Host)
		w.Header().Set("Content-Type", "text/html")

		if r.Method == "GET" {
			userData, err := d.GetUserByIP(userIP)
			if err == ErrUserNotExists {
				resource, err := GenerateRandomLowercaseAscii(8)
				if err != nil {
					logger.WithError(err).Error("get GenerateRandomLowercaseAscii(8)")
					w.WriteHeader(500)
					fmt.Fprintf(w, InternalError)
					return
				}

				userData = UserData{
					UserIP:      userIP,
					OneTimeHash: resource,
					Token:       "",
					ExpireAt:    time.Now().Add(Config.OneTimeHashDuration),
				}
				if err := d.UpdateUser(userData); err != nil {
					logger.WithError(err).Error("get AddUser")
					w.WriteHeader(500)
					fmt.Fprintf(w, InternalError)
					return
				}
			} else if err != nil {
				logger.WithError(err).Error("get GetUser")
				w.WriteHeader(500)
				fmt.Fprintf(w, InternalError)
				return
			}

			if userData.NeedRefreshOneTimeHash() {
				resource, err := GenerateRandomLowercaseAscii(8)
				if err != nil {
					logger.WithError(err).Error("get GenerateRandomLowercaseAscii(8)")
					w.WriteHeader(500)
					fmt.Fprintf(w, InternalError)
					return
				}

				userData.Token = ""
				userData.OneTimeHash = resource
				userData.ExpireAt = time.Now().Add(Config.OneTimeHashDuration)
				if err := d.UpdateUser(userData); err != nil {
					logger.WithError(err).Error("get UpdateUser")
					w.WriteHeader(500)
					fmt.Fprintf(w, InternalError)
					return
				}
			}

			if userData.Token == "" {
				fmt.Fprintf(w, FormGet1, GetCommandProfOfWork(userData.OneTimeHash))
			} else {
				hostURL, _ := url.Parse(fmt.Sprintf("http://%s", r.Host))
				fmt.Fprintf(w, FormGet2, 
					fmt.Sprintf("%s:%s", hostURL.Hostname(), userData.TargetURL.Port()), 
					-1*int(time.Since(userData.ExpireAt).Seconds()))
			}

			return
		}

		err := r.ParseForm()
		if err != nil {
			logger.WithError(err).Error("post ParseForm")
			w.WriteHeader(500)
			fmt.Fprintf(w, InternalError)
			return
		}

		stamp := r.PostForm.Get("stamp")
		if len(stamp) == 0 {
			logger.WithError(err).Warning("empty stamp")
			w.WriteHeader(400)
			fmt.Fprintf(w, StampNotValid)
			return
		}

		userData, err := d.GetUserByIP(userIP)
		if err == ErrUserNotExists {
			logger.WithError(err).Warning("post GetUser not exists")
			w.WriteHeader(400)
			fmt.Fprintf(w, StampNotValid)
			return
		} else if err != nil {
			logger.WithError(err).Error("post GetUser err")
			w.WriteHeader(500)
			fmt.Fprintf(w, InternalError)
			return
		}

		token, err := GenerateRandomString(30)
		if err != nil {
			logger.WithError(err).Error("post GenerateRandomString(30)")
			w.WriteHeader(500)
			fmt.Fprintf(w, InternalError)
			return
		}
		userData.Token = token

		valid, err := CheckProofOfWork(stamp, userData.OneTimeHash)
		if err != nil {
			logger.WithError(err).Error("err CheckProofOfWork")
			w.WriteHeader(400)
			fmt.Fprintf(w, StampNotValid)
			return
		}
		if !valid {
			logger.WithError(err).Warning("not valid CheckProofOfWork")
			w.WriteHeader(400)
			fmt.Fprintf(w, StampNotValid)
			return
		}

		// get cpu
		cpuFree, err := d.GetFreeCpu()
		if err == ErrNoFreeCpu {
			logger.WithError(err).Error("post GetFreeCpu")

			w.WriteHeader(400)
			fmt.Fprintf(w, NoFreeCpuError)
			return
		} else if err != nil {
			logger.WithError(err).Error("post GetFreeCpu")
			w.WriteHeader(500)
			fmt.Fprintf(w, InternalError)
			return
		}
		userData.Cpu = &cpuFree

		hostURL, _ := url.Parse(fmt.Sprintf("http://%s", r.Host))

		randomPort := 13000 + cpuFree
		userData.TargetURL, _ = url.Parse(fmt.Sprintf("http://127.0.0.1:%d", randomPort))
		userData.OneTimeHash = ""
		userData.ExpireAt = time.Now().Add(Config.SandboxNewCreation)
		if err := d.UpdateUser(userData); err != nil {
			logger.WithError(err).Error("post UpdateUser")
			w.WriteHeader(500)
			fmt.Fprintf(w, InternalError)
			return
		}
		if err := d.UpdateSandbox(userData); err != nil {
			logger.WithError(err).Error("post UpdateSandbox")
			w.WriteHeader(500)
			fmt.Fprintf(w, InternalError)
			return
		}

		fmt.Fprintf(w, FormCreated,
			fmt.Sprintf("%s:%d", hostURL.Hostname(), randomPort),
			userData.ExpireAt.Format("2006-01-02 15:04:05 -0700 MST"))

		CreateSandbox(userData)
		go DestroySandboxOnExpire(d, userData.Token)
	}
}

type redirectByHostHandler struct {
	db             *db
	handlerSandbox http.Handler
}

const ctxKeyUserData = 1

func SetCtxUserData(userData UserData) context.Context {
	ctx := context.Background()
	ctx = context.WithValue(ctx, ctxKeyUserData, userData)
	return ctx
}

func GetCtxUserData(ctx context.Context) (UserData, error) {
	u, ok := ctx.Value(ctxKeyUserData).(UserData)
	if !ok {
		return UserData{}, ErrUserNotExists
	}
	return u, nil
}

func (h *redirectByHostHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	userIP := r.RemoteAddr
	logger := Log.WithField("user_ip", userIP)
	logger = logger.WithField("uri", r.RequestURI)
	logger = logger.WithField("method", r.Method)
	logger.Info("request")

	h.handlerSandbox.ServeHTTP(w, r)
}
