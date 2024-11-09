module solve::solve {

    // [*] Import dependencies
    use challenge::theotterscrolls;

    public fun solve(
        spellbook: &mut theotterscrolls::Spellbook,
        _ctx: &mut TxContext
    ) {
        let spell = vector[ 1, 0, 3, 3, 3 ];

        theotterscrolls::cast_spell(spell, spellbook);
    }

}
