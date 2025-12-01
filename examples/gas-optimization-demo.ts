#!/usr/bin/env tsx
/**
 * Gas Optimization Demo for Token Standards
 * 
 * This demo shows gas savings across different token standards
 * and optimization techniques you can implement.
 */

import { ethers } from 'ethers';
import { GasAnalyzer } from './utils/gas-analyzer';

// Mock contracts for demonstration
// In real usage, import your actual contract factories
const CONTRACT_ABIS = {
  ERC20: require('../artifacts/contracts/ERC20/MyToken.sol/MyToken.json').abi,
  ERC721: require('../artifacts/contracts/ERC721/MyNFT.sol/MyNFT.json').abi,
  ERC1155: require('../artifacts/contracts/ERC1155/MultiToken.sol/MultiToken.json').abi,
};

interface GasReport {
  standard: string;
  operation: string;
  gasUsed: bigint;
  gasCostUSD?: number;
  savings?: string;
}

class GasOptimizationDemo {
  private provider: ethers.JsonRpcProvider;
  private gasAnalyzer: GasAnalyzer;
  private reports: GasReport[] = [];

  constructor(rpcUrl: string = 'http://localhost:8545') {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.gasAnalyzer = new GasAnalyzer(this.provider);
  }

  /**
   * Run all gas optimization demos
   */
  async runAllDemos() {
    console.log('🚀 Starting Gas Optimization Demo\n');
    
    console.log('='.repeat(60));
    console.log('GAS OPTIMIZATION COMPARISON ACROSS TOKEN STANDARDS');
    console.log('='.repeat(60) + '\n');

    // Demo 1: Single Transfer Comparison
    await this.demoSingleTransfers();
    
    // Demo 2: Batch Operations
    await this.demoBatchOperations();
    
    // Demo 3: Minting Costs
    await this.demoMintingCosts();
    
    // Demo 4: Approval Patterns
    await this.demoApprovalPatterns();
    
    // Demo 5: Custom Optimizations
    await this.demoCustomOptimizations();
    
    // Generate Report
    await this.generateReport();
  }

  /**
   * Demo 1: Compare single transfer costs
   */
  private async demoSingleTransfers() {
    console.log('📊 DEMO 1: Single Transfer Gas Costs');
    console.log('-----------------------------------');
    
    // Simulate gas costs (in real demo, these would be actual transactions)
    const simulatedCosts = [
      { standard: 'ERC-20', gas: 45312n },
      { standard: 'ERC-721', gas: 59847n },
      { standard: 'ERC-1155', gas: 49123n },
      { standard: 'ERC-1155 (Optimized)', gas: 42100n },
    ];
    
    simulatedCosts.forEach(cost => {
      this.reports.push({
        standard: cost.standard,
        operation: 'Single Transfer',
        gasUsed: cost.gas,
      });
      
      console.log(`  ${cost.standard.padEnd(20)}: ${cost.gas.toString().padStart(8)} gas`);
    });
    
    const erc20Cost = simulatedCosts[0].gas;
    const erc1155Optimized = simulatedCosts[3].gas;
    const savings = (Number(erc20Cost - erc1155Optimized) / Number(erc20Cost)) * 100;
    
    console.log(`\n  💰 Savings: ${savings.toFixed(1)}% with optimized ERC-1155\n`);
  }

  /**
   * Demo 2: Batch operation savings
   */
  private async demoBatchOperations() {
    console.log('📦 DEMO 2: Batch Operation Savings');
    console.log('----------------------------------');
    
    const batchSize = 10;
    
    // Simulated costs for 10 items
    const simulatedCosts = [
      { 
        standard: 'ERC-20 (10 separate)', 
        gas: 453120n, // 45,312 * 10
        description: 'Individual transfers' 
      },
      { 
        standard: 'ERC-721 (10 separate)', 
        gas: 598470n, // 59,847 * 10
        description: 'Individual transfers' 
      },
      { 
        standard: 'ERC-1155 (1 batch)', 
        gas: 78456n,
        description: 'Single batch transaction' 
      },
      { 
        standard: 'Gas-Optimized Batch', 
        gas: 65432n,
        description: 'Custom optimized batch' 
      },
    ];
    
    simulatedCosts.forEach(cost => {
      this.reports.push({
        standard: cost.standard,
        operation: `Batch Transfer (${batchSize} items)`,
        gasUsed: cost.gas,
      });
      
      console.log(`  ${cost.standard.padEnd(30)}: ${cost.gas.toString().padStart(8)} gas - ${cost.description}`);
    });
    
    // Calculate savings
    const erc20BatchCost = simulatedCosts[0].gas;
    const erc1155BatchCost = simulatedCosts[2].gas;
    const savings = (Number(erc20BatchCost - erc1155BatchCost) / Number(erc20BatchCost)) * 100;
    
    console.log(`\n  💰 Batch savings: ${savings.toFixed(1)}% using ERC-1155\n`);
  }

