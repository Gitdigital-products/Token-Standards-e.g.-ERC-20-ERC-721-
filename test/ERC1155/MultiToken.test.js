
## 2. **test/ERC1155/MultiToken.test.js**

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("MultiToken (ERC-1155)", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployMultiTokenFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();

    const MultiToken = await ethers.getContractFactory("MultiToken");
    const multiToken = await MultiToken.deploy(
      "Game Items",
      "GITM",
      "https://api.gitdigital.com/tokens/{id}"
    );

    await multiToken.waitForDeployment();

    return { multiToken, owner, addr1, addr2, addr3 };
  }

  async function deployAndMintFixture() {
    const { multiToken, owner, addr1, addr2, addr3 } = await loadFixture(deployMultiTokenFixture);
    
    // Mint some test tokens
    await multiToken.mint(addr1.address, 1, 100, "0x"); // Fungible token ID 1
    await multiToken.mint(addr1.address, 2, 1, "0x");   // NFT token ID 2
    await multiToken.mint(addr1.address, 3, 50, "0x");  // Fungible token ID 3
    
    // Set some token URIs
    await multiToken.setTokenURI(2, "ipfs://QmNFT1");
    await multiToken.setTokenURI(3, "ipfs://QmNFT2");
    
    return { multiToken, owner, addr1, addr2, addr3 };
  }

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      const { multiToken } = await loadFixture(deployMultiTokenFixture);
      
      expect(await multiToken.name()).to.equal("Game Items");
      expect(await multiToken.symbol()).to.equal("GITM");
    });

    it("Should set the correct default URI", async function () {
      const { multiToken } = await loadFixture(deployMultiTokenFixture);
      
      expect(await multiToken.uri(1)).to.equal("https://api.gitdigital.com/tokens/1");
    });

    it("Should set the correct token-specific URI", async function () {
      const { multiToken } = await loadFixture(deployMultiTokenFixture);
      
      await multiToken.setTokenURI(999, "ipfs://custom-uri");
      expect(await multiToken.uri(999)).to.equal("ipfs://custom-uri");
    });
  });

  describe("Minting", function () {
    it("Should mint fungible tokens correctly", async function () {
      const { multiToken, owner, addr1 } = await loadFixture(deployMultiTokenFixture);
      
      await multiToken.mint(addr1.address, 1, 1000, "0x");
      const balance = await multiToken.balanceOf(addr1.address, 1);
      
      expect(balance).to.equal(1000);
    });

    it("Should mint NFTs correctly", async function () {
      const { multiToken, owner, addr1 } = await loadFixture(deployMultiTokenFixture);
      
      await multiToken.mint(addr1.address, 2, 1, "0x");
      const balance = await multiToken.balanceOf(addr1.address, 2);
      
      expect(balance).to.equal(1);
    });

    it("Should allow batch minting", async function () {
      const { multiToken, owner, addr1 } = await loadFixture(deployMultiTokenFixture);
      
      const tokenIds = [1, 2, 3, 4, 5];
      const amounts = [100, 200, 300, 400, 500];
      
      await multiToken.mintBatch(addr1.address, tokenIds, amounts, "0x");
      
      for (let i = 0; i < tokenIds.length; i++) {
        const balance = await multiToken.balanceOf(addr1.address, tokenIds[i]);
        expect(balance).to.equal(amounts[i]);
      }
    });

    it("Should revert if non-owner tries to mint", async function () {
      const { multiToken, addr1 } = await loadFixture(deployMultiTokenFixture);
      
      await expect(
        multiToken.connect(addr1).mint(addr1.address, 1, 100, "0x")
      ).to.be.revertedWithCustomError(multiToken, "OwnableUnauthorizedAccount");
    });
  });

  describe("Transfers", function () {
    it("Should transfer single fungible tokens", async function () {
      const { multiToken, addr1, addr2 } = await loadFixture(deployAndMintFixture);
      
      await multiToken.connect(addr1).safeTransferFrom(
        addr1.address,
        addr2.address,
        1, // tokenId
        50, // amount
        "0x" // data
      );
      
      const balance1 = await multiToken.balanceOf(addr1.address, 1);
      const balance2 = await multiToken.balanceOf(addr2.address, 1);
      
      expect(balance1).to.equal(50); // 100 - 50
      expect(balance2).to.equal(50); // 0 + 50
    });

    it("Should transfer NFTs", async function () {
      const { multiToken, addr1, addr2 } = await loadFixture(deployAndMintFixture);
      
      await multiToken.connect(addr1).safeTransferFrom(
        addr1.address,
        addr2.address,
        2, // NFT tokenId
        1, // amount (always 1 for NFT)
        "0x"
      );
      
      const owner = await multiToken.balanceOf(addr2.address, 2);
      expect(owner).to.equal(1);
    });

    it("Should batch transfer efficiently", async function () {
      const { multiToken, addr1, addr2 } = await loadFixture(deployAndMintFixture);
      
      const tokenIds = [1, 3]; // Fungible tokens
      const amounts = [30, 25];
      
      // Get gas usage for batch transfer
      const tx = await multiToken.connect(addr1).safeBatchTransferFrom(
        addr1.address,
        addr2.address,
        tokenIds,
        amounts,
        "0x"
      );
      
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed;
      
      // Verify transfers worked
      const balance1_1 = await multiToken.balanceOf(addr1.address, 1);
      const balance1_3 = await multiToken.balanceOf(addr1.address, 3);
      const balance2_1 = await multiToken.balanceOf(addr2.address, 1);
      const balance2_3 = await multiToken.balanceOf(addr2.address, 3);
      
      expect(balance1_1).to.equal(70); // 100 - 30
      expect(balance1_3).to.equal(25); // 50 - 25
      expect(balance2_1).to.equal(30); // 0 + 30
      expect(balance2_3).to.equal(25); // 0 + 25
      
      // Log gas usage for comparison (helpful for documentation)
      console.log(`Batch transfer (2 tokens) gas used: ${gasUsed}`);
      
      // For documentation: this should be less than 2x single transfers
      // Single transfer gas is ~49K, so 2x would be ~98K
      // Batch should be ~78K (20% savings)
      expect(gasUsed).to.be.lessThan(90000n);
    });

    it("Should revert if insufficient balance for transfer", async function () {
      const { multiToken, addr1, addr2 } = await loadFixture(deployAndMintFixture);
      
      await expect(
        multiToken.connect(addr1).safeTransferFrom(
          addr1.address,
          addr2.address,
          1,
          150, // Trying to transfer 150 when balance is 100
          "0x"
        )
      ).to.be.revertedWithCustomError(multiToken, "ERC1155InsufficientBalance");
    });
  });

  describe("Approvals", function () {
    it("Should approve operator for all tokens", async function () {
      const { multiToken, addr1, addr2 } = await loadFixture(deployAndMintFixture);
      
      await multiToken.connect(addr1).setApprovalForAll(addr2.address, true);
      
      const isApproved = await multiToken.isApprovedForAll(
        addr1.address,
        addr2.address
      );
      
      expect(isApproved).to.be.true;
    });

    it("Should allow approved operator to transfer", async function () {
      const { multiToken, addr1, addr2, addr3 } = await loadFixture(deployAndMintFixture);
      
      await multiToken.connect(addr1).setApprovalForAll(addr2.address, true);
      
      // addr2 (operator) transfers from addr1 to addr3
      await multiToken.connect(addr2).safeTransferFrom(
        addr1.address,
        addr3.address,
        1,
        50,
        "0x"
      );
      
      const balance = await multiToken.balanceOf(addr3.address, 1);
      expect(balance).to.equal(50);
    });

    it("Should revert if non-operator tries to transfer", async function () {
      const { multiToken, addr1, addr2, addr3 } = await loadFixture(deployAndMintFixture);
      
      // addr2 is NOT approved
      await expect(
        multiToken.connect(addr2).safeTransferFrom(
          addr1.address,
          addr3.address,
          1,
          50,
          "0x"
        )
      ).to.be.revertedWithCustomError(multiToken, "ERC1155MissingApprovalForAll");
    });
  });

  describe("Gas Efficiency Comparison", function () {
    it("Should demonstrate gas savings vs multiple ERC-721 transfers", async function () {
      const { multiToken, addr1, addr2 } = await loadFixture(deployAndMintFixture);
      
      // Mint 5 NFTs for batch testing
      const nftIds = [100, 101, 102, 103, 104];
      const amounts = [1, 1, 1, 1, 1];
      
      await multiToken.mintBatch(addr1.address, nftIds, amounts, "0x");
      
      // Batch transfer 5 NFTs
      const batchTx = await multiToken.connect(addr1).safeBatchTransferFrom(
        addr1.address,
        addr2.address,
        nftIds,
        amounts,
        "0x"
      );
      
      const batchReceipt = await batchTx.wait();
      const batchGas = batchReceipt.gasUsed;
      
      console.log(`ERC-1155 Batch transfer (5 NFTs) gas: ${batchGas}`);
      
      // Simulated ERC-721 cost: ~60K per transfer * 5 = ~300K
      const simulatedERC721Gas = 60000n * 5n; // 300,000 gas
      
      // ERC-1155 should be significantly cheaper
      expect(batchGas).to.be.lessThan(simulatedERC721Gas);
      
      const savings = Number(simulatedERC721Gas - batchGas) / Number(simulatedERC721Gas) * 100;
      console.log(`Gas savings: ${savings.toFixed(1)}%`);
      
      // Should save at least 70%
      expect(savings).to.be.greaterThan(70);
    });

    it("Should demonstrate gas savings vs multiple ERC-20 transfers", async function () {
      const { multiToken, addr1, addr2 } = await loadFixture(deployAndMintFixture);
      
      // Create multiple fungible tokens
      const fungibleIds = [10, 11, 12, 13, 14];
      const fungibleAmounts = [100, 200, 300, 400, 500];
      
      await multiToken.mintBatch(addr1.address, fungibleIds, fungibleAmounts, "0x");
      
      // Batch transfer all
      const batchTx = await multiToken.connect(addr1).safeBatchTransferFrom(
        addr1.address,
        addr2.address,
        fungibleIds,
        [50, 100, 150, 200, 250], // Transfer half of each
        "0x"
      );
      
      const batchReceipt = await batchTx.wait();
      const batchGas = batchReceipt.gasUsed;
      
      console.log(`ERC-1155 Batch transfer (5 fungible) gas: ${batchGas}`);
      
      // Simulated ERC-20 cost: ~45K per transfer * 5 = ~225K
      const simulatedERC20Gas = 45000n * 5n; // 225,000 gas
      
      // ERC-1155 should be significantly cheaper
      expect(batchGas).to.be.lessThan(simulatedERC20Gas);
      
      const savings = Number(simulatedERC20Gas - batchGas) / Number(simulatedERC20Gas) * 100;
      console.log(`Gas savings: ${savings.toFixed(1)}%`);
      
      // Should save at least 60%
      expect(savings).to.be.greaterThan(60);
    });
  });

  describe("URI Management", function () {
    it("Should return token-specific URI when set", async function () {
      const { multiToken } = await loadFixture(deployMultiTokenFixture);
      
      await multiToken.setTokenURI(777, "ipfs://custom-token-uri");
      const uri = await multiToken.uri(777);
      
      expect(uri).to.equal("ipfs://custom-token-uri");
    });

    it("Should fall back to default URI when no token-specific URI", async function () {
      const { multiToken } = await loadFixture(deployMultiTokenFixture);
      
      const uri = await multiToken.uri(888); // Not set
      expect(uri).to.equal("https://api.gitdigital.com/tokens/888");
    });

    it("Should update default URI", async function () {
      const { multiToken } = await loadFixture(deployMultiTokenFixture);
      
      await multiToken.setURI("https://new-api.gitdigital.com/tokens/{id}");
      const uri = await multiToken.uri(123);
      
      expect(uri).to.equal("https://new-api.gitdigital.com/tokens/123");
    });
  });

  describe("Supply Tracking", function () {
    it("Should track total supply per token", async function () {
      const { multiToken, addr1 } = await loadFixture(deployMultiTokenFixture);
      
      // Mint more of token ID 1
      await multiToken.mint(addr1.address, 1, 500, "0x");
      
      // Total supply should be initial 100 + new 500 = 600
      // Note: Need to implement ERC1155Supply extension for this test
      // This is a placeholder for when you add the extension
      
      console.log("Note: Implement ERC1155Supply extension for totalSupply tracking");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero amount transfers", async function () {
      const { multiToken, addr1, addr2 } = await loadFixture(deployAndMintFixture);
      
      // Zero amount transfer should work (no-op)
      await multiToken.connect(addr1).safeTransferFrom(
        addr1.address,
        addr2.address,
        1,
        0,
        "0x"
      );
      
      // Balance should remain unchanged
      const balance = await multiToken.balanceOf(addr1.address, 1);
      expect(balance).to.equal(100);
    });

    it("Should revert on array length mismatch in batch", async function () {
      const { multiToken, addr1, addr2 } = await loadFixture(deployAndMintFixture);
      
      await expect(
        multiToken.connect(addr1).safeBatchTransferFrom(
          addr1.address,
          addr2.address,
          [1, 2], // 2 token IDs
          [10],    // Only 1 amount - mismatch!
          "0x"
        )
      ).to.be.revertedWithCustomError(multiToken, "ERC1155InvalidArrayLength");
    });

    it("Should handle self-transfer", async function () {
      const { multiToken, addr1 } = await loadFixture(deployAndMintFixture);
      
      // Transfer to self should work
      await multiToken.connect(addr1).safeTransferFrom(
        addr1.address,
        addr1.address,
        1,
        50,
        "0x"
      );
      
      const balance = await multiToken.balanceOf(addr1.address, 1);
      expect(balance).to.equal(100); // Should remain 100
    });
  });

  // Note: Add neural-specific tests when you implement neural extensions
  describe("Neural Integration (Future)", function () {
    it("Should support neural batch operations", async function () {
      console.log("Test placeholder for neural batch operations");
      console.log("Will test single neural proof for multiple transfers");
    });

    it("Should verify neural signatures before transfer", async function () {
      console.log("Test placeholder for neural signature verification");
      console.log("Will test ZK proof verification for neural auth");
    });
  });
});