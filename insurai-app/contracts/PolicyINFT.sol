// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC7857} from "./interfaces/IERC7857.sol";

/**
 * @title PolicyINFT
 * @notice Hackathon iNFT stub: ERC-721 + ERC-7857 signatures + encrypted metadata URI.
 * @dev Re-encryption on transfer is intentionally not implemented in v1 (v2 roadmap).
 */
contract PolicyINFT is ERC721, Ownable, IERC7857 {
    uint256 public nextTokenId;

    struct TokenMetadata {
        string encryptedURI;
        bytes32 cipherHash;
    }

    mapping(uint256 => TokenMetadata) private _metadata;

    event PolicyINFTMinted(uint256 indexed tokenId, address indexed owner, string encryptedURI, bytes32 cipherHash);
    event EncryptedURIRotated(uint256 indexed tokenId, string newEncryptedURI, bytes32 newCipherHash);

    constructor(address initialOwner) ERC721("InsurAI Policy iNFT", "IPOL") Ownable(initialOwner) {}

    function mintPolicy(address to, string calldata encryptedMetadataURI) external onlyOwner returns (uint256 tokenId) {
        require(to != address(0), "PolicyINFT: zero recipient");
        require(bytes(encryptedMetadataURI).length > 0, "PolicyINFT: empty URI");

        tokenId = ++nextTokenId;
        _safeMint(to, tokenId);
        bytes32 cipherHash = keccak256(abi.encodePacked(encryptedMetadataURI));
        _metadata[tokenId] = TokenMetadata({encryptedURI: encryptedMetadataURI, cipherHash: cipherHash});

        emit PolicyINFTMinted(tokenId, to, encryptedMetadataURI, cipherHash);
    }

    function encryptedTokenURI(uint256 tokenId) external view override returns (string memory) {
        _requireOwned(tokenId);
        return _metadata[tokenId].encryptedURI;
    }

    function metadataCipherHash(uint256 tokenId) external view override returns (bytes32) {
        _requireOwned(tokenId);
        return _metadata[tokenId].cipherHash;
    }

    function rotateEncryptedURI(
        uint256 tokenId,
        string calldata newEncryptedURI,
        bytes32 newCipherHash
    ) external override {
        address tokenOwner = ownerOf(tokenId);
        require(msg.sender == tokenOwner || msg.sender == owner(), "PolicyINFT: unauthorized");
        require(bytes(newEncryptedURI).length > 0, "PolicyINFT: empty URI");
        _metadata[tokenId] = TokenMetadata({encryptedURI: newEncryptedURI, cipherHash: newCipherHash});
        emit EncryptedURIRotated(tokenId, newEncryptedURI, newCipherHash);
    }
}
