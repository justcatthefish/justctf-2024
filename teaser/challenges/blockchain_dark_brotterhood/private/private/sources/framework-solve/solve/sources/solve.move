module solve::solve {

    // [*] Import dependencies
    use challenge::Otter::{Self, OTTER};
    use sui::random::Random;

    #[allow(lint(public_random))]
    public fun solve(
        vault: &mut Otter::Vault<OTTER>,
        questboard: &mut Otter::QuestBoard,
        player: &mut Otter::Player,
        r: &Random,
        ctx: &mut TxContext,
    ) {
        let mut repeats = 3;
        while (repeats > 0) {
            vault.buy_sword(player, ctx);
            {
                let mut i = 0;
                while (i < 25) {
                    questboard.find_a_monster(r, ctx);
                    i = i + 1;
                };
            };
            questboard.fight_monster(player, 0);
            questboard.return_home(0);
            {
                let mut i = 0;
                while (i < 25) {
                    vault.get_the_reward(questboard, player, 0, ctx);
                    i = i + 1;
                };
            };
            repeats = repeats - 1;
        };

        let flag = vault.buy_flag(player, ctx);
        questboard.prove(flag);
    }

}
