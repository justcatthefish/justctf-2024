use std::net::TcpStream;
use std::io::{Read, Write};
use std::str::from_utf8;
use std::{error::Error, fs};
use std::env;

/// the list of parameters that will be passed to the `solution::solve` function
const PARAMS_LIST: [(u8, u8); 3] = [
    /*
     * TODO: write list of params below
     * (3, 0),
     * (2, 1),
     */
    (2, 1),         // coin0: Coin<SOLUTION>
    (3, 0),         // coin1: Coin<SHADOW_COIN>,
    (1, 1),         // vault: &mut OtterBayCouncilVault,
];

fn prepare_params(params: Vec<(u8, u8)>) -> Vec<u8> {
    let mut serialized_params = Vec::with_capacity(params.len() * 2);
    for (x, y) in params {
        serialized_params.push(x);
        serialized_params.push(y);
    }
    serialized_params
}

fn send_after(stream: &mut TcpStream, expected: &str, data: Vec<u8>) -> Result<(), Box<dyn Error>> {
    let mut server_input = [0_u8; 200];
    loop {
        let _ = stream.read(&mut server_input);
        match from_utf8(&server_input) {
            Ok(content) => {
                if content.trim_end_matches("\0") == expected {
                    break
                }
            },
            Err(_) => {
                println!("[CLIENT] unexpected message: {:?}", server_input);
            }
        }
    }
    stream.write_all(if data.is_empty() { &[0] } else { &data })?;
    stream.flush()?;
    Ok(())
}

fn main() -> Result<(), Box<dyn Error>> {

    let host = env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = env::var("PORT").unwrap_or_else(|_| "31337".to_string());

    match TcpStream::connect(format!("{}:{}", host, port)) {
        Ok(mut stream) => {
            println!("  - Connected!");

            let mod_data : Vec<u8> =
                fs::read("./solve/build/solution/bytecode_modules/solution.mv").unwrap();
            println!("  - Loaded solution!");

            let _ = send_after(&mut stream, "[SERVER] solution:", mod_data);
            println!("  - Sent solution!");

            let params = prepare_params(PARAMS_LIST.to_vec());
            let _ = send_after(&mut stream, "[SERVER] arguments:", params.to_vec());
            println!("  - Sent parameters list!");

            let mut return_data = [0_u8; 200];
            match stream.read(&mut return_data) {
                Ok(_) => {
                    // Get module address
                    println!("  - Connection Output: '{}'", from_utf8(&return_data).unwrap());
                    match stream.read(&mut return_data) {
                        Ok(_) => {
                            // Get module address
                            println!("  - Connection Output: '{}'", from_utf8(&return_data).unwrap());
                            let mut flag = [0_u8; 200]; 
                            match stream.read(&mut flag) {
                                Ok(_) => {
                                    // Get flag
                                    println!("  - Connection Output: '{}'", from_utf8(&flag).unwrap());
                                },
                                Err(e) => { println!("  - Failed to receive data: {}", e); }
                            }
                        },
                        Err(e) => { println!("  - Failed to receive data: {}", e); }
                    }
                },
                Err(e) => { println!("  - Failed to connect: {}", e); }
            }
        },
        Err(e) => { println!("  - Failed to connect: {}", e); }
    }
    println!("  - Terminated.");

    Ok(())
}
