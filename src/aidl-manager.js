import path from 'path';
import matter from 'gray-matter';
import { FileUtils } from './file-utils.js';

/**
 * AIDL Manager - Handles all AIDL operations
 */
export class AidlManager {
  constructor(baseDir = './.vce') {
    this.baseDir = baseDir;
    this.aidlDir = path.join(baseDir, 'aidl');
    this.indexPath = path.join(this.aidlDir, 'index.json');
  }

  /**
   * Initialize the AIDL directory structure
   */
  async initialize() {
    await FileUtils.ensureDir(this.aidlDir);
    
    // Create index.json if it doesn't exist
    if (!(await FileUtils.exists(this.indexPath))) {
      const initialIndex = {
        next_adr_seq: 1,
        items: {}
      };
      await FileUtils.writeJsonFileAtomic(this.indexPath, initialIndex);
    }
  }

  /**
   * Generate current date in ISO 8601 format (YYYY-MM-DD)
   */
  getCurrentDate() {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Generate markdown content for AIDL
   */
  generateMarkdown(aidlData) {
    const frontMatter = {
      id: aidlData.id,
      aidl_no: aidlData.adr_no,
      status: aidlData.status,
      date: aidlData.date
    };

    const statusDisplay = aidlData.status === 'SUPERSEDED' && aidlData.superseded_by
      ? `Superseded by ADR-${aidlData.superseded_by}`
      : aidlData.status.charAt(0) + aidlData.status.slice(1).toLowerCase();

    let content = `# ADR-${aidlData.adr_no}: ${aidlData.title}
- **Status**: ${statusDisplay}
- **Date**: ${aidlData.date}

## Context
${aidlData.context}

## Decision
${aidlData.decision}

## Rationale (Drivers)
${aidlData.rationale}

## Consequences (Implications)
**Positive**
${aidlData.consequences.positive.map(item => `- ${item}`).join('\n')}

**Negative / Trade-offs**
${aidlData.consequences.negative.map(item => `- ${item}`).join('\n')}

## Risks & Mitigations
${Object.entries(aidlData.risks).map(([risk, details]) => 
  `- ${risk} — Impact:${details.impact} / Prob:${details.probability} — ${details.mitigation}`
).join('\n')}

## Acceptance Criteria
${aidlData.expected_result.map(item => `- ${item}`).join('\n')}

## Assumptions
${aidlData.assumptions.map(item => `- ${item}`).join('\n')}

## Cost / TCO
- One-off：
${aidlData.cost.one_off.map(item => `  - ${item}`).join('\n')}
- Ongoing：
${aidlData.cost.ongoing.map(item => `  - ${item}`).join('\n')}
`;

    return matter.stringify(content, frontMatter);
  }

  /**
   * Parse markdown content to extract AIDL data
   */
  parseMarkdown(markdownContent) {
    const parsed = matter(markdownContent);
    const frontMatter = parsed.data;
    
    // Extract structured data from content
    // This is a simplified parser - in production you might want more robust parsing
    const content = parsed.content;
    
    return {
      id: frontMatter.id,
      adr_no: frontMatter.aidl_no,
      status: frontMatter.status,
      date: frontMatter.date,
      content: content,
      frontMatter: frontMatter
    };
  }

  /**
   * Create a new AIDL
   */
  async create(params) {
    await this.initialize();

    const { title, id, context, decision, rationale, assumptions, risks, cost, consequences, expected_result } = params;

    // Check if ID already exists
    const aidlPath = path.join(this.aidlDir, `${id}.md`);
    if (await FileUtils.exists(aidlPath)) {
      const error = new Error(`AIDL with ID '${id}' already exists`);
      error.code = 'E_EXISTS';
      throw error;
    }

    // Update index atomically to get next ADR number
    const updatedIndex = await FileUtils.updateJsonFileAtomic(this.indexPath, (currentIndex) => {
      const adrNo = currentIndex.next_adr_seq;
      
      const newItem = {
        title,
        id,
        adr_no: adrNo,
        status: 'PROPOSED',
        date: this.getCurrentDate(),
        superseded_by: ''
      };

      return {
        next_adr_seq: adrNo + 1,
        items: {
          ...currentIndex.items,
          [id]: newItem
        }
      };
    });

    const aidlData = {
      ...updatedIndex.items[id],
      title,
      context,
      decision,
      rationale,
      assumptions,
      risks,
      cost,
      consequences,
      expected_result
    };

    // Create markdown file
    const markdownContent = this.generateMarkdown(aidlData);
    await FileUtils.writeFileAtomic(aidlPath, markdownContent);

    return {
      ok: true,
      message: "AIDL created (status fixed as PROPOSED)",
      id: aidlData.id,
      adr_no: aidlData.adr_no,
      status: aidlData.status,
      date: aidlData.date
    };
  }

  /**
   * Get AIDL by ID
   */
  async get(id) {
    await this.initialize();

    const aidlPath = path.join(this.aidlDir, `${id}.md`);
    if (!(await FileUtils.exists(aidlPath))) {
      const error = new Error(`AIDL with ID '${id}' not found`);
      error.code = 'E_NOT_FOUND';
      throw error;
    }

    // Read from index for metadata
    const index = await FileUtils.readJsonFile(this.indexPath);
    const indexItem = index.items[id];
    
    if (!indexItem) {
      const error = new Error(`AIDL '${id}' found in filesystem but not in index`);
      error.code = 'E_INVALID';
      throw error;
    }

    // Read markdown file for full content
    const markdownContent = await FileUtils.readFile(aidlPath);
    const parsed = this.parseMarkdown(markdownContent);

    // Extract structured data from markdown content
    // This is a simplified extraction - you might want more robust parsing
    const lines = parsed.content.split('\n');
    let currentSection = '';
    const extractedData = {
      title: '',
      context: '',
      decision: '',
      rationale: '',
      assumptions: [],
      risks: {},
      consequences: { positive: [], negative: [] },
      expected_result: [],
      cost: { one_off: [], ongoing: [] }
    };

    // Extract title from first heading
    const titleMatch = lines.find(line => line.startsWith('# ADR-'));
    if (titleMatch) {
      extractedData.title = titleMatch.replace(/^# ADR-\d+:\s*/, '');
    }

    // Simple section-based parsing
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('## Context')) {
        currentSection = 'context';
        continue;
      } else if (line.startsWith('## Decision')) {
        currentSection = 'decision';
        continue;
      } else if (line.startsWith('## Rationale')) {
        currentSection = 'rationale';
        continue;
      } else if (line.startsWith('## Assumptions')) {
        currentSection = 'assumptions';
        continue;
      } else if (line.startsWith('## Risks')) {
        currentSection = 'risks';
        continue;
      } else if (line.startsWith('## Consequences')) {
        currentSection = 'consequences';
        continue;
      } else if (line.startsWith('## Acceptance')) {
        currentSection = 'expected_result';
        continue;
      } else if (line.startsWith('## Cost')) {
        currentSection = 'cost';
        continue;
      } else if (line.startsWith('##') || line.startsWith('**')) {
        currentSection = '';
        continue;
      }

      // Process content based on current section
      if (currentSection && line) {
        switch (currentSection) {
          case 'context':
          case 'decision':
          case 'rationale':
            if (!line.startsWith('-') && !line.startsWith('**')) {
              extractedData[currentSection] += (extractedData[currentSection] ? '\n' : '') + line;
            }
            break;
          case 'assumptions':
          case 'expected_result':
            if (line.startsWith('- ')) {
              extractedData[currentSection].push(line.substring(2));
            }
            break;
          case 'risks':
            if (line.startsWith('- ')) {
              const riskMatch = line.match(/^- (.+?) — Impact:(\w+) \/ Prob:(\w+) — (.+)$/);
              if (riskMatch) {
                extractedData.risks[riskMatch[1]] = {
                  impact: riskMatch[2],
                  probability: riskMatch[3],
                  mitigation: riskMatch[4]
                };
              }
            }
            break;
        }
      }
    }

    return {
      ...indexItem,
      ...extractedData
    };
  }

