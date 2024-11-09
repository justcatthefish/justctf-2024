package main

import (
	"fmt"
	"math"
	"strings"
)

func hexlifyNumber(n int) string {
	if n < 16 {
		return fmt.Sprintf("0%x", n)
	}
	return fmt.Sprintf("%x", n)
}

func unhexlifyNumber(s string) int {
	var n int
	fmt.Sscanf(s, "%x", &n)
	return n
}

// func randint(min, max int) int {
// 	return min + rand.Intn(max-min)
// }

func validateFirstPart(part string) bool {
	for i := 0; i < 9; i += 3 {
		part := part[i : i+3]
		n := unhexlifyNumber(part)
		if n < 622 || n > 798 {
			return false
		}
	}
	return true
}

func validateSecondPart(part string) bool {
	for i := 0; i < 20; i += 2 {
		part := part[i : i+2]
		n := unhexlifyNumber(part)
		if n < 0 || n > 255 {
			return false
		}
	}
	return true
}

func validateThirdPart(part string) bool {
	part = part[2:5]
	return part == "CTF"
}

func getFourthPartKey() string {
	var a, b, c, d, e int
	a = 500
	for i := 0; i < 500-122; i++ { // 7a
		a -= 1
	}
	bf := float64((27.0 * 3.0) + 1.0) // 1b
	for i := 0; i < 3; i++ {
		if i == 0 {
			bf -= 1.0
		}
		if i%2 == 0 {
			bf = bf / 3.0
		}
	}
	b = int(bf * 3.0)
	cf := ((94 ^ 19) * 1000) - (0xfff & 0x1f) // 5e
	cfs := (cf + (0xfff & 0x1f))
	cfd := (cfs) / 1000
	c = cfd ^ 19
	fmt.Println(c)
	dd := 25 * 0x19 * 0x19 // 19
	d = int(math.Pow(float64(dd), 1.0/3.0))
	ef := math.Sqrt(70.0 / 500) // 46
	e = int(math.Pow(ef, 2.0) * 500)
	return hexlifyNumber(a) + hexlifyNumber(b) + hexlifyNumber(c) + hexlifyNumber(d) + hexlifyNumber(e)

}

func validateFourthPart(part string, licenseLen int) bool {
	// 7a1b5e1946
	key := getFourthPartKey()
	for i := 0; i < int(len(part)/2); i += 2 {
		key := key[i : i+2]
		keyNum := unhexlifyNumber(key)
		partHex := part[i : i+2]
		partNum := unhexlifyNumber(partHex)
		if (partNum ^ licenseLen) != keyNum {
			return false
		}
	}
	return true
}
func validateFifthPart(part string) bool {
	return part == "1d"
}

func validateLicenseKey(licenseKey string) bool {
	parts := strings.Split(licenseKey, "-")
	if len(parts) != 5 {
		return false
	}
	if !validateFirstPart(parts[0]) {
		return false
	}
	if !validateSecondPart(parts[1]) {
		return false
	}
	if !validateThirdPart(parts[2]) {
		return false
	}
	if !validateFourthPart(parts[3], 0x28) {
		return false
	}
	if !validateFifthPart(parts[4]) {
		return false
	}

	return true
}

// func firstPart() string {
// 	var part string
// 	for i := 0; i < 3; i++ {
// 		part += hexlifyNumber(randint(622, 798))
// 	}
// 	return part
// }

// func secondPart() string {
// 	var part string
// 	for i := 0; i < 10; i++ {
// 		part += hexlifyNumber(randint(0, 255))
// 	}
// 	return part
// }

// func thirdPart() string {
// 	return "0JCTF115"
// }

// func fourthPath() string {
// 	return "523376316e"
// }

// func fifthPart() string {
// 	return hexlifyNumber(0x1d)
// }

// func createLicenseKey() string {
// 	// flag := "justCTF{R3v1nG_4T_1t5_f1n3sT}"
// 	license := ""
// 	license += firstPart() + "-"
// 	license += secondPart() + "-"
// 	license += thirdPart() + "-"
// 	license += fourthPath() + "-"
// 	license += fifthPart()
// 	return license
// }
