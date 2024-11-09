module challenge::shadow_coin {

    use sui::coin::{
        Self,
        Coin,
        TreasuryCap,
    };

    public struct SHADOW_COIN has drop {}

    fun init(witness: SHADOW_COIN, ctx: &mut TxContext) {
        let (treasury, deny_cap, metadata) = coin::create_regulated_currency_v2(
            witness,
            9,
            b"SHDW",
            b"ShadowCoin",
            b"",
            option::none(),
            false,
            ctx,
        );
        transfer::public_freeze_object(metadata);
        transfer::public_transfer(treasury, ctx.sender());
        transfer::public_transfer(deny_cap, ctx.sender());
    }

    public(package) fun mint_shadow_coin(
        treasury_cap    : &mut TreasuryCap<SHADOW_COIN>,
        receiver        : address,
        amount          : u64,
        ctx             : &mut TxContext
    ) {
        let shadow_coin = treasury_cap.mint(amount, ctx);
        transfer::public_transfer(shadow_coin, receiver);
    }

    public(package) fun burn_shadow_coin(
        treasury_cap    : &mut TreasuryCap<SHADOW_COIN>,
        coin            : Coin<SHADOW_COIN>,
    ) {
        coin::burn(treasury_cap, coin);
    }

}
