// Compile with: zig cc -o code -target riscv64-linux-musl code.c
// Run with qemu-user-static
#include <stdio.h>
#include <stdlib.h>

void debug()
{
	// TODO(production): remove this function like the security team says
	system("echo hello");
}
void vuln()
{
	char name[256];
	printf("Who are we? ");
	fgets(name, sizeof(name), stdin);
	printf("Hello ");
	printf(name);
}
int main()
{
	setbuf(stdout, NULL);
	vuln();
	vuln();
	return 1;
}
