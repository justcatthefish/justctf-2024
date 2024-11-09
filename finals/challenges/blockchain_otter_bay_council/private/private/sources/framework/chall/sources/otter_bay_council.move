module challenge::otter_bay_council {

    use sui::coin::{
        Self,
        Coin,
        TreasuryCap,
        DenyCapV2,
    };
    use sui::balance::{
        Self,
        Balance
    };
    use sui::deny_list::DenyList;
    use challenge::shadow_coin::{
        SHADOW_COIN,
        mint_shadow_coin,
        burn_shadow_coin,
    };
    use fun burn_shadow_coin as TreasuryCap.burn_shadow_coin;
    use fun mint_shadow_coin as TreasuryCap.mint_shadow_coin;

    /// the secret vault prepared to store the forbidden funds
    public struct OtterBayCouncilVault has key {
        id: object::UID,
        forbidden_vault: Balance<SHADOW_COIN>,
    }

    /// capability to issue the forbidded funds
    public struct OtterBayCouncilCap has key {
        id: object::UID,
    }

    /// expected reserve of the Shadow Coins in _Otter Bay Council's Vault_
    const SHADOW_RESERVE: u64 = 10_000_000;

    /// error thrown if the funds are not inside the _Otter Bay Council's Vault_
    const FORBIDDEN_FUNDS_STOLEN: u64 = 1337;

    fun init(ctx: &mut TxContext) {
        transfer::transfer(
            OtterBayCouncilCap { id: object::new(ctx) },
            ctx.sender()
        );
        transfer::share_object(
            OtterBayCouncilVault {
                id: object::new(ctx),
                forbidden_vault: balance::zero<SHADOW_COIN>(),
            }
        );
    }

    /// **DANGEROUS**
    /// issue the Shadow Coins
    public fun issue_forbidden_funds(
        _               : &OtterBayCouncilCap,
        receiver        : address,
        treasury_cap    : &mut TreasuryCap<SHADOW_COIN>,
        deny_cap        : &mut DenyCapV2<SHADOW_COIN>,
        deny_list       : &mut DenyList,
        ctx             : &mut TxContext
    ) {
        treasury_cap.mint_shadow_coin(receiver, SHADOW_RESERVE, ctx);

        coin::deny_list_v2_add(deny_list, deny_cap, receiver, ctx);
    }

    /// put the forbidden funds in the _Otter Bay Council's Vault_
    public fun hide_forbidden_funds(
        shadow_coin     : Coin<SHADOW_COIN>,
        vault           : &mut OtterBayCouncilVault,
    ) {
        let shadow_balance = shadow_coin.into_balance();
        vault.forbidden_vault.join(shadow_balance);
    }

    /// **DANGEROUS**
    /// burn the forbidden funds
    public fun burn_forbidden_funds(
        shadow_coin     : Coin<SHADOW_COIN>,
        treasury_cap    : &mut TreasuryCap<SHADOW_COIN>,
    ) {
        treasury_cap.burn_shadow_coin(shadow_coin);
    }

    /// check if the funds are stored in _Otter Bay Council's Vault_
    public fun verify_shadow_vault(vault: &OtterBayCouncilVault) {
        let shadow_balance = vault.forbidden_vault.value();
        assert!(shadow_balance == SHADOW_RESERVE, FORBIDDEN_FUNDS_STOLEN);
    }

}

