// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @notice Minimal ERC-7857-like interface signatures for hackathon stub.
 * @dev Full transfer-time re-encryption is deferred to v2.
 */
interface IERC7857 {
    function encryptedTokenURI(uint256 tokenId) external view returns (string memory);
    function metadataCipherHash(uint256 tokenId) external view returns (bytes32);
    function rotateEncryptedURI(uint256 tokenId, string calldata newEncryptedURI, bytes32 newCipherHash) external;
}