  /**
   * Search AIDLs by title
   */
  async search(keyword) {
    await this.initialize();

    const index = await FileUtils.readJsonFile(this.indexPath);
    const results = {};

    const lowerKeyword = keyword.toLowerCase();
    
    // Sort by date (most recent first) then search
    const sortedItems = Object.values(index.items)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    for (const item of sortedItems) {
      if (item.title.toLowerCase().includes(lowerKeyword)) {
        results[item.title] = item.id;
      }
    }

    return results;
  }

  /**
   * Full-text search across AIDL content
   */
  async detailSearch(keyword) {
    await this.initialize();

    const results = [];
    const files = await FileUtils.listFiles(this.aidlDir, '\\.md$');
    
    for (const file of files) {
      const filePath = path.join(this.aidlDir, file);
      const content = await FileUtils.readFile(filePath);
      const parsed = this.parseMarkdown(content);
      
      // Remove markdown formatting for search
      const plainText = content
        .replace(/^---[\s\S]*?---/m, '') // Remove front matter
        .replace(/#{1,6}\s+/g, '') // Remove headers
        .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.+?)\*/g, '$1') // Remove italic
        .replace(/`(.+?)`/g, '$1') // Remove code
        .replace(/\[(.+?)\]\(.+?\)/g, '$1'); // Remove links

      const lowerContent = plainText.toLowerCase();
      const lowerKeyword = keyword.toLowerCase();
      
      const index = lowerContent.indexOf(lowerKeyword);
      if (index !== -1) {
        // Count occurrences
        const occurrences = (lowerContent.match(new RegExp(lowerKeyword, 'g')) || []).length;
        
        // Extract context (300 chars before and after)
        const start = Math.max(0, index - 300);
        const end = Math.min(plainText.length, index + keyword.length + 300);
        const contextText = plainText.substring(start, end);
        
        // Get title from index
        const id = path.basename(file, '.md');
        const index_data = await FileUtils.readJsonFile(this.indexPath);
        const title = index_data.items[id]?.title || 'Unknown';
        
        results.push({
          name: title,
          id: id,
          position: index,
          occurrences: occurrences,
          result: `...${contextText}...`
        });
      }
    }

