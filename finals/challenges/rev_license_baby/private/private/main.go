package main

import "fmt"

func getInputFromUser() string {
	var input string
	fmt.Printf("Enter your license key: ")
	fmt.Scanln(&input)
	return input
}

func main() {
	// k := createLicenseKey()
	// fmt.Println(k)
	fmt.Println(WelcomeMessage())
	licenseKey := getInputFromUser()
	fmt.Println("Provided:", licenseKey)
	if validateLicenseKey(licenseKey) {
		fmt.Println("License key is valid!")
	} else {
		fmt.Println("License key is invalid!")
		return
	}
	for {
		fmt.Println(MenuMessage())
		var choice int
		fmt.Scanln(&choice)
		switch choice {
		case 1:
			fmt.Println("Flag: ", getFlag())
		case 2:
			var a, b int
			fmt.Println("Enter first number: ")
			fmt.Scanln(&a)
			fmt.Println("Enter second number: ")
			fmt.Scanln(&b)
			fmt.Println("Result: ", multiply(a, b))
		case 3:
			continue
		case 4:
			return
		default:
			fmt.Println("Invalid choice!")
		}
	}

}
