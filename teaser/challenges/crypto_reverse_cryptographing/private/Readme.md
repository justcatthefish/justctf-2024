mamy oracle/wyrocznie która losuje IV i klucz do AES CBC i potem przez całą komunikacje nie zmienia już obu

następnie w nieskończonej pętli:

    `do_zaszyfrowania`  = kopia całej flagi
    `suffix_usera` =  przyjmij input
    poki ostatnia literka `do_zaszyfrowania` równa pierwszej literki `suffix_usera`: (*)
        usun ostatnią literke `do_zaszyfrowania` i pierwsza `suffix_usera`
    `do_zaszyfrowania` = zbugowany_padding(`do_zaszyfrowania` + `suffix_usera`)
    wypisz tylko ostatni blok z AEC_CBC(`do_zaszyfrowania`)

padding jest zbugowany, bo jeśli dostanie input podzielny przez długość bloku to nie dodaje extra bloku na sam padding, a powinien

Solve polega z grubsza na takich obserwacjach:
- skoro dostajemy tylko ostatni blok zaszyfrowanego tekstu to w sumie tak jakbyśmy dostawali hash
- ten hash jest podatny na kolizje przez zbugowany padding, poniewaz enc(tekst) == enc(tekst + padding)
- ten rodzaj kolizji pozwala "wyczuwać" czy z tekstu zostały usunięte jakieś literki, czyli czy (*) (patrz pętla w kodzie) zmatchowało literki z flagi

zadanko wymyśliłem tak, że wymyśliłem tą pętle (*) i się zastanowiłem jak ona wpływa na szyfr blokowy i co trzeba zepsuć w szyfrowaniu by się dało odtworzyć plaintext

nazwa zadania bierze się z tego, że w indented rozwiązaniu należy odtwarzać flage literka po literce od tyłu i na końcu ją obrócić, bierze się to ze sposobu w jaki (*) zjada literki, na przykład:

jeśli flaga = `flag{something}` i input usera to `}gnih|user_input` to ta pętla zostawi `flag{somet|user_input`

zadanko nie jest zbyt trudne, myślę że każdy team który weźmie udział "na poważnie" je wbije
