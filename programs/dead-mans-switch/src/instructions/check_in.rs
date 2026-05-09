use anchor_lang::prelude::*;
use crate::state::Switch;

#[derive(Accounts)]
#[instruction(switch_id: u64)]
pub struct CheckIn<'info> {
    #[account(
        mut,
        seeds = [b"switch", owner.key().as_ref(), &switch_id.to_le_bytes()],
        bump = switch.bump,
        has_one = owner,
    )]
    pub switch: Account<'info, Switch>,

    pub owner: Signer<'info>,
}

pub fn handler(ctx: Context<CheckIn>, _switch_id: u64) -> Result<()> {
    let clock = Clock::get()?;
    let switch = &mut ctx.accounts.switch;

    switch.last_check_in = clock.unix_timestamp;

    msg!(
        "Check-in recorded for switch {}. Next deadline: {} seconds from now.",
        switch.switch_id,
        switch.check_in_interval
    );

    Ok(())
}
