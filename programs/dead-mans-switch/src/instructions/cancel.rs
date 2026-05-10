use anchor_lang::prelude::*;
use crate::state::Switch;

#[derive(Accounts)]
#[instruction(switch_id: u64)]
pub struct Cancel<'info> {
    // close = owner returns ALL lamports (locked_amount + rent) to the owner
    #[account(
        mut,
        seeds = [b"switch", owner.key().as_ref(), &switch_id.to_le_bytes()],
        bump = switch.bump,
        has_one = owner,
        close = owner,
    )]
    pub switch: Account<'info, Switch>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Cancel>, _switch_id: u64) -> Result<()> {
    // Anchor's `close = owner` handles the full refund (locked_amount + rent) automatically.
    msg!(
        "Switch {} cancelled. All funds returned to owner {}.",
        ctx.accounts.switch.switch_id,
        ctx.accounts.owner.key()
    );

    Ok(())
}
