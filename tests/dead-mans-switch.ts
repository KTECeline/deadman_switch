import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";

describe("dead-mans-switch", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Cast to any — Anchor 0.31 strict types reject `switch` as an account key name
  // because it's a JS reserved word. Tests run correctly at runtime.
  const program = anchor.workspace.DeadMansSwitch as any;

  const owner = provider.wallet as anchor.Wallet;
  const beneficiary = Keypair.generate();
  const watcher = Keypair.generate(); // simulates the agent keypair

  const SWITCH_ID = new anchor.BN(1);
  const CHECK_IN_INTERVAL = new anchor.BN(5); // 5 seconds — short for testing
  const LOCKED_AMOUNT = new anchor.BN(0.1 * LAMPORTS_PER_SOL);

  let switchPda: PublicKey;

  before(async () => {
    [switchPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("switch"),
        owner.publicKey.toBuffer(),
        SWITCH_ID.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );
    // Beneficiary needs no pre-existing balance — Solana creates the account on first receive
  });

  it("creates a switch", async () => {
    await program.methods
      .createSwitch(
        SWITCH_ID,
        CHECK_IN_INTERVAL,
        LOCKED_AMOUNT,
        beneficiary.publicKey,
        watcher.publicKey
      )
      .accounts({
        switch: switchPda,
        owner: owner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const switchAccount = await program.account.switch.fetch(switchPda);
    assert.equal(switchAccount.owner.toBase58(), owner.publicKey.toBase58());
    assert.equal(switchAccount.beneficiary.toBase58(), beneficiary.publicKey.toBase58());
    assert.equal(switchAccount.lockedAmount.toString(), LOCKED_AMOUNT.toString());
    assert.equal(switchAccount.checkInInterval.toString(), CHECK_IN_INTERVAL.toString());
    assert.equal(switchAccount.watcher.toBase58(), watcher.publicKey.toBase58());
    console.log("Switch created at:", switchPda.toBase58());
  });

  it("allows owner to check in", async () => {
    const before = await program.account.switch.fetch(switchPda);

    await new Promise((r) => setTimeout(r, 1000));

    await program.methods
      .checkIn(SWITCH_ID)
      .accounts({
        switch: switchPda,
        owner: owner.publicKey,
      })
      .rpc();

    const after = await program.account.switch.fetch(switchPda);
    assert.isTrue(
      after.lastCheckIn.toNumber() >= before.lastCheckIn.toNumber(),
      "lastCheckIn should have updated"
    );
    console.log("Checked in at:", after.lastCheckIn.toNumber());
  });

  it("agent heartbeat resets timer (simulates on-chain activity detection)", async () => {
    const before = await program.account.switch.fetch(switchPda);

    await new Promise((r) => setTimeout(r, 1000));

    await program.methods
      .heartbeat(SWITCH_ID, "dex_swap")
      .accounts({
        switch: switchPda,
        watcher: watcher.publicKey,
      })
      .signers([watcher])
      .rpc();

    const after = await program.account.switch.fetch(switchPda);
    assert.isTrue(
      after.lastCheckIn.toNumber() > before.lastCheckIn.toNumber(),
      "lastCheckIn should have updated after heartbeat"
    );
    const label = Buffer.from(after.lastActivityType).toString("utf8").replace(/\0/g, "");
    assert.equal(label, "dex_swap");
    console.log("Heartbeat recorded. Activity:", label);
  });

  it("rejects execute when switch has not expired", async () => {
    try {
      await program.methods
        .execute(SWITCH_ID)
        .accounts({
          switch: switchPda,
          beneficiary: beneficiary.publicKey,
          owner: owner.publicKey,
          caller: owner.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      assert.fail("Should have thrown SwitchNotExpired");
    } catch (err: any) {
      assert.include(err.message, "SwitchNotExpired");
      console.log("Correctly rejected early execution");
    }
  });

  it("executes switch after interval expires", async () => {
    // Wait for the 5s interval to elapse
    console.log("Waiting for interval to expire...");
    await new Promise((r) => setTimeout(r, 6000));

    const beneficiaryBefore = await provider.connection.getBalance(beneficiary.publicKey);

    await program.methods
      .execute(SWITCH_ID)
      .accounts({
        switch: switchPda,
        beneficiary: beneficiary.publicKey,
        owner: owner.publicKey,
        caller: owner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const beneficiaryAfter = await provider.connection.getBalance(beneficiary.publicKey);
    const received = beneficiaryAfter - beneficiaryBefore;

    assert.equal(received, LOCKED_AMOUNT.toNumber(), "Beneficiary should receive locked amount");
    console.log(`Beneficiary received ${received} lamports`);

    // Switch account should be closed
    const closed = await provider.connection.getAccountInfo(switchPda);
    assert.isNull(closed, "Switch account should be closed after execution");
  });

  it("cancel returns all funds to owner", async () => {
    // Create a fresh switch for the cancel test
    const cancelSwitchId = new anchor.BN(2);
    const [cancelPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("switch"),
        owner.publicKey.toBuffer(),
        cancelSwitchId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    await program.methods
      .createSwitch(
        cancelSwitchId,
        new anchor.BN(86400), // 1 day — won't expire during test
        LOCKED_AMOUNT,
        beneficiary.publicKey,
        watcher.publicKey
      )
      .accounts({
        switch: cancelPda,
        owner: owner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const ownerBefore = await provider.connection.getBalance(owner.publicKey);

    await program.methods
      .cancel(cancelSwitchId)
      .accounts({
        switch: cancelPda,
        owner: owner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const ownerAfter = await provider.connection.getBalance(owner.publicKey);
    // Owner should get back locked_amount (minus tx fees)
    assert.isTrue(ownerAfter > ownerBefore, "Owner should recover funds after cancel");

    const closed = await provider.connection.getAccountInfo(cancelPda);
    assert.isNull(closed, "Switch account should be closed after cancel");
    console.log("Cancel successful, account closed");
  });
});
