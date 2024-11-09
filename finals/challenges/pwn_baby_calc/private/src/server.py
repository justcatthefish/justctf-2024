import re
from string import ascii_letters, punctuation
from itertools import chain

def calculate(expression):
    sanitized_expression = sanitize_input(expression)
    
    if not sanitized_expression:
        return "Invalid expression. Allowed characters: numbers and basic operators."

    print("Calculating: ", sanitized_expression)
    try:
        result = eval(sanitized_expression)
        return result
    except Exception as e:
        return f"Error: {e}"

def sanitize_input(expression):
    dangerous_chars = (ascii_letters + punctuation).translate(str.maketrans("", "", "+-*/%=<>!()"))
    dangerous_chars += ''.join([chr(x) for x in chain(range(1, 32), range(127, 255))])

    if any(char in expression for char in dangerous_chars):
        return None

    # Handle the ** operator first to avoid splitting it
    expression = re.sub(r'(\d)(\*\*)', r'\1 ** ', expression)  # Add space after a digit before **
    expression = re.sub(r'(\*\*)(\d)', r'** \2', expression)   # Add space before a digit after **

    # Now handle the single operators +, -, *, /
    expression = re.sub(r'(\d)([+\-*/])', r'\1 \2 ', expression)  # Add space after a digit before an operator
    expression = re.sub(r'([+\-*/])(\d)', r'\1 \2', expression)   # Add space before a digit after an operator
    
    return expression

def main():
    print("Welcome to the Weak Math Calculation Service!")
    print("Enter expressions like '2+2' or '5*3'. Be careful, programmers are obsolete!")
    print("Everything can be done with LLMs.")

    while True:
        try:
            # Taking user input from stdin
            expression = input("Enter your math expression: ").strip()

            if not expression:
                print("No expression provided. Exiting.")
                break

            result = calculate(expression)

            print(f"Result: {result}")
        
        except (KeyboardInterrupt, EOFError):
            print("\nExiting...")
            break

if __name__ == "__main__":
    main()

