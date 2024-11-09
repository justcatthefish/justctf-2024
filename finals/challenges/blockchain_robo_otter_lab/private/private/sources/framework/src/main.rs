use std::env;
use std::error::Error;
use std::fmt;
use std::io::{Read, Write};
use std::mem::drop;
use std::net::{TcpListener, TcpStream};
use std::path::Path;

use move_transactional_test_runner::{
    framework::{MaybeNamedCompiledModule, MoveTestAdapter},
    tasks::TaskInput,
};
use move_bytecode_source_map::{source_map::SourceMap, utils::source_map_from_file};
use move_binary_format::file_format::CompiledModule;
use move_symbol_pool::Symbol;
use move_core_types::{
    account_address::AccountAddress, 
    language_storage::TypeTag,
    runtime_value::MoveValue
};

use sui_ctf_framework::NumericalAddress;
use sui_transactional_test_runner::{
    args::{SuiValue, ViewObjectCommand, SuiSubcommand},
    test_adapter::{FakeID, SuiTestAdapter},
};

/// helper function used to display an object with given `FakeID`
async fn view_object(
    adapter: &mut SuiTestAdapter, 
    id: FakeID
) -> Result<String, Box<dyn Error>> {
    let arg_view = TaskInput {
        command: SuiSubcommand::ViewObject(ViewObjectCommand { id }),
        name: "view-object".to_string(),
        number: 5,
        start_line: 1,
        command_lines_stop: 1,
        stop_line: 1,
        data: None,
        task_text: "".to_string(),
    };

    match adapter.handle_subcommand(arg_view).await {
        Ok(out) => Ok(out.unwrap()),
        Err(error) => Err(error.into()),
    }
}

