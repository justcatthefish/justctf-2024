//C:\mingw\bin\gcc.exe note.c -o note.exe

#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <unistd.h>
#include <inttypes.h>

#define NMAX 10000
#define NMAX_SIZE 0x100

struct Note {
	uint64_t length;
	uint64_t capacity;
	char *buf;
};

struct Note* notes[NMAX];

void init() {
    setvbuf(stdout, NULL, _IONBF, 0);
    setvbuf(stdin, NULL, _IONBF, 0);
    setvbuf(stderr, NULL, _IONBF, 0);
}

uint64_t getnum(){
	uint64_t tmp;
	scanf("%lld", &tmp);
	return tmp;
}

int find_free_slot() {
	for(int i=0;i<NMAX;i++) {
		if(!notes[i])
			return i;
	}
	return -1;
}

void create_note() {
	int idx = find_free_slot();
	if(idx == -1) {
		printf("!! no free slots\n");
		return;
	}
	
	struct Note *note = malloc(sizeof(struct Note));
	if(!note){
		printf("!! malloc error\n");
		return;
	}
		
	notes[idx] = note;
	note->capacity = 0;
	note->length = 0;
	note->buf = NULL;
}

void show_note() {
	printf("index: ");
	uint64_t idx = getnum();
	
	if(idx>=NMAX){
		printf("!! bad index\n");
		return;
	}
	
	struct Note *note = notes[idx];
	if(!note) return;
	
	write(1, note->buf, note->length);
	write(1, "\n", 1);
}


void free_note() {
	printf("index: ");
	uint64_t idx = getnum();
	
	if(idx>=NMAX){
		printf("!! bad index\n");
		return;
	}
	
	free(notes[idx]->buf);
	free(notes[idx]);

}

void save_note() {
	printf("index: ");
	uint64_t idx = getnum();
	if(idx>=NMAX){
		printf("!! bad index\n");
		return;
	}
	
	printf("size: ");
	uint64_t size = getnum();
	if(size>NMAX_SIZE){
		printf("!! bad size\n");
		return;
	}
	
	struct Note *note = notes[idx];
	if(!note) return;
	
	if(note->capacity < size){
		free(note->buf);
		note->buf = malloc(size);
		if(!note->buf){
			printf("!! malloc error\n");
			return;
		}
		note->capacity=size;
	}
	
	note->length=size;
	read(0, note->buf, note->length);
}


void show_menu(){
	puts("1. Create note");
	puts("2. Save note");
	puts("3. Show note");
	puts("4. Free note");
	puts("6. Exit");
	printf("=> ");
}

void loop() {
	while(1) {
		show_menu();
		int opt = getnum();
		if(opt == 1) {
			create_note();
		}
		else if(opt == 2) {
			save_note();
		}
		else if(opt == 3) {
			show_note();
		}
		else if(opt == 4) {
			free_note();
		}
		else {
			printf("bye\n");
			return;
		}
	}
}

int main() {
	init();
	loop();
	return 0;
}
