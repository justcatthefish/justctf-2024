const std = @import("std");

const max_size: usize = 10 * 1024 * 1024; // 10MB in bytes

fn createBinary(reader: std.fs.File.Reader, writer: std.fs.File.Writer) !void {
    // Print size
    try writer.print("Please provide size in bytes: ", .{});

    // Read size
    var size_buffer: [20]u8 = undefined;
    const size_str = try reader.readUntilDelimiterOrEof(&size_buffer, '\n') orelse return error.EoF;
    const size = try std.fmt.parseInt(usize, size_str, 10);

    // Check if size exceeds max_size
    if (size > max_size) {
        return;
    }

    // Print content
    try writer.print("Please write your binary now\n", .{});

    // Read content + Write file
    var content_buffer: [1024]u8 = undefined;
    var bytes_remaining = size;

    const file = try std.fs.cwd().createFile("foo.elf", .{});
    defer file.close();

    while (bytes_remaining > 0) {
        const to_read = if (bytes_remaining < content_buffer.len) bytes_remaining else content_buffer.len;
        const bytes_read = try reader.readAtLeast(&content_buffer, to_read);
        try file.writeAll(content_buffer[0..bytes_read]);
        bytes_remaining -= bytes_read;
    }
}

pub fn main() !void {
    const stdin = std.io.getStdIn();
    const stdout = std.io.getStdOut();
    const reader = stdin.reader();
    const writer = stdout.writer();

    // Create binary
    try createBinary(reader, writer);

    // Close stdin
    stdin.close();
    const devnull = try std.posix.open("/dev/null", .{ }, 0);
    try std.posix.dup2(devnull, 0);

    // Print staring
    try writer.print("Starting pwndbg\n", .{});

    // Execve pwndbg with ./foo.elf as argument
    const args = [_:null]?[*:0]const u8{
        "pwndbg",
        "./foo.elf",
    };
    var envp: [100:null]?[*:0]const u8 = undefined;
    for(std.os.environ, 0..) |env, idx| {
        envp[idx] = env;
        envp[idx+1] = null;
    }
    std.posix.execvpeZ(args[0].?, &args, &envp) catch {};
}
