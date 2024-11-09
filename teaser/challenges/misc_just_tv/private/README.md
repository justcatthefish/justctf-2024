# just_tv

Zadanie zostalo napisane w jezyku mheg+, ktory byl uzywany przez BBc do tworzenia interaktywnych programów telewizyjnych.

W programie jest flag checker.

W kodzie zawarty jest ciag 0 i 1, ktory jest docelowy oraz drugi ciag tej samej dlugosci, ktory jest xorowany z flaga wpisana w okienko. DOdatkowo ten ciag xorowany jest przesuwany zgodnie z dlugoscia podanej flagi.

Do rozwiazania zadania nalezy zdekompilowac kod. Dekompilator od BBC zostawia pare bledów, ale nie sa one krytyczne, to znaczy psuja menu główne (maszyna stanow wyglada prawie identycznie, brakuje nulli, ktore przewiduje odtwarezacz od BBC), ktore nie jest potrzebne do sprawdzenia flagi oraz blednie zapisuje stringi ' zamiast " (stringi ' sa uznawane za octet encoded). Nastepnie mozna uzyc debuggera od BBC do przesledzenia dzialania kodu. 

W katalogu private/stream_packer znajduje sie zzestaw narzedzi do kompilacji, dekompilacji oraz przetestowania dzialania kodu, python3 run.py testuje na czystym kodzie z kompilatora, python3 decompiler.py &&  SANITY=1 python3 run.py testuje na kodzie zdekompilowanym (przewidywany jest blad uruchomienia, patrz wyzej na opis bledow kompilatora)