    // Sort by relevance (occurrences desc, then position asc)
    results.sort((a, b) => {
      if (a.occurrences !== b.occurrences) {
        return b.occurrences - a.occurrences;
      }
      return a.position - b.position;
    });

    return results;
  }

  /**
   * Update AIDL status
   */
  async updateStatus(id, newStatus) {
    await this.initialize();

    // Validate status transition
    const validStatuses = ['PROPOSED', 'ACCEPTED', 'REJECTED', 'FINISHED', 'FAILED'];
    if (!validStatuses.includes(newStatus)) {
      const error = new Error(`Invalid status: ${newStatus}. Use aidl_supersede for SUPERSEDED status.`);
      error.code = 'E_INVALID';
      throw error;
    }

    const aidlPath = path.join(this.aidlDir, `${id}.md`);
    if (!(await FileUtils.exists(aidlPath))) {
      const error = new Error(`AIDL with ID '${id}' not found`);
      error.code = 'E_NOT_FOUND';
      throw error;
    }

    // Update index
    const updatedIndex = await FileUtils.updateJsonFileAtomic(this.indexPath, (currentIndex) => {
      if (!currentIndex.items[id]) {
        const error = new Error(`AIDL '${id}' not found in index`);
        error.code = 'E_NOT_FOUND';
        throw error;
      }

      const currentStatus = currentIndex.items[id].status;
      
      // Validate status transitions
      if (currentStatus === 'SUPERSEDED') {
        const error = new Error(`Cannot change status of superseded AIDL`);
        error.code = 'E_CONFLICT';
        throw error;
      }

      // Update status
      currentIndex.items[id].status = newStatus;
      return currentIndex;
    });

    // Update markdown file
    const markdownContent = await FileUtils.readFile(aidlPath);
    const parsed = matter(markdownContent);
    
    // Update front matter
    parsed.data.status = newStatus;
    
    // Update status line in content
    const statusDisplay = newStatus.charAt(0) + newStatus.slice(1).toLowerCase();
    const updatedContent = parsed.content.replace(
      /^- \*\*Status\*\*:.*$/m,
      `- **Status**: ${statusDisplay}`
    );
    
    const newMarkdownContent = matter.stringify(updatedContent, parsed.data);
    await FileUtils.writeFileAtomic(aidlPath, newMarkdownContent);

    return {
      ok: true,
      message: `AIDL status updated to ${newStatus}`,
      id: id,
      status: newStatus,
      date: updatedIndex.items[id].date
    };
  }

  /**
   * Mark AIDL as superseded
   */
  async supersede(id, supersededBy) {
    await this.initialize();

    const aidlPath = path.join(this.aidlDir, `${id}.md`);
    if (!(await FileUtils.exists(aidlPath))) {
      const error = new Error(`AIDL with ID '${id}' not found`);
      error.code = 'E_NOT_FOUND';
      throw error;
    }

    // Read index to validate superseded_by
    const index = await FileUtils.readJsonFile(this.indexPath);
    
    // Check if superseded_by is an ID or ADR number
    let supersededByAdrNo;
    let supersededById;
    
    if (/^\d+$/.test(supersededBy)) {
      // It's an ADR number
      supersededByAdrNo = parseInt(supersededBy);
      supersededById = Object.keys(index.items).find(
        itemId => index.items[itemId].adr_no === supersededByAdrNo
      );
    } else {
      // It's an ID
      supersededById = supersededBy;
      supersededByAdrNo = index.items[supersededById]?.adr_no;
    }

    if (!supersededById || !index.items[supersededById]) {
      const error = new Error(`Superseding AIDL '${supersededBy}' not found`);
      error.code = 'E_NOT_FOUND';
      throw error;
    }

    if (supersededById === id) {
      const error = new Error(`AIDL cannot supersede itself`);
      error.code = 'E_INVALID';
      throw error;
    }

    // Update index
    const updatedIndex = await FileUtils.updateJsonFileAtomic(this.indexPath, (currentIndex) => {
      currentIndex.items[id].status = 'SUPERSEDED';
      currentIndex.items[id].superseded_by = supersededByAdrNo.toString();
      return currentIndex;
    });

    // Update markdown file
    const markdownContent = await FileUtils.readFile(aidlPath);
    const parsed = matter(markdownContent);
    
    // Update front matter
    parsed.data.status = 'SUPERSEDED';
    
    // Update status line in content
    const statusDisplay = `Superseded by ADR-${supersededByAdrNo}`;
    const updatedContent = parsed.content.replace(
      /^- \*\*Status\*\*:.*$/m,
      `- **Status**: ${statusDisplay}`
    );
    
    const newMarkdownContent = matter.stringify(updatedContent, parsed.data);
    await FileUtils.writeFileAtomic(aidlPath, newMarkdownContent);

    return {
      ok: true,
      message: `AIDL superseded by ADR-${supersededByAdrNo}`,
      id: id,
      status: 'SUPERSEDED',
      superseded_by: supersededByAdrNo.toString()
    };
  }

  /**
   * Update AIDL fields
   */
  async update(params) {
    await this.initialize();

    const { id, ...updateFields } = params;
    
    // Validate that only allowed fields are being updated
    const allowedFields = ['title', 'context', 'decision', 'rationale', 'assumptions', 'risks', 'cost', 'consequences', 'expected_result'];
    const invalidFields = Object.keys(updateFields).filter(field => !allowedFields.includes(field));
    
    if (invalidFields.length > 0) {
      const error = new Error(`Cannot update fields: ${invalidFields.join(', ')}`);
      error.code = 'E_INVALID';
      throw error;
    }

    const aidlPath = path.join(this.aidlDir, `${id}.md`);
    if (!(await FileUtils.exists(aidlPath))) {
      const error = new Error(`AIDL with ID '${id}' not found`);
      error.code = 'E_NOT_FOUND';
      throw error;
    }

    // Check if AIDL is superseded
    const index = await FileUtils.readJsonFile(this.indexPath);
    if (index.items[id]?.status === 'SUPERSEDED') {
      const error = new Error(`Cannot update superseded AIDL`);
      error.code = 'E_CONFLICT';
      throw error;
    }

    // Get current AIDL data
    const currentData = await this.get(id);
    
    // Merge updates
    const updatedData = { ...currentData, ...updateFields };

    // Update title in index if provided
    if (updateFields.title) {
      await FileUtils.updateJsonFileAtomic(this.indexPath, (currentIndex) => {
        currentIndex.items[id].title = updateFields.title;
        return currentIndex;
      });
    }

    // Regenerate markdown
    const markdownContent = this.generateMarkdown(updatedData);
    await FileUtils.writeFileAtomic(aidlPath, markdownContent);

    return {
      ok: true,
      message: "AIDL updated successfully",
      id: id,
      updated_fields: Object.keys(updateFields)
    };
  }

  /**
   * List AIDLs with filtering and pagination
   */
  async list(params = {}) {
    await this.initialize();

    const { status, from, to, page = 1, page_size = 20 } = params;
    
    const index = await FileUtils.readJsonFile(this.indexPath);
    let items = Object.values(index.items);

    // Apply filters
    if (status) {
      items = items.filter(item => item.status === status);
    }

    if (from) {
      const fromDate = new Date(from);
      items = items.filter(item => new Date(item.date) >= fromDate);
    }

    if (to) {
      const toDate = new Date(to);
      items = items.filter(item => new Date(item.date) <= toDate);
    }

    // Sort by date (most recent first)
    items.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Pagination
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / page_size);
    const startIndex = (page - 1) * page_size;
    const endIndex = startIndex + page_size;
    const paginatedItems = items.slice(startIndex, endIndex);

    return {
      items: paginatedItems,
      pagination: {
        page,
        page_size,
        total_items: totalItems,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    };
  }
}