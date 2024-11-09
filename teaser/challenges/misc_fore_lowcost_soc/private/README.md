# Lowcost SoC

Zadanie zostało napisane pod budżetowego developer boarda ESP32 Lolin i używa standardowej biblioteki AESlib. 

Do rozwiązania zadania wystarczy statyczny plik .bin, który jest pełnym dumpem pamięci ESP32. W celu odzyskania flagi wymagane jest podzielenie obrazu na odpowiednie struktury (partycje), zreversowanie prostej binarki, która odszyfrowuje (zaszyfrowaną AES-CBC 128) flagę. Problem jest taki, że pierwotny kod, który zaszyfrował flagę został usunięty. Co prawda klucz jest przechowywany w partycji app0, ELFie (segment .data). Nie ma tam natomiast flagi, bo program zapisujący ją został nadpisany. Znajduje się ona w EEPROMie (partycja nvs). Nie wystarczy więc zreversować sam kod aplikacji i wyciągnąć potrzebne wartości. Należy jeszcze sparsować odpowiednio strukturę EEPROMu i pozyskać szyfrogram. 
