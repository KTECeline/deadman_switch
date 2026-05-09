use anchor_lang::prelude::*;

#[error_code]
pub enum SwitchError {
    #[msg("Check-in interval must be greater than zero")]
    InvalidInterval,
    #[msg("Locked amount must be greater than zero")]
    InvalidAmount,
    #[msg("Switch has not expired yet — owner has checked in recently")]
    SwitchNotExpired,
    #[msg("Only the switch owner can perform this action")]
    NotOwner,
    #[msg("Beneficiary account does not match the switch record")]
    InvalidBeneficiary,
    #[msg("A cNFT is already linked to this switch")]
    CnftAlreadyLinked,
    #[msg("Activity type label must be 32 bytes or fewer")]
    ActivityTypeTooLong,
}
