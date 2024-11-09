module solve::solve {

    // [*] Import dependencies
    use sui::tx_context::{Self, TxContext};

    // use challenge::OtterLoan;
    use challenge::Otter::{Self, OTTER};

    public fun solve(
        board: &mut Otter::QuestBoard,
        vault: &mut Otter::Vault<OTTER>,
        player: &mut Otter::Player,
        ctx: &mut TxContext
    ) {
            let mut tavern_ticket = Otter::enter_tavern(player);
            Otter::buy_sword(player, &mut tavern_ticket);
            Otter::checkout(tavern_ticket, player, ctx, vault, board);

            let mut i = 0;
            while (i < 24) {
                Otter::find_a_monster(board, player);
                i = i + 1;
            };
            
            Otter::bring_it_on(board, player, 0);
            Otter::return_home(board, player);
            Otter::get_the_reward(vault, board, player, ctx);

            let mut j = 0;
            while (j < 23) {
                let mut tavern_ticket2 = Otter::enter_tavern(player);
                Otter::buy_shield(player, &mut tavern_ticket2);
                Otter::get_the_reward(vault, board, player, ctx);
                Otter::checkout(tavern_ticket2, player, ctx, vault, board);

                j = j + 1;
            };

            let mut tavern_ticket3 = Otter::enter_tavern(player);
            Otter::buy_flag(&mut tavern_ticket3, player);
            Otter::checkout(tavern_ticket3, player, ctx, vault, board);
    }
}
