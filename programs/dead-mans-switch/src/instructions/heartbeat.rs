use anchor_lang::prelude::*;
use crate::state::Switch;
use crate::errors::SwitchError;

#[derive(Accounts)]
#[instruction(switch_id: u64)]
pub struct Heartbeat<'info> {
    #[account(
        mut,
        seeds = [b"switch", switch.owner.as_ref(), &switch_id.to_le_bytes()],
        bump = switch.bump,
        has_one = watcher,
    )]
    pub switch: Account<'info, Switch>,

    // Only the authorized agent keypair can record a heartbeat
    pub watcher: Signer<'info>,
}

pub fn handler(ctx: Context<Heartbeat>, _switch_id: u64, activity_type: String) -> Result<()> {
    require!(activity_type.len() <= 32, SwitchError::ActivityTypeTooLong);

    let clock = Clock::get()?;
    let switch = &mut ctx.accounts.switch;

    switch.last_check_in = clock.unix_timestamp;

    // Store activity label as fixed-width bytes (e.g. "dex_swap", "transfer", "stake")
    let mut label = [0u8; 32];
    label[..activity_type.len()].copy_from_slice(activity_type.as_bytes());
    switch.last_activity_type = label;

    msg!(
        "Heartbeat recorded for switch {}. Activity: '{}'. Next deadline in {}s.",
        switch.switch_id,
        activity_type,
        switch.check_in_interval
    );

    Ok(())
}
