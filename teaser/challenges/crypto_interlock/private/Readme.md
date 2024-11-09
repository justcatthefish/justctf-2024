Stary protokół kryptograficzny bazujący na upływie czasu. Zapewnia (częściową) ochronę przed MITM.

Link: http://web.archive.org/web/20030605152726/http://zooko.com:80/defense_against_middleperson_attacks.html

WAŻNE:
* timeout dla komunikacji z taskiem musi być minimum 16 minut
* trzeba przetestować solver na docelowej infrastrukturze: docker może brać dane o "leap seconds" z kernela albo jakiegoś pliku, chociaż najprawdopodobniej ma wgrane w libc
* Plik binarny `timer` ma trafić do graczy. Kod źródłowy (timer.cpp) NIE. Binarke trzeba skompilować ręcznie w dockerze
* zadanie ma solver oraz healthcheck (eve.py)
    * eve.py powinno przejść końcowy `assert`
    * eve.py powinno być dość szybkie (~5 sekund)
    * solver powinien wypisywać flagę na stdout
    * solver może działać długo (do 15 minut)
    * solver może nie zadziałać z małym prawdopodobieństwem: szybko wypisze błąd, wtedy wystarczy odpalić go ponownie 

Idea jest taka, że jeśli zrobimy atak MITM, to któraś ze stron komunikacji jest w stanie go wykryć
mierząc (lokalnie) upływ czasu - jeśli komunikacja zajęła zbyt długo to znaczy że protokół jest atakowany.

Błędu w protokole jako tako nie ma (lub nie znalazłem), jest za to w sposobie liczenia czasu.
Raz na kilka(naście) miesięcy występuje tzw ["leap second" ](http://www.madore.org/%7Edavid/computers/unix-leap-seconds.html).
Wtedy minuta ma tak jakby 61 sekund.

W zadaniu skrypt `task.py` implementuje dwie strony komunikacji (Alice i Bob) jako wątki. Zadanie można było zrobić
jako dwa procesy z osobnymi portami TCP, co byłoby przyjemniejsze do gadania ze strony graczy, ale trudniejsze w implementacji, więc w/e.

Alice uruchamia zewnętrzny program `timer` który zwraca aktualną datę.
Data jest trefna - podajemy losową date z grudnia 2005 roku - ale upływ czasu jest mierzony poprawnie.
`timer` używa `utc_clock` (nowość w C++20), który to automatycznie uwzględnia leap seconds
(w przeciwieństwie do większości zegarów, które liczą czas w UNIX time).
Przez to może się zdażyć, że Alice policzy `X` sekund jako `X-1`, co sprawi, że protokół jest złamany.

Trudność polega na rozczytaniu protokołu i zauważeniu, że "leap seconds" go rozwalają. Potem wystarczy zaimplementować
klasyczny atak MITM, uruchamiając go chwilę przed wystąpieniem "leap second". 

Dlatego task ma dwie kategorie: nie jest stricte crypto.


Protokół w uproszczeniu:
```
alice         bbob

M1 = x1, PKa, n1
C1 = hash(M1)
        ---> C1

wait K seconds

S1 = sign(M1, SKa)
        ---> (M1, S1)

start time measure

        ---> C1
            wait K seconds
        ---> (M1, S1)
            verify C1 == hash(M1)
            verify S1 with M1.PKa

            M2 = x2, PKb, PKa, M1, n2
            C2 = enc(S2=sign(M2, SKb), PKa)

        <--- C2
stop time measure
if time delta >= K: error

M2 = dec(C2, SKa)
verify S2 with M2.PKb
verify M2.PKa == PKa
```

Jeśli atak MITM jest udany, to:
* atakujący zna x1 oraz x2
* alice i bob mają to samo x1 oraz x2

Klasyczny MITM powinien zostać zatrzymany na kroku `if time delta >= K`.
