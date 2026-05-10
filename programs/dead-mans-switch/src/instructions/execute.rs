use anchor_lang::prelude::*;
use crate::state::Switch;
use crate::errors::SwitchError;

#[derive(Accounts)]
#[instruction(switch_id: u64)]
pub struct Execute<'info> {
    // close = owner returns the rent-exempt lamports to the owner after execution
    #[account(
        mut,
        seeds = [b"switch", switch.owner.as_ref(), &switch_id.to_le_bytes()],
        bump = switch.bump,
        has_one = owner,
        has_one = beneficiary,
        close = owner,
    )]
    pub switch: Account<'info, Switch>,

    /// CHECK: verified by has_one constraint against switch.beneficiary
    #[account(mut)]
    pub beneficiary: AccountInfo<'info>,

    /// CHECK: verified by has_one constraint against switch.owner; receives rent refund on close
    #[account(mut)]
    pub owner: AccountInfo<'info>,

    // Any signer can trigger execution once the condition is met (e.g. the AI agent)
    pub caller: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Execute>, _switch_id: u64) -> Result<()> {
    let clock = Clock::get()?;
    let switch = &ctx.accounts.switch;

    let elapsed = clock.unix_timestamp - switch.last_check_in;
    require!(elapsed >= switch.check_in_interval, SwitchError::SwitchNotExpired);

    let locked_amount = switch.locked_amount;

    // Move locked_amount from the switch PDA to the beneficiary.
    // The `close = owner` constraint (applied after this handler) will sweep the
    // remaining rent lamports to the owner.
    **ctx.accounts.switch.to_account_info().try_borrow_mut_lamports()? -= locked_amount;
    **ctx.accounts.beneficiary.to_account_info().try_borrow_mut_lamports()? += locked_amount;

    msg!(
        "Switch {} executed. {} lamports sent to beneficiary {}.",
        switch.switch_id,
        locked_amount,
        switch.beneficiary
    );

    Ok(())
}