  /**
   * Demo 3: Minting cost comparison
   */
  private async demoMintingCosts() {
    console.log('🎨 DEMO 3: Minting Cost Comparison');
    console.log('---------------------------------');
    
    const simulatedCosts = [
      { standard: 'ERC-20 Mint', gas: 54892n },
      { standard: 'ERC-721 Safe Mint', gas: 121349n },
      { standard: 'ERC-1155 Mint', gas: 69238n },
      { standard: 'ERC-1155 Batch Mint (10)', gas: 125892n },
      { standard: 'ERC-721 Batch Mint (10)', gas: 1213490n },
    ];
    
    simulatedCosts.forEach(cost => {
      this.reports.push({
        standard: cost.standard,
        operation: 'Minting',
        gasUsed: cost.gas,
      });
      
      console.log(`  ${cost.standard.padEnd(30)}: ${cost.gas.toString().padStart(8)} gas`);
    });
    
    // Show the massive savings for batch minting
    const erc721Batch = simulatedCosts[4].gas;
    const erc1155Batch = simulatedCosts[3].gas;
    const savings = (Number(erc721Batch - erc1155Batch) / Number(erc721Batch)) * 100;
    
    console.log(`\n  💰 Batch mint savings: ${savings.toFixed(1)}% (10 items)\n`);
  }

  /**
   * Demo 4: Approval pattern optimizations
   */
  private async demoApprovalPatterns() {
    console.log('🔐 DEMO 4: Approval Pattern Optimizations');
    console.log('----------------------------------------');
    
    console.log('  Traditional Patterns:');
    console.log('  - ERC-20 Approve: ~44,182 gas per token');
    console.log('  - ERC-721 Approve: ~45,912 gas per NFT');
    console.log('  - ERC-721 setApprovalForAll: ~46,281 gas (all NFTs)');
    
    console.log('\n  Optimized Patterns:');
    console.log('  - ERC-1155 setApprovalForAll: ~42,891 gas (all tokens)');
    console.log('  - Permit2-style approvals: ~0 gas (off-chain signing)');
    console.log('  - Neural session keys: ~15,000 gas (temporary permissions)');
    
    // Simulated costs
    const simulatedCosts = [
      { pattern: 'Traditional ERC-20 Approve (per token)', gas: 44182n },
      { pattern: 'ERC-1155 setApprovalForAll (all tokens)', gas: 42891n },
      { pattern: 'Permit2 Off-chain Signature', gas: 0n },
      { pattern: 'Neural Session Key', gas: 15000n },
    ];
    
    simulatedCosts.forEach(cost => {
      this.reports.push({
        standard: 'Approval Pattern',
        operation: cost.pattern,
        gasUsed: cost.gas,
      });
    });
    
    console.log(`\n  💰 Use Permit2 for maximum gas savings on approvals\n`);
  }

  /**
   * Demo 5: Custom optimization techniques
   */
  private async demoCustomOptimizations() {
    console.log('⚡ DEMO 5: Custom Optimization Techniques');
    console.log('----------------------------------------');
    
    const optimizations = [
      {
        technique: 'Packed Storage',
        description: 'Store multiple values in single storage slot',
        savings: '30-50%',
        example: 'address + timestamp in single bytes32'
      },
      {
        technique: 'Unchecked Arithmetic',
        description: 'Safe use of unchecked blocks',
        savings: '5-10% per operation',
        example: 'balances[from] -= amount; (unchecked)'
      },
      {
        technique: 'Memory Variables',
        description: 'Cache storage reads in memory',
        savings: '15-25%',
        example: 'uint256 balance = balances[user];'
      },
      {
        technique: 'Custom Errors',
        description: 'Replace require() with custom errors',
        savings: '~50 gas per revert',
        example: 'error InsufficientBalance();'
      },
      {
        technique: 'Minimal Proxy',
        description: 'Use EIP-1167 for cheap deployments',
        savings: '90-95% deployment gas',
        example: 'Clone factory pattern'
      },
    ];
    
    optimizations.forEach(opt => {
      console.log(`  ${opt.technique.padEnd(25)}: ${opt.savings.padEnd(10)} - ${opt.description}`);
    });
    
    console.log('\n  💡 Implementation examples in /contracts/optimized/\n');
  }

  /**
   * Generate comprehensive report
   */
  private async generateReport() {
    console.log('='.repeat(60));
    console.log('📈 GAS OPTIMIZATION REPORT');
    console.log('='.repeat(60));
    
    // Calculate totals and averages
    const byStandard = this.reports.reduce((acc, report) => {
      if (!acc[report.standard]) {
        acc[report.standard] = {
          totalGas: 0n,
          count: 0,
          operations: []
        };
      }
      acc[report.standard].totalGas += report.gasUsed;
      acc[report.standard].count++;
      acc[report.standard].operations.push(report.operation);
      return acc;
    }, {} as Record<string, { totalGas: bigint; count: number; operations: string[] }>);
    
    // Print summary
    console.log('\nSummary by Standard:');
    console.log('-' .repeat(40));
    
    Object.entries(byStandard).forEach(([standard, data]) => {
      const avgGas = Number(data.totalGas) / data.count;
      console.log(`${standard.padEnd(25)}: ${avgGas.toFixed(0).padStart(8)} gas avg (${data.count} operations)`);
    });
    
    // Recommendations
    console.log('\n🎯 OPTIMIZATION RECOMMENDATIONS:');
    console.log('-' .repeat(40));
    console.log('1. Use ERC-1155 for multi-token applications');
    console.log('2. Implement batch operations whenever possible');
    console.log('3. Use Permit2 for gasless approvals');
    console.log('4. Consider ERC-4337 for advanced user experiences');
    console.log('5. Implement neural session keys for recurring access');
    
    // Save report to file
    await this.saveReportToFile();
    
    console.log('\n📁 Full report saved to: gas-optimization-report.json');
    console.log('\n🚀 Demo complete!');
  }

  /**
   * Save report to JSON file
   */
  private async saveReportToFile() {
    const fs = await import('fs');
    const report = {
      generatedAt: new Date().toISOString(),
      network: await this.provider.getNetwork(),
      gasPrice: await this.provider.getGasPrice(),
      reports: this.reports,
      summary: this.generateSummary(),
    };
    
    fs.writeFileSync(
      'gas-optimization-report.json',
      JSON.stringify(report, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value,
        2
      )
    );
  }

  /**
   * Generate summary statistics
   */
  private generateSummary() {
    const totalGas = this.reports.reduce((sum, report) => sum + report.gasUsed, 0n);
    const avgGas = Number(totalGas) / this.reports.length;
    
    return {
      totalOperations: this.reports.length,
      totalGasUsed: totalGas.toString(),
      averageGasPerOperation: avgGas.toFixed(0),
      estimatedCostUSD: this.estimateCostUSD(totalGas),
    };
  }

  /**
   * Estimate cost in USD
   */
  private estimateCostUSD(gasUsed: bigint): string {
    // Simplified estimation
    const gasPrice = 20n; // 20 gwei (approximate)
    const ethPrice = 2000n; // $2000 per ETH (approximate)
    
    const costWei = gasUsed * gasPrice * 1000000000n; // gwei to wei
    const costEth = Number(costWei) / 1e18;
    const costUSD = costEth * Number(ethPrice);
    
    return `$${costUSD.toFixed(2)}`;
  }
}

// Utility class for gas analysis
class GasAnalyzer {
  constructor(private provider: ethers.JsonRpcProvider) {}
  
  async analyzeTransaction(txHash: string) {
    const receipt = await this.provider.getTransactionReceipt(txHash);
    return {
      gasUsed: receipt?.gasUsed || 0n,
      effectiveGasPrice: receipt?.gasPrice || 0n,
      totalCost: (receipt?.gasUsed || 0n) * (receipt?.gasPrice || 0n),
    };
  }
}

// Run the demo if executed directly
if (require.main === module) {
  const demo = new GasOptimizationDemo();
  
  demo.runAllDemos().catch(error => {
    console.error('Demo failed:', error);
    process.exit(1);
  });
}

export { GasOptimizationDemo, GasAnalyzer };