// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import "@chainlink/contracts/src/v0.7/VRFConsumerBase.sol";

// KeeperCompatible.sol imports the functions from both ./KeeperBase.sol and
// ./interfaces/KeeperCompatibleInterface.sol
import "@chainlink/contracts/src/v0.7/KeeperCompatible.sol";

contract ScalableRng is VRFConsumerBase, KeeperCompatibleInterface {
    // variables
    bytes32 private s_keyHash;
    uint256 private s_fee;
    uint256 public immutable TIME_BETWEEN_NUMBERS = 30 seconds;

    bool private s_isRequesting;
    uint256 public s_lastRequestTime;
    uint256[] public s_rngs;

    event RequestedRandomness(uint256 indexed index);
    event ReceivedRandomness(uint256 indexed index, uint256 result);

    // constructor
    // all these values are for Mumbai Testnet on Polygon
    constructor()
        VRFConsumerBase(0x8C7382F9D8f56b33781fE506E897a4F1e2d17255, 0x326C977E6efc84E512bB9C30f76E30c160eD06FB)
    {
        s_keyHash = 0x6e75b569a01ef56d18cab6a8e71e6600d6ce853834d4a5748b720d06f878b3a4;
        s_fee = 0.0002 * 10 ** 18;
    }

    modifier readyForNewRequest() {
        require(LINK.balanceOf(address(this)) >= s_fee, "Not enough LINK to pay fee");
        require(block.timestamp - s_lastRequestTime >= TIME_BETWEEN_NUMBERS, "Not enough time has passed between requests");
        require(!s_isRequesting, "Request already underway");
        _;
    }

    function getLinkBalance() public view returns (uint256) {
        return LINK.balanceOf(address(this));
    }

    function requestNextGlobalRng() public readyForNewRequest {
        s_lastRequestTime = block.timestamp;
        s_isRequesting = true;
        requestRandomness(s_keyHash, s_fee);
        emit RequestedRandomness(s_rngs.length);
    }

    function setNextGlobalRng(uint256 randomness) private {
        s_rngs.push(randomness);
        emit ReceivedRandomness(s_rngs.length - 1, randomness);
        s_isRequesting = false;
    }

    function fulfillRandomness(bytes32 /*requestId*/, uint256 randomness) internal override {
        setNextGlobalRng(randomness);
    }

    function checkUpkeep(bytes calldata /* checkData */) external override readyForNewRequest returns (bool, bytes memory)  {
        return (true, bytes(""));
    }

    function performUpkeep(bytes calldata /* performData */) external override {
        requestNextGlobalRng();
    }

    function commitToNextRng() public view returns (uint256 index) {
        index = s_rngs.length;
    }

    function tryRetrieveRng(uint256 index) public view returns (bool retrieveSuccess, uint256 rng) {
        if (s_rngs.length <= index) {
            rng = 0;
            retrieveSuccess = false;
        }
        else
        {
            rng = s_rngs[index];
            retrieveSuccess = true;
        }
    }
}