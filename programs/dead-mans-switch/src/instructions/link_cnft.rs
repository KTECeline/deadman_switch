use anchor_lang::prelude::*;
use crate::state::Switch;
use crate::errors::SwitchError;

#[derive(Accounts)]
#[instruction(switch_id: u64)]
pub struct LinkCnft<'info> {
    #[account(
        mut,
        seeds = [b"switch", owner.key().as_ref(), &switch_id.to_le_bytes()],
        bump = switch.bump,
        has_one = owner,
    )]
    pub switch: Account<'info, Switch>,

    pub owner: Signer<'info>,
}

pub fn handler(ctx: Context<LinkCnft>, _switch_id: u64, asset_id: Pubkey) -> Result<()> {
    require!(
        ctx.accounts.switch.cnft_asset_id == Pubkey::default(),
        SwitchError::CnftAlreadyLinked
    );

    ctx.accounts.switch.cnft_asset_id = asset_id;

    msg!(
        "cNFT {} linked to switch {}.",
        asset_id,
        ctx.accounts.switch.switch_id
    );

    Ok(())
}
