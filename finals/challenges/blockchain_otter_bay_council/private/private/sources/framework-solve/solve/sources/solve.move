module solution::solution {

    use sui::coin::{Self, Coin};
    use challenge::shadow_coin::SHADOW_COIN;
    use challenge::otter_bay_council::{
        OtterBayCouncilVault, hide_forbidden_funds
    };

    public struct SOLUTION has drop {}

    fun init(witness: SOLUTION, ctx: &mut TxContext) {
        let (mut treasury, metadata) = coin::create_currency(
            witness,
            9,
            b"SLN",
            b"SolutionCoin",
            b"",
            option::none(),
            ctx,
        );

        let coin = coin::mint(&mut treasury, 1337, ctx);
        transfer::public_transfer(coin, ctx.sender());

        transfer::public_transfer(treasury, ctx.sender());
        transfer::public_freeze_object(metadata);
    }

    #[allow(lint(self_transfer))]
    public fun solve(
        /* TODO: other params */
        coin0           : Coin<SOLUTION>,
        coin1           : Coin<SHADOW_COIN>,
        vault           : &mut OtterBayCouncilVault,
        ctx             : &mut TxContext
    ) {
        /*
         * TODO: your code
         */
        transfer::public_transfer(coin0, ctx.sender());
        hide_forbidden_funds(coin1, vault);
    }

}
