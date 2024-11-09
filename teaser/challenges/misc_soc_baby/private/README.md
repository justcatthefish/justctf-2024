# Lowcost SoC

Zadanie zostało napisane pod budżetowego developer boarda ESP32 Lolin i jest prostszym wydaniem zadania baby_soc.

Ten task jest self-contained, wymaga tylko pliku binarnego będącego dumpem pamięci ESP32. Zawodnicy muszą rozpakować i sparsować obraz. Następnie skonwertować partycję app0 do ELFa. Stąd droga do rozwiązania zadania jest bardzo prosta - trzeba znaleźć funkcję odpowiadającą za obsługę HTTP, sprawdzić jak deszyfruje flagę i odszyfrować ją ręcznie. 
