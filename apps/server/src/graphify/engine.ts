/**
 * Graphify Engine
 *
 * Transforms project artifacts (source code, markdown docs, API specs) into a
 * queryable knowledge graph of entities and their relationships.  This allows
 * downstream agents to ask targeted questions such as
 * "What endpoints does the Frontend consume?" instead of ingesting whole files.
 */

export type GraphNodeType =
  | 'project'
  | 'milestone'
  | 'department'
  | 'agent'
  | 'artifact'
  | 'api_endpoint'
  | 'api_route'
  | 'database_table'
  | 'database_column'
  | 'component'
  | 'function'
  | 'type'
  | 'interface'
  | 'file'
  | 'doc'
  | 'module'
  | 'secret'
  | 'env_var';

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  department?: string;
  agentRole?: string;
  agentName?: string;
  filePath?: string;
  lineStart?: number;
  lineEnd?: number;
  properties: Record<string, any>;
}

export type GraphEdgeType =
  | 'belongs_to'
  | 'depends_on'
  | 'produces'
  | 'consumes'
  | 'validates'
  | 'calls'
  | 'imports'
  | 'defines'
  | 'defined_in'
  | 'implements'
  | 'references'
  | 'uses'
  | 'contains'
  | 'exposes'
  | 'reads'
  | 'writes'
  | 'owns';

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: GraphEdgeType;
  properties?: Record<string, any>;
}

export interface ArtifactContent {
  artifactId: string;
  taskId?: string | null;
  agentRole?: string | null;
  agentName?: string | null;
  path?: string;
  content: string;
  type?: string;
  createdAt?: string;
}

export interface GraphifyResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export class GraphifyEngine {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, GraphEdge> = new Map();

  ingestProjectArtifacts(
    projectId: string,
    projectName: string,
    goal: string,
    milestones: Array<{ id: string; department: string; leadRole: string; leadName: string; directive: string }> = [],
    agents: Array<{ id: string; role: string; name: string; department?: string }> = [],
    artifacts: ArtifactContent[] = []
  ): GraphifyResult {
    this.nodes.clear();
    this.edges.clear();

    const projectNode = this.addNode({
      id: `project:${projectId}`,
      type: 'project',
      label: projectName,
      properties: { goal },
    });

    // Add milestone nodes and link to project
    for (const m of milestones) {
      const mNode = this.addNode({
        id: m.id,
        type: 'milestone',
        label: m.directive.slice(0, 80),
        department: m.department,
        properties: { leadRole: m.leadRole, leadName: m.leadName },
      });
      this.addEdge(m.id, projectNode.id, 'belongs_to');

      const deptNode = this.getOrCreateDepartmentNode(m.department);
      this.addEdge(m.id, deptNode.id, 'belongs_to');
    }

    // Add agent nodes
    for (const agent of agents) {
      const agentNode = this.addNode({
        id: `agent:${agent.id}`,
        type: 'agent',
        label: agent.name || agent.role,
        agentRole: agent.role,
        agentName: agent.name,
        department: agent.department,
        properties: { role: agent.role },
      });
      const dept = agent.department || this.departmentForRole(agent.role);
      if (dept) {
        const deptNode = this.getOrCreateDepartmentNode(dept);
        this.addEdge(agentNode.id, deptNode.id, 'belongs_to');
      }
      this.addEdge(agentNode.id, projectNode.id, 'owns');
    }

    // Parse each artifact
    for (const artifact of artifacts) {
      this.ingestArtifact(artifact, projectNode.id);
    }

    return { nodes: Array.from(this.nodes.values()), edges: Array.from(this.edges.values()) };
  }

