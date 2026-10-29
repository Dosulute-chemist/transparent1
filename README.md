# Transparent Proxy Lending Contract

This is my practice project for learning upgradeable smart contracts. I built a simple lending contract behind a **Transparent proxy** and then upgraded it from V1 to V2 without losing any data.

I used Hardhat 3 and OpenZeppelin's upgrades plugin. This is the second project in the series. The first one used the UUPS proxy pattern.

**This is a learning project, not production code.** It has no interest, no price checks, and it has not been audited.

## What I built

**LendingV1** (`contracts/LendingV1.sol`)
- Users can deposit ETH.
- Users can borrow up to 50% of what they deposited.
- Users can repay their debt.
- Users can withdraw, but only if enough deposit is left to cover their debt.
- There is no upgrade function in this contract, because in a Transparent proxy the upgrade power is held by the ProxyAdmin, not the implementation.

**LendingV2** (`contracts/LendingV2.sol`)
- It inherits everything from V1, so the storage layout stays the same.
- It adds one new function, `availableToBorrow(address)`, which shows how much more a user can borrow.

## What I learned

- A deployed smart contract can't be edited, so upgradeable contracts split the work into two parts.
- The **proxy** keeps the permanent address and all the data (storage).
- The **implementation** (logic contract) holds the code.
- In a **Transparent proxy**, a separate **ProxyAdmin** contract holds the upgrade power, and only the admin can upgrade.
- The proxy checks who is calling. The admin can only upgrade, and everyone else is forwarded to the implementation.
- Because the upgrade power is outside the implementation, a new version can't lock itself out of future upgrades. That risk only exists in UUPS.
- The cost is a bit more gas, because the caller is checked on every call.
- I use `initialize()` instead of a constructor, because the data lives in the proxy.
- The constructor only calls `_disableInitializers()`, which locks the bare implementation so nobody can take it over.
- Never reorder or delete existing storage variables in a new version. Only add new ones at the end.

## UUPS vs Transparent (what I understand so far)

| | UUPS | Transparent |
|---|---|---|
| Where the upgrade function lives | In the implementation | ProxyAdmin triggers it on the proxy |
| Who can upgrade | The owner | The ProxyAdmin owner |
| Risk | A new version can forget the upgrade function and get stuck | None of that, but slightly higher gas |

## Project structure

```
contracts/
  LendingV1.sol            Implementation V1
  LendingV2.sol            Implementation V2 (adds availableToBorrow)
scripts/
  transparent-upgrade.ts   Deploys V1 behind a Transparent proxy, uses it, upgrades to V2, checks the data
hardhat.config.ts          Hardhat 3 config with the OpenZeppelin upgrades plugin
```

## Tech used

- Solidity ^0.8.20 (compiled with solc 0.8.34)
- Hardhat 3
- OpenZeppelin Contracts Upgradeable 5
- OpenZeppelin Hardhat Upgrades 4 (the version made for Hardhat 3)
- ethers.js 6 and TypeScript

## How to run it

You need Node.js installed.

```bash
npm install
npx hardhat build
npx hardhat run scripts/transparent-upgrade.ts
```

This uses Hardhat's local network, so it is free and nothing is public.

## What the output means

```
Proxy: 0x...                          (the proxy, the permanent address)
Implementation V1: 0x...              (the logic contract, version 1)
Proxy admin: 0x...                    (the ProxyAdmin, holds the upgrade power)
Deposit before upgrade: 1.0
Debt before upgrade: 0.4
Proxy after upgrade: 0x...            (same address as before)
Implementation V2: 0x...              (a new implementation address)
Deposit after upgrade: 1.0            (data is still there)
Debt after upgrade: 0.4               (data is still there)
Available to borrow (new in V2): 0.1  (new V2 function works)
```

What I check:
- The proxy address is the **same** before and after the upgrade.
- The implementation address is **different**.
- The deposit and debt did not change.
- `availableToBorrow` works, which V1 could not do.

## Problems I ran into

- Hardhat 3 was not what I installed first. `npx hardhat --init` said it did not recognise the argument, because I still had Hardhat 2. I installed `hardhat@latest` to fix it.
- The OpenZeppelin plugin v4 needs Hardhat 3, and v3 of the plugin needs Hardhat 2. I had to match them.
- Hardhat 3 needs an ESM project, so it changed my `package.json` when I said yes.
- Scripts connect to the network differently in Hardhat 3. I used `hre.network.create()` and the `upgrades(hre, connection)` function.
- My script file was first created in the project root, not in `scripts`, so Hardhat could not find it.
- I had a typo in the contract name (`Lending V1` with a space), which stopped the build.
- Hardhat checks the capital letters in file names, so `./lendingV1.sol` failed to import even though my Mac accepted it.

## What's next

- A **Diamond (EIP-2535)** contract.
- Hardhat tests, so I don't rely only on a script.
- Reading about storage layout rules for safe upgrades.

## Author

Bello David
