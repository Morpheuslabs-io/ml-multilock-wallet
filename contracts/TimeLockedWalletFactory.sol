// SPDX-License-Identifier: None
pragma solidity ^0.8.0;

import "./TokenTimeLockedWallet.sol";

contract TimeLockedWalletFactory {
    mapping(address => address[]) wallets;

    function getWallets(address _user) public view returns (address[] memory) {
        return wallets[_user];
    }

    function newTimeLockedWallet(
        address _owner,
        uint256[] memory _lockTimeFrames,
        uint256[] memory _lockAmounts
    ) public returns (address wallet) {
        // Create new wallet.
        wallet = address(
            new TokenTimeLockedWallet(
                msg.sender,
                _owner,
                _lockTimeFrames,
                _lockAmounts
            )
        );

        // Add wallet to sender's wallets.
        wallets[msg.sender].push(wallet);

        // If owner is the same as sender then add wallet to sender's wallets too.
        if (msg.sender != _owner) {
            wallets[_owner].push(wallet);
        }

        // Emit event.
        emit Created(
            wallet,
            msg.sender,
            _owner,
            block.timestamp,
            _lockTimeFrames,
            _lockAmounts
        );
    }

    // Prevents accidental sending of ether to the factory
    fallback() external payable {
        revert("Could not send eth to contract");
    }

    receive() external payable {
        revert("Could not send eth to contract");
    }

    event Created(
        address wallet,
        address from,
        address to,
        uint256 createdAt,
        uint256[] lockTimeFrames,
        uint256[] lockAmounts
    );
}