async fn handle_client(mut stream: TcpStream) -> Result<(), Box<dyn Error>> {

    // initialize SuiTestAdapter
    let modules = [ "robo_otter_lab" ];
    let mut deployed_modules: Vec<AccountAddress> = Vec::new();

    let named_addresses = vec![
        (
            "challenge".to_string(),
            NumericalAddress::parse_str(
                "0x0", 
            )?,
        ),
        (
            "solution".to_string(),
            NumericalAddress::parse_str(
                "0x0",
            )?,
        ),
        (
            "admin".to_string(),
            NumericalAddress::parse_str(
                "0xfccc9a421bbb13c1a66a1aa98f0ad75029ede94857779c6915b44f94068b921e",
            )?,
        ),
    ];

    let mut adapter = sui_ctf_framework::initialize(
        named_addresses,
        Some(vec![
            "dr_clawson".to_string(),
            "fixer_flippers".to_string()
        ]),
    ).await;

    let mut mncp_modules : Vec<MaybeNamedCompiledModule> = Vec::new();

    for i in 0..modules.len() {

        let module = &modules[i];

        let mod_path = format!("./chall/build/challenge/bytecode_modules/{}.mv", module);
        let src_path = format!("./chall/build/challenge/source_maps/{}.mvsm", module);
        let mod_bytes: Vec<u8> = std::fs::read(mod_path)?;

        let module: CompiledModule = match CompiledModule::deserialize_with_defaults(&mod_bytes) {
            Ok(data) => data,
            Err(e) => {
                let _ = adapter.cleanup_resources().await;
                println!("[SERVER] error: {e}");
                return Err("error during deserialization".into())
            }
        }; 
        let named_addr_opt: Option<Symbol> = Some(Symbol::from("challenge"));
        let source_map: Option<SourceMap> = match source_map_from_file(Path::new(&src_path)) {
            Ok(data) => Some(data),
            Err(e) => {
                let _ = adapter.cleanup_resources().await;
                println!("[SERVER] error: {e}");
                return Err("error during generating source map".into())
            }
        };

        let maybe_ncm = MaybeNamedCompiledModule {
            named_address: named_addr_opt,
            module,
            source_map,
        };

        mncp_modules.push( maybe_ncm );
    }

    // publish challenge module
    let chall_dependencies: Vec<String> = Vec::new();
    let chall_addr = match sui_ctf_framework::publish_compiled_module(
        &mut adapter,
        mncp_modules,
        chall_dependencies,
        Some(String::from("dr_clawson")),
    ).await {
        Some(addr) => addr,
        None => {
            stream.write_all("[SERVER] Error publishing module".as_bytes()).unwrap();
            let _ = adapter.cleanup_resources().await;
            return Ok(());
        }
    };

    deployed_modules.push(chall_addr);
    println!("[SERVER] Module published at: {:?}", chall_addr); 

    // get the solution bytes
    stream.write_all("[SERVER] solution:".as_bytes()).unwrap();
    let mut solution_data = [0_u8; 2000];
    let _ = stream.read(&mut solution_data)?;

    // get the arguments list for `solution::solve()`
    stream.write_all("[SERVER] arguments:".as_bytes()).unwrap();
    let mut serialized_arguments = [0_u8; 2000];
    let mut arguments = Vec::new();
    let bytes_read = stream.read(&mut serialized_arguments)?;
    if bytes_read >= 2 {
        for chunk in serialized_arguments[..bytes_read].chunks(2) {
            if chunk.len() == 2 {
                let param = (chunk[0], chunk[1]);
                arguments.push(param)
            } else {
                println!("[SERVER] incorrect chunk {:?}", chunk);
                return Err("error during receiving the arguments list".into())
            }
        }
    }

    // send challenge address
    let mut output = String::new();
    fmt::write(
        &mut output,
        format_args!(
            "[SERVER] Challenge modules published at: {}",
            chall_addr.to_string().as_str(),
        ),
    )
    .unwrap();
    stream.write_all(output.as_bytes()).unwrap();

    // publish solution module
    let sol_dependencies: Vec<String> = vec![ String::from("challenge") ];

    let mut mncp_solution : Vec<MaybeNamedCompiledModule> = Vec::new();
    let module: CompiledModule = match CompiledModule::deserialize_with_defaults(solution_data.as_ref()) {
        Ok(data) => data,
        Err(e) => {
            let _ = adapter.cleanup_resources().await;
            println!("[SERVER] error: {e}");
            return Err("error during deserialization".into())
        }
    }; 
    let named_addr_opt: Option<Symbol> = Some(Symbol::from("solution"));
    let source_map : Option<SourceMap> = None;
    
    let maybe_ncm = MaybeNamedCompiledModule {
        named_address: named_addr_opt,
        module,
        source_map,
    }; 
    mncp_solution.push( maybe_ncm );

    let sol_addr = match sui_ctf_framework::publish_compiled_module(
        &mut adapter,
        mncp_solution,
        sol_dependencies,
        Some(String::from("fixer_flippers")),
    ).await {
        Some(addr) => addr,
        None => {
            stream.write_all("[SERVER] Error publishing module".as_bytes()).unwrap();
            // close tcp socket
            drop(stream);
            let _ = adapter.cleanup_resources().await;
            return Ok(());
        }
    };
    println!("[SERVER] Solution published at: {:?}", sol_addr);

    // send solution address
    output = String::new();
    fmt::write(
        &mut output,
        format_args!(
            "[SERVER] Solution published at {}",
            sol_addr.to_string().as_str()
        ),
    )
    .unwrap();
    stream.write_all(output.as_bytes()).unwrap();

    /*
     * prepare function call arguments:
     *
     * public fun prepare_tools(
     *     _lab        : &RoboOtterLab,
     *     user        : address,
     *     ctx         : &mut TxContext,
     * ) {
    */
    let mut args_reg: Vec<SuiValue> = Vec::new();
    let lab = SuiValue::Object(FakeID::Enumerated(1, 2), None);
    let player_addr = SuiValue::MoveValue(MoveValue::Address(
        adapter.compiled_state().resolve_named_address("fixer_flippers"))
    );
    args_reg.push(lab.clone());         // _lab: &RoboOtterLab
    args_reg.push(player_addr.clone()); // user: address
                                        // ctx: &mut TxContext - param is added automatically

    let type_args: Vec<TypeTag> = Vec::new();

    // call `robo_otter_lab::prepare_tools` function
    let ret_val = match sui_ctf_framework::call_function(
        &mut adapter,
        chall_addr,
        "robo_otter_lab",
        "prepare_tools",
        args_reg,
        type_args,
        Some("dr_clawson".to_string()),
    ).await {
        Ok(output) => output,
        Err(e) => {
            let _ = adapter.cleanup_resources().await;
            println!("[SERVER] error: {e}");
            return Err("error during call to robo_otter_lab::prepare_tools".into())
        }
    };
    println!("[SERVER] Return value {:#?}", ret_val);
    println!();

    println!("[SERVER] dumping existing objects");
    for x in 0..5 {
        let mut y = 0;
        while let Ok(output) = view_object(&mut adapter, FakeID::Enumerated(x, y)).await {
            println!("---\nobject({}, {})", x, y);
            println!("{}", output);
            y += 1;
        }
    }

    // prepare `solution::solve` call arguments
    let mut args_solve: Vec<SuiValue> = Vec::new();

    for (x, y) in arguments {
        let obj = SuiValue::Object(FakeID::Enumerated(x.into(), y.into()), None);
        args_solve.push(obj.clone());
    }

    let type_args_solve: Vec<TypeTag> = Vec::new();

    // call `solution::solve` function
    let ret_val = match sui_ctf_framework::call_function(
        &mut adapter,
        sol_addr,
        "solution",
        "solve",
        args_solve,
        type_args_solve,
        Some("fixer_flippers".to_string()),
    ).await {
        Ok(output) => output,
        Err(e) => {
            let _ = adapter.cleanup_resources().await;
            println!("[SERVER] error: {e}");
            return Err("error during call to solution::solve".into())
        }
    };
    println!("[SERVER] Return value {:#?}", ret_val);
    println!();

    // check solution
    let robo_otter = SuiValue::Object(FakeID::Enumerated(1, 1), None);
    let args_check: Vec<SuiValue> = vec![ robo_otter ];

    let type_args_check: Vec<TypeTag> = Vec::new();

    let sol_ret = sui_ctf_framework::call_function(
        &mut adapter,
        chall_addr,
        "robo_otter_lab",
        "check_robo_otter_build",
        args_check,
        type_args_check,
        Some("fixer_flippers".to_string()),
    ).await;
    println!("[SERVER] Return value {:#?}", sol_ret);
    println!();

    // validate solution
    match sol_ret {
        Ok(_) => {
            println!("[SERVER] Correct Solution!");
            println!();
            if let Ok(flag) = env::var("FLAG") {
                let message = format!("[SERVER] Congrats, flag: {}", flag);
                stream.write_all(message.as_bytes()).unwrap();
            } else {
                stream.write_all("[SERVER] Flag not found, please contact admin".as_bytes()).unwrap();
            }
        }
        Err(_) => {
            println!("[SERVER] Invalid Solution!");
            println!();
            stream.write_all("[SERVER] Invalid Solution!".as_bytes()).unwrap();
        }
    };

    let _ = adapter.cleanup_resources().await;
    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    // create socket - port 31337
    let listener = TcpListener::bind("0.0.0.0:31337")?;
    println!("[SERVER] Starting server at port 31337!");

    let local = tokio::task::LocalSet::new();

    // wait for incoming solution
    for stream in listener.incoming() {
        match stream {
            Ok(stream) => {
                println!("[SERVER] New connection: {}", stream.peer_addr()?);
                    let result = local.run_until( async move {
                        tokio::task::spawn_local( async {
                            handle_client(stream).await
                        }).await
                    }).await;
                    println!("[SERVER] Result: {:?}", result);
            }
            Err(e) => {
                println!("[SERVER] Error: {}", e);
            }
        }
    }

    // close socket server
    drop(listener);
    Ok(())
}