  private ingestArtifact(artifact: ArtifactContent, projectNodeId: string): void {
    const artifactNode = this.addNode({
      id: `artifact:${artifact.artifactId}`,
      type: 'artifact',
      label: artifact.path || `Artifact ${artifact.artifactId}`,
      agentRole: artifact.agentRole ?? undefined,
      agentName: artifact.agentName ?? undefined,
      filePath: artifact.path ?? undefined,
      properties: { taskId: artifact.taskId, type: artifact.type, createdAt: artifact.createdAt },
    });

    this.addEdge(artifactNode.id, projectNodeId, 'belongs_to');

    if (artifact.agentRole) {
      const agent = Array.from(this.nodes.values()).find(
        (n) => n.type === 'agent' && n.agentRole === artifact.agentRole
      );
      if (agent) {
        this.addEdge(agent.id, artifactNode.id, 'produces');
      }
    }

    // Choose parser by path/name hints
    const path = artifact.path?.toLowerCase() || '';
    const content = artifact.content || '';

    if (path.includes('schema') || path.endsWith('.prisma')) {
      this.parsePrismaSchema(content, artifactNode.id);
    } else if (path.includes('api') || path.includes('route') || path.endsWith('.ts') || path.endsWith('.js')) {
      this.parseApiCode(content, artifactNode.id);
    } else if (path.endsWith('.tsx') || path.endsWith('.jsx') || content.includes('React')) {
      this.parseReactComponents(content, artifactNode.id);
    } else if (path.endsWith('.md')) {
      this.parseMarkdownDoc(content, artifactNode.id);
    } else {
      // Generic code extraction: functions and types
      this.parseGenericCode(content, artifactNode.id);
    }
  }

  private parsePrismaSchema(content: string, artifactId: string): void {
    const modelRegex = /model\s+(\w+)\s*\{([\s\S]*?)\}/g;
    let match: RegExpExecArray | null;
    while ((match = modelRegex.exec(content)) !== null) {
      const tableName = match[1];
      const body = match[2];
      const tableNode = this.addNode({
        id: `${artifactId}:table:${tableName}`,
        type: 'database_table',
        label: tableName,
        properties: {},
      });
      this.addEdge(tableNode.id, artifactId, 'defined_in');

      const lines = body.split('\n');
      lines.forEach((line, idx) => {
        const fieldMatch = line.match(/^\s*(\w+)\s+(\w+)(.*)$/);
        if (fieldMatch) {
          const [_, name, type, rest] = fieldMatch;
          const colNode = this.addNode({
            id: `${artifactId}:column:${tableName}.${name}`,
            type: 'database_column',
            label: `${tableName}.${name}`,
            properties: { dataType: type, attributes: rest.trim() },
          });
          this.addEdge(colNode.id, tableNode.id, 'belongs_to');
        }
      });
    }
  }

  private parseApiCode(content: string, artifactId: string): void {
    // Match Fastify/Express route declarations
    const routeRegex = /\.(get|post|put|patch|delete|head|options)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
    let match: RegExpExecArray | null;
    while ((match = routeRegex.exec(content)) !== null) {
      const method = (match[1] || 'get').toUpperCase();
      const path = match[2];
      const routeNode = this.addNode({
        id: `${artifactId}:route:${method}:${path}`,
        type: 'api_route',
        label: `${method} ${path}`,
        properties: { method, path },
      });
      this.addEdge(routeNode.id, artifactId, 'defined_in');
    }

    this.parseGenericCode(content, artifactId);
  }

