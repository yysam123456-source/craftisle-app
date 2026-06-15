/**
 * AI Content Template - Structured content for resource pages
 * 
 * This module defines the template for AI-generated content,
 * and provides functions to generate/fetch content for resources.
 * 
 * Usage:
 *   - AI generates content in this format (JSON)
 *   - Content is cached in public/data/generated-content/{resourceId}.json
 *   - Pages read the cached content (ISR: revalidate every 24h)
 */

export interface ResourceContentTemplate {
  // 字段 1：产品介绍（100-200 字）
  introduction: string;
  
  // 字段 2：核心功能（3-5 个，每个 20-30 字）
  features: string[];
  
  // 字段 3：适用场景（3-5 个，每个 15-20 字）
  useCases: string[];
  
  // 字段 4：最佳替代品（3-5 个）
  alternatives: {
    name: string;
    reason: string; // 为什么它是替代品（20-30 字）
  }[];
  
  // 字段 5：价格信息
  pricing: {
    type: 'free' | 'freemium' | 'paid';
    description: string; // 例如："Free for open source projects, $10/month for teams"
  };
  
  // 字段 6：优缺点（各 3-5 个）
  pros: string[];
  cons: string[];
  
  // 字段 7：快速上手指南（3-5 步）
  quickStart: string[];
  
  // Metadata
  generatedAt: string;
  source: 'ai' | 'fmhy' | 'manual';
  version: number;
}

/**
 * Get resource content (from cache or generate)
 */
export function getResourceContent(resourceId: string): ResourceContentTemplate | null {
  try {
    // Try to load from cache
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(process.cwd(), 'public', 'data', 'generated-content', `${resourceId}.json`);
    
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Save resource content to cache
 */
export function saveResourceContent(resourceId: string, content: ResourceContentTemplate): void {
  const fs = require('fs');
  const path = require('path');
  const dir = path.join(process.cwd(), 'public', 'data', 'generated-content');
    
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
    
  const filePath = path.join(dir, `${resourceId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
}

/**
 * Generate mock content (for testing without API key)
 */
export function generateMockContent(resourceName: string, categoryName: string): ResourceContentTemplate {
  return {
    introduction: `${resourceName} is a popular tool in the ${categoryName} category. It provides users with a free, accessible solution that can be used directly in the browser without installation. The tool is well-regarded in the community and offers a clean, intuitive interface.`,
    features: [
      `Easy to use with intuitive interface`,
      `Free to use with no registration required`,
      `Regular updates with new features`,
      `Active community support`,
    ],
    useCases: [
      `Personal projects and prototyping`,
      `Learning and skill development`,
      `Small team collaboration`,
    ],
    alternatives: [
      { name: 'Alternative 1', reason: 'Similar features with different approach' },
      { name: 'Alternative 2', reason: 'Open source alternative with self-hosting option' },
    ],
    pricing: {
      type: 'free',
      description: '100% free to use, no credit card required',
    },
    pros: [
      'Completely free to use',
      'No registration required',
      'Clean and intuitive interface',
    ],
    cons: [
      'Limited advanced features',
      'Requires internet connection',
    ],
    quickStart: [
      'Visit the official website',
      'Start using immediately in browser',
      'Check documentation for advanced tips',
    ],
    generatedAt: new Date().toISOString(),
    source: 'fmhy',
    version: 1,
  };
}
