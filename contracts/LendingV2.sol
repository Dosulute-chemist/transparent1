// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {LendingV1} from "./LendingV1.sol";

contract LendingV2 is LendingV1 {
    function availableToBorrow(address user) external view returns (uint256) {
        uint256 limit = deposits[user] / 2;
        if (debts[user] >= limit) return 0;
        return limit - debts[user];
    }
}