  private parseReactComponents(content: string, artifactId: string): void {
    // Match function components and default exports
    const componentRegex = /(?:export\s+default\s+function|function|const)\s+(\w+)\s*(?:[:=]\s*(?:React\.)?FC|<[^>]*>)?\s*\(/g;
    let match: RegExpExecArray | null;
    while ((match = componentRegex.exec(content)) !== null) {
      const name = match[1];
      if (/^[A-Z]/.test(name)) {
        const compNode = this.addNode({
          id: `${artifactId}:component:${name}`,
          type: 'component',
          label: name,
          properties: {},
        });
        this.addEdge(compNode.id, artifactId, 'defined_in');
      }
    }

    this.parseGenericCode(content, artifactId);
  }

  private parseMarkdownDoc(content: string, artifactId: string): void {
    // Extract headings as doc sections
    const headingRegex = /^(#{1,3})\s+(.+)$/gm;
    let match: RegExpExecArray | null;
    while ((match = headingRegex.exec(content)) !== null) {
      const depth = match[1].length;
      const title = match[2];
      const docNode = this.addNode({
        id: `${artifactId}:doc:${title.replace(/\W+/g, '_').toLowerCase()}`,
        type: 'doc',
        label: title,
        properties: { depth },
      });
      this.addEdge(docNode.id, artifactId, 'contains');
    }
  }

  private parseGenericCode(content: string, artifactId: string): void {
    // Functions
    const fnRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/g;
    let match: RegExpExecArray | null;
    while ((match = fnRegex.exec(content)) !== null) {
      const fnNode = this.addNode({
        id: `${artifactId}:fn:${match[1]}`,
        type: 'function',
        label: match[1],
        properties: {},
      });
      this.addEdge(fnNode.id, artifactId, 'defined_in');
    }

    // Interfaces
    const interfaceRegex = /interface\s+(\w+)(?:\s+extends\s+([\w,\s]+))?\s*\{/g;
    while ((match = interfaceRegex.exec(content)) !== null) {
      const ifaceNode = this.addNode({
        id: `${artifactId}:interface:${match[1]}`,
        type: 'interface',
        label: match[1],
        properties: { extends: match[2]?.split(',').map((s) => s.trim()) },
      });
      this.addEdge(ifaceNode.id, artifactId, 'defined_in');
    }

    // Types
    const typeRegex = /type\s+(\w+)\s*=\s*/g;
    while ((match = typeRegex.exec(content)) !== null) {
      const typeNode = this.addNode({
        id: `${artifactId}:type:${match[1]}`,
        type: 'type',
        label: match[1],
        properties: {},
      });
      this.addEdge(typeNode.id, artifactId, 'defined_in');
    }

    // Cross-reference: functions calling other functions within same artifact
    const fns = Array.from(this.nodes.values()).filter((n) => n.id.startsWith(`${artifactId}:fn:`));
    for (const fn of fns) {
      const name = fn.label;
      const callRegex = new RegExp(`\\b${name}\\s*\\(`, 'g');
      let callMatch: RegExpExecArray | null;
      while ((callMatch = callRegex.exec(content)) !== null) {
        // avoid self edge at definition site
        const before = content.slice(Math.max(0, callMatch.index - 40), callMatch.index);
        if (!before.includes(`function ${name}`)) {
          this.addEdge(fn.id, `${artifactId}:fn:${name}`, 'calls');
        }
      }
    }
  }

  /**
   * Query helpers for agents
   */
  findNodesByType(type: GraphNodeType): GraphNode[] {
    return Array.from(this.nodes.values()).filter((n) => n.type === type);
  }

  findNeighbors(nodeId: string, direction: 'out' | 'in' | 'both' = 'both'): GraphNode[] {
    const neighborIds = new Set<string>();
    for (const edge of this.edges.values()) {
      if (direction !== 'in' && edge.source === nodeId) neighborIds.add(edge.target);
      if (direction !== 'out' && edge.target === nodeId) neighborIds.add(edge.source);
    }
    return Array.from(neighborIds).map((id) => this.nodes.get(id)).filter(Boolean) as GraphNode[];
  }

  private addNode(node: GraphNode): GraphNode {
    if (!this.nodes.has(node.id)) {
      this.nodes.set(node.id, node);
    }
    return this.nodes.get(node.id)!;
  }

  private addEdge(source: string, target: string, type: GraphEdgeType): GraphEdge {
    const id = `${source}|${type}|${target}`;
    if (!this.edges.has(id)) {
      this.edges.set(id, { id, source, target, type });
    }
    return this.edges.get(id)!;
  }

  private getOrCreateDepartmentNode(department: string): GraphNode {
    const id = `department:${department}`;
    if (!this.nodes.has(id)) {
      this.nodes.set(id, {
        id,
        type: 'department',
        label: department,
        properties: {},
      });
    }
    return this.nodes.get(id)!;
  }

  private departmentForRole(role: string): string | undefined {
    const map: Record<string, string> = {
      orchestrator: 'executive',
      'business-strategist': 'executive',
      'product-manager': 'product',
      'business-analyst': 'product',
      'ux-researcher': 'product',
      'product-analyst': 'product',
      'ui-ux-designer': 'design',
      'design-system-designer': 'design',
      'brand-designer': 'design',
      'backend-engineer': 'engineering',
      'frontend-engineer': 'engineering',
      'mobile-engineer': 'engineering',
      'qa-engineer': 'engineering',
      'security-engineer': 'engineering',
      'penetration-tester': 'engineering',
      devops: 'engineering',
      'performance-engineer': 'engineering',
      'ai-engineer': 'engineering',
      'digital-marketer': 'growth',
      'seo-specialist': 'growth',
      'content-creator': 'growth',
      'growth-analyst': 'growth',
      'sales-representative': 'sales',
      'sales-researcher': 'sales',
      'account-manager': 'sales',
      'customer-service': 'customer',
      'customer-success': 'customer',
      'data-engineer': 'data',
      'data-analyst': 'data',
      'operations-manager': 'operations',
    };
    return map[role];
  }
}

export const graphifyEngine = new GraphifyEngine();
