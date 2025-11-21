

"use client";
import React, { useState, useRef, useEffect } from 'react';
import { FaSave, FaTimes, FaPlay } from 'react-icons/fa';
import Link from 'next/link';
import { useAppContext } from '@/contexts/AppContext';
import { apiRequest } from '@/utils';
import { useApiCall } from "@/hooks/useApiCall";
import { useNotification } from '@/contexts/NotificationContext';
import { workflowApi } from '@/services/apiService';
import BlockSettings from './WorkflowBlockSettings';
import { NODE_TYPES, block_data } from './workflowConstants';
import type { BlockInstance, BlockDataItem, BlockFunctionInfo, SettingsValue, NestedFieldItem } from './workflowConstants';
import Loading from '@/components/Loading';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'delay' | 'end';
  label: string;
  description?: string;
  x: number;
  y: number;
  config?: { blocks?: BlockInstance[] } | Record<string, unknown>;
}

interface WorkflowEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  condition?: string;
}

interface WorkflowEditorProps {
  workflow_Id: string | null;
}

export default function WorkflowEditor({ workflow_Id }: WorkflowEditorProps) {
  const { showNotification } = useNotification();
  const { isLoading: isLoadingGetWorkflow, execute: executeGetWorkflowAsync } = useApiCall();
  const { isLoading: isLoadingSaving, execute: executeSavingAsync } = useApiCall();

  const [workflowId, setWorkflowId] = useState<string | null>(workflow_Id);
  const { sidebarHidden } = useAppContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    { id: '1', type: 'trigger', label: 'Trigger', description: 'Start your workflow', x: 350, y: 100 }
  ]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [addStep, setAddStep] = useState(true);
  const [setStep, setSetStep] = useState(true);
  const [workflowName, setWorkflowName] = useState('New Workflow');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [tempLine, setTempLine] = useState<{ x: number; y: number } | null>(null);
  const [showAddBlockSelector, setShowAddBlockSelector] = useState(false);
  const [addBlockKey, setAddBlockKey] = useState<string | null>(null);
  const [addBlockSubKey, setAddBlockSubKey] = useState<string | null>(null);
  const [addBlockInitialValue, setAddBlockInitialValue] = useState<SettingsValue>(null);
  const [addBlockOperator, setAddBlockOperator] = useState<string | null>(null);
  const [addBlockCandidates, setAddBlockCandidates] = useState<string[]>([]);
  // For multiple values/operators (when format.length > 1)
  const [addBlockMultipleValues, setAddBlockMultipleValues] = useState<Record<number, SettingsValue>>({});
  const [addBlockMultipleOperators, setAddBlockMultipleOperators] = useState<Record<number, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Store file objects for workflow blocks
  // Structure: { nodeId: { blockIndex: { fieldKey: File[] } } }
  const [workflowFiles, setWorkflowFiles] = useState<Record<string, Record<number, Record<string, File[]>>>>({});
  // Temporary files for the add block dialog
  const [addBlockFiles, setAddBlockFiles] = useState<Record<number, File[]>>({});

  // Load workflow data if editing existing workflow
  useEffect(() => {
    const loadWorkflow = async () => {
      if (!workflowId) return;
      if (workflowId === 'new') return;
      setIsLoading(true);
      try {
        const result = await executeGetWorkflowAsync(async () => {
          return await workflowApi.getWorkflow(workflowId);
        });
        if (result.workflow) {
          setWorkflowName(result.workflow.name || 'Untitled Workflow');
          setNodes(result.workflow.nodes || [{ id: '1', type: 'trigger', label: 'Trigger', description: 'Start your workflow', x: 350, y: 100 }]);
          setEdges(result.workflow.edges || []);
        }
      } catch (error) {
        console.error('Error loading workflow:', error);
        showNotification('Failed to load workflow', "error", true)
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkflow();
  }, [workflowId, executeGetWorkflowAsync, showNotification]);

  useEffect(() => {
    // Prepare candidates for the add-selector when user opens add flow
    if (!showAddBlockSelector || !addBlockKey) {
      setAddBlockCandidates([]);
      return;
    }

    const selected = block_data[addBlockKey];
    const target: BlockDataItem | undefined = selected;

    // Check if this is a nested field (like message_filter)
    if (addBlockSubKey && selected && selected.value && typeof selected.value === 'object' && !Array.isArray(selected.value)) {
      const nestedValue = selected.value as Record<string, NestedFieldItem>;
      const nestedField = nestedValue[addBlockSubKey];
      if (nestedField) {
        // For nested fields, we need to check their format
        let mounted = true;
        const fetchCandidates = async () => {
          if (nestedField.format === 'calling_api' && nestedField.source) {
            try {
              const res = await apiRequest(nestedField.source, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
              if (res && res.ok) {
                const json = await res.json();
                if (mounted) setAddBlockCandidates(json.values || json || []);
                return;
              }
            } catch {
              // ignore
            }
            if (mounted) setAddBlockCandidates([]);
          } else if (nestedField.format === 'static' && Array.isArray(nestedField.value)) {
            if (mounted) setAddBlockCandidates(nestedField.value);
          } else {
            if (mounted) setAddBlockCandidates([]);
          }
        };
        fetchCandidates();
        return () => { mounted = false };
      }
    }

    // For non-nested fields with new array structure
    let mounted = true;
    const fetchCandidates = async () => {
      if (target && target.format && target.format.length > 0) {
        const firstFormat = target.format[0];
        if (firstFormat === 'calling_api' && target.source) {
          try {
            const res = await apiRequest(target.source, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
            if (res && res.ok) {
              const json = await res.json();
              if (mounted) setAddBlockCandidates(json.values || json || []);
              return;
            }
          } catch {
            // ignore
          }
          if (mounted) setAddBlockCandidates([]);
        } else if (firstFormat === 'static' && Array.isArray(target.value) && target.value.length > 0) {
          const firstValue = target.value[0];
          if (firstValue && firstValue.options && Array.isArray(firstValue.options)) {
            if (mounted) setAddBlockCandidates(firstValue.options);
          } else {
            if (mounted) setAddBlockCandidates([]);
          }
        } else {
          if (mounted) setAddBlockCandidates([]);
        }
      } else {
        if (mounted) setAddBlockCandidates([]);
      }
    };
    fetchCandidates();
    return () => { mounted = false };
  }, [showAddBlockSelector, addBlockKey, addBlockSubKey]);

  const nodeWidth = 140;
  const nodeHeight = 80;

  // Helper function to calculate the nearest connection points between two nodes
  const getNearestConnectionPoints = (
    fromNode: WorkflowNode,
    toNode: WorkflowNode
  ): { fromX: number; fromY: number; toX: number; toY: number } => {
    // Define the four connection points for each node (top, right, bottom, left)
    const fromPoints = {
      top: { x: fromNode.x, y: fromNode.y - nodeHeight / 2 },
      right: { x: fromNode.x + nodeWidth / 2, y: fromNode.y },
      bottom: { x: fromNode.x, y: fromNode.y + nodeHeight / 2 },
      left: { x: fromNode.x - nodeWidth / 2, y: fromNode.y },
    };

    const toPoints = {
      top: { x: toNode.x, y: toNode.y - nodeHeight / 2 },
      right: { x: toNode.x + nodeWidth / 2, y: toNode.y },
      bottom: { x: toNode.x, y: toNode.y + nodeHeight / 2 },
      left: { x: toNode.x - nodeWidth / 2, y: toNode.y },
    };

    // Find the pair of points with the shortest distance
    let minDistance = Infinity;
    let bestFromPoint = fromPoints.right;
    let bestToPoint = toPoints.left;

    Object.entries(fromPoints).forEach(([, fromPoint]) => {
      Object.entries(toPoints).forEach(([, toPoint]) => {
        const distance = Math.sqrt(
          Math.pow(toPoint.x - fromPoint.x, 2) + Math.pow(toPoint.y - fromPoint.y, 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          bestFromPoint = fromPoint;
          bestToPoint = toPoint;
        }
      });
    });

    return {
      fromX: bestFromPoint.x,
      fromY: bestFromPoint.y,
      toX: bestToPoint.x,
      toY: bestToPoint.y,
    };
  };

  // Helper function to draw arrow between two points
  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: string,
    lineWidth: number
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Draw arrowhead
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const arrowSize = 12;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - arrowSize * Math.cos(angle - Math.PI / 6), toY - arrowSize * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - arrowSize * Math.cos(angle + Math.PI / 6), toY - arrowSize * Math.sin(angle + Math.PI / 6));
    ctx.fill();
  };

  // Draw the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Draw edges
    edges.forEach((edge) => {
      const fromNode = nodes.find((n) => n.id === edge.from);
      const toNode = nodes.find((n) => n.id === edge.to);
      if (fromNode && toNode) {
        const { fromX, fromY, toX, toY } = getNearestConnectionPoints(fromNode, toNode);
        drawArrow(ctx, fromX, fromY, toX, toY, '#cbd5e1', 2);
      }
    });

    // Draw temporary connection line while connecting
    if (isConnecting && connectFrom && tempLine) {
      const fromNode = nodes.find((n) => n.id === connectFrom);
      if (fromNode) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(fromNode.x + nodeWidth / 2, fromNode.y);
        ctx.lineTo(tempLine.x, tempLine.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Draw nodes
    nodes.forEach((node) => {
      const isSelected = node.id === selectedNode;
      const nodeConfig = NODE_TYPES[node.type];

      // Draw node background
      ctx.fillStyle = isSelected ? nodeConfig.bgColor : '#ffffff';
      ctx.strokeStyle = isSelected ? nodeConfig.color : '#e2e8f0';
      ctx.lineWidth = isSelected ? 3 : 2;

      // Draw rounded rectangle
      const radius = 8;
      ctx.beginPath();
      ctx.moveTo(node.x - nodeWidth / 2 + radius, node.y - nodeHeight / 2);
      ctx.lineTo(node.x + nodeWidth / 2 - radius, node.y - nodeHeight / 2);
      ctx.quadraticCurveTo(node.x + nodeWidth / 2, node.y - nodeHeight / 2, node.x + nodeWidth / 2, node.y - nodeHeight / 2 + radius);
      ctx.lineTo(node.x + nodeWidth / 2, node.y + nodeHeight / 2 - radius);
      ctx.quadraticCurveTo(node.x + nodeWidth / 2, node.y + nodeHeight / 2, node.x + nodeWidth / 2 - radius, node.y + nodeHeight / 2);
      ctx.lineTo(node.x - nodeWidth / 2 + radius, node.y + nodeHeight / 2);
      ctx.quadraticCurveTo(node.x - nodeWidth / 2, node.y + nodeHeight / 2, node.x - nodeWidth / 2, node.y + nodeHeight / 2 - radius);
      ctx.lineTo(node.x - nodeWidth / 2, node.y - nodeHeight / 2 + radius);
      ctx.quadraticCurveTo(node.x - nodeWidth / 2, node.y - nodeHeight / 2, node.x - nodeWidth / 2 + radius, node.y - nodeHeight / 2);
      ctx.fill();
      ctx.stroke();

      // Draw icon
      ctx.fillStyle = nodeConfig.color;
      ctx.font = 'bold 15px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Draw Type
      ctx.fillStyle = nodeConfig.color;
      ctx.font = 'bold 15px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(nodeConfig.icon + "  " + nodeConfig.label, node.x, node.y - 10);

      // Draw description
      if (node.description) {
        ctx.fillStyle = '#6b7280';
        ctx.font = '11px Arial';
        ctx.fillText(node.description.substring(0, 15), node.x + 10, node.y + 10);
      }
    });
  }, [nodes, edges, selectedNode, isConnecting, connectFrom, tempLine]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Check if clicked on a node
    let clickedNode = null;
    for (const node of nodes) {
      const dx = Math.abs(x - node.x);
      const dy = Math.abs(y - node.y);
      if (dx < nodeWidth / 2 + 10 && dy < nodeHeight / 2 + 10) {
        clickedNode = node.id;
        break;
      }
    }

    setSelectedNode(clickedNode);
    setAddStep(true)
    setSetStep(true)
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedNode) {
      setIsDragging(true);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const node = nodes.find((n) => n.id === selectedNode);
      if (node) {
        setDragOffset({
          x: e.clientX - rect.left - node.x,
          y: e.clientY - rect.top - node.y,
        });
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update temporary line while connecting
    if (isConnecting) {
      setTempLine({ x, y });
    }

    // Drag node
    if (isDragging && selectedNode) {
      const dragX = x - dragOffset.x;
      const dragY = y - dragOffset.y;

      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === selectedNode ? { ...node, x: dragX, y: dragY } : node
        )
      );
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isConnecting && connectFrom) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check if released on a node
      let targetNode = null;
      for (const node of nodes) {
        const dx = Math.abs(x - node.x);
        const dy = Math.abs(y - node.y);
        if (dx < nodeWidth / 2 + 10 && dy < nodeHeight / 2 + 10 && node.id !== connectFrom) {
          targetNode = node.id;
          break;
        }
      }

      // Create edge if valid connection
      if (targetNode) {
        const edgeExists = edges.some((e) => e.from === connectFrom && e.to === targetNode);
        if (!edgeExists) {
          setEdges([
            ...edges,
            {
              id: `${connectFrom}-${targetNode}`,
              from: connectFrom,
              to: targetNode,
            },
          ]);
        }
      }

      setIsConnecting(false);
      setConnectFrom(null);
      setTempLine(null);
    }

    setIsDragging(false);
  };

  const addNode = (type: 'action' | 'condition' | 'delay' | 'end') => {
    const labels: Record<string, string> = {
      action: 'Action',
      condition: 'Condition',
      delay: 'Delay',
      end: 'End',
    };

    // Get position for new node
    let newX = 300;
    let newY = 200;

    // If a node is selected, position new node below it
    if (selectedNode) {
      const selectedNodeObj = nodes.find((n) => n.id === selectedNode);
      if (selectedNodeObj) {
        newX = selectedNodeObj.x;
        newY = selectedNodeObj.y + 120; // Position 120px below
      }
    }

    const newNode: WorkflowNode = {
      id: Date.now().toString(),
      type,
      label: labels[type],
      description: `New ${labels[type]}`,
      x: newX,
      y: newY,
    };
    setNodes([...nodes, newNode]);

    // Auto-connect to selected node if one exists
    if (selectedNode) {
      const newEdge: WorkflowEdge = {
        id: `${selectedNode}-${newNode.id}`,
        from: selectedNode,
        to: newNode.id,
      };
      setEdges([...edges, newEdge]);
    }

    // Select the new node
    setSelectedNode(newNode.id);
    setAddStep(true)
    setSetStep(true)
  };

  const deleteNode = () => {
    if (selectedNode) {
      // Helper function to find all downstream nodes recursively
      const findAllDownstreamNodes = (nodeId: string, visited = new Set<string>()): Set<string> => {
        if (visited.has(nodeId)) return visited;
        visited.add(nodeId);

        // Find all nodes that this node connects to
        const outgoingEdges = edges.filter((e) => e.from === nodeId);
        outgoingEdges.forEach((edge) => {
          findAllDownstreamNodes(edge.to, visited);
        });

        return visited;
      };

      // Find all downstream nodes (including the selected node itself)
      const nodesToDelete = findAllDownstreamNodes(selectedNode);

      // Remove all downstream nodes and their edges
      setNodes((prevNodes) => prevNodes.filter((n) => !nodesToDelete.has(n.id)));
      setEdges((prevEdges) => prevEdges.filter((e) =>
        !nodesToDelete.has(e.from) && !nodesToDelete.has(e.to)
      ));

      setSelectedNode(null);
      setAddStep(false)
      setSetStep(false)
    }
  };

  const deleteEdge = (edgeId: string) => {
    setEdges((prevEdges) => prevEdges.filter((e) => e.id !== edgeId));
  };

  // Helper function to collect all files from workflow blocks
  const collectWorkflowFiles = (): File[] => {
    const allFiles: File[] = [];

    Object.entries(workflowFiles).forEach(([, nodeBlocks]) => {
      Object.entries(nodeBlocks).forEach(([, blockFields]) => {
        Object.entries(blockFields).forEach(([, files]) => {
          allFiles.push(...files);
        });
      });
    });

    return allFiles;
  };

  const saveWorkflow = async () => {
    setIsSaving(true);

    try {
      const workflowData = {
        name: workflowName,
        nodes: nodes,
        edges: edges
      };

      // Collect all files from workflow blocks
      const files = collectWorkflowFiles();

      if (workflowId && workflowId !== 'new') {
        // Update existing workflow
        const result = await executeSavingAsync(async () => {
          return await workflowApi.updateWorkflow(workflowId, workflowData, files);
        });
        if (result?.workflow && result.status == "success") {
          showNotification(`Workflow ${result.workflow.name} updated successfully!`, 'success', true)
        } else {
          showNotification(result.message || `Failed to update a new workflow. Please check your workflow.`, 'error', true)
        }
      } else {
        // Create new workflow
        const result = await executeSavingAsync(async () => {
          return await workflowApi.createWorkflow(workflowData, files);
        });
        if (result?.workflow && result.status == "success") {
          setWorkflowId(result.workflow.id);
          showNotification(`Workflow ${result.workflow.name} created successfully!`, 'success', true)
        } else {
          setWorkflowId(result.workflow.id);
          showNotification(result?.message || `Failed to create a new workflow. Please check your workflow.`, 'error', true)
        }
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
      showNotification(error instanceof Error ? error.message : `Failed to save a workflow. Please check your workflow.`, 'error', true)
    } finally {
      setIsSaving(false);
    }
  };

  const testWorkflow = async () => {
    setIsSaving(true);

    try {
      const workflowData = {
        name: workflowName,
        nodes: nodes,
        edges: edges
      };

      // Collect all files from workflow blocks
      const files = collectWorkflowFiles();

      if (workflowId && workflowId !== 'new') {
        // Update existing workflow
        const result = await executeSavingAsync(async () => {
          return await workflowApi.updateWorkflow(workflowId, workflowData, files);
        });
        if (result?.workflow && result.status == "success") {
          showNotification(`Workflow ${result.workflow.name} updated successfully!`, 'success', true)
        } else {
          showNotification(result.message || `Failed to update a new workflow. Please check your workflow.`, 'error', true)
        }
      } else {
        // Create new workflow
        const result = await executeSavingAsync(async () => {
          return await workflowApi.createWorkflow(workflowData, files);
        });
        if (result?.workflow && result.status == "success") {
          setWorkflowId(result.workflow.id);
          showNotification(`Workflow ${result.workflow.name} created successfully!`, 'success', true)
        } else {
          setWorkflowId(result.workflow.id);
          showNotification(result?.message || `Failed to create a new workflow. Please check your workflow.`, 'error', true)
        }
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
      showNotification(error instanceof Error ? error.message : `Failed to save a workflow. Please check your workflow.`, 'error', true)
    } finally {
      setIsSaving(false);
    }
  };
  // Helper: get possible blocks for a node type
  const getPossibleBlocks = (node_type: string) =>
    Object.entries(block_data).filter(([, item]) => item.enable.includes(node_type));

  // Add a block instance to the currently selected node
  const handleAddBlock = (
    key: string,
    subKey?: string | null,
    initialValue?: SettingsValue,
    operator?: string | null,
    multipleValues?: Record<number, SettingsValue>,
    multipleOperators?: Record<number, string>,
    files?: Record<number, File[]>
  ) => {
    if (!selectedNode || !key) return;

    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== selectedNode) return n;

        // Ensure we have the base block data
        const baseBlock = block_data[key];
        if (!baseBlock) return n;

        const existingBlocks = ((n.config)?.blocks || []) as BlockInstance[];
        // helper to normalize value according to type
        const normalize = (fmt: string | undefined, typ: string | undefined, val: SettingsValue): SettingsValue => {
          if (val === undefined || val === null || val === "") return '';
          if (fmt === 'input') {
            if (typ === 'number') {
              const num = Number(val);
              return Number.isNaN(num) ? String(val) : num;
            }
            if (typ === 'date') {
              try {
                return new Date(String(val)).toISOString().split('T')[0];
              } catch {
                return String(val);
              }
            }
            return String(val);
          }
          // for selects and API results, keep as-is
          return val;
        };

        let itemToUse: BlockDataItem = { ...baseBlock }; // Clone to avoid mutations
        let blockKey = key;

        // Get first format and operator for function_info (for backward compatibility)
        const firstFormat = baseBlock.format && baseBlock.format.length > 0 ? baseBlock.format[0] : 'input';
        const firstOperator = baseBlock.operator && baseBlock.operator.length > 0 ? baseBlock.operator[0] : null;

        const function_info: BlockFunctionInfo = {
          key: key,
          type: firstFormat,
          operator: firstOperator,
          subKey: subKey || null,
        };

        const newSettings: Record<string, SettingsValue | BlockFunctionInfo> = {};

        // Handle nested fields (like message_filter)
        if (subKey && baseBlock.value && typeof baseBlock.value === 'object' && !Array.isArray(baseBlock.value)) {
          const child = (baseBlock.value as Record<string, NestedFieldItem>)[subKey];
          if (child) {
            itemToUse = {
              label: child.label || `${baseBlock.label} - ${subKey}`,
              enable: baseBlock.enable || [],
              operator: [[...child.operator]],  // Wrap in array for new structure
              value: [{}],  // Wrap in array for new structure
              format: [child.format || 'input'],
              type: [child.type || 'text'],
              source: child.source
            };
            blockKey = `${key}.${subKey}`;
            function_info.subKey = subKey;

            // Store value for nested field
            if (initialValue !== undefined && initialValue !== null && initialValue !== '') {
              newSettings["value"] = normalize(child.format, child.type, initialValue);
            }
            // Store operator for nested field
            if (operator && child.operator && child.operator.length > 0) {
              newSettings[`operator`] = operator;
            }
          }
        } else {
          // Top-level block settings with new array structure
          const formatCount = baseBlock.format?.length || 1;

          // Check if we have multiple format pairs
          if (formatCount > 1 && multipleValues && multipleOperators) {
            // Store multiple values and operators
            for (let idx = 0; idx < formatCount; idx++) {
              const pairFormat = baseBlock.format?.[idx] || 'input';
              const pairType = baseBlock.type?.[idx] || 'text';
              const value = multipleValues[idx];
              const op = multipleOperators[idx];

              // Store value for this pair
              if (value !== undefined && value !== null && value !== '') {
                newSettings[`value_${idx}`] = normalize(pairFormat, pairType, value);
              }

              // Store operator for this pair
              if (op && baseBlock.operator?.[idx] && baseBlock.operator[idx].length > 0) {
                newSettings[`operator_${idx}`] = op;
              }
            }
          } else {
            // Single pair - use legacy approach
            const pairFormat = baseBlock.format && baseBlock.format.length > 0 ? baseBlock.format[0] : 'input';
            const pairType = baseBlock.type && baseBlock.type.length > 0 ? baseBlock.type[0] : 'text';

            // Store value
            if (initialValue !== undefined && initialValue !== null && initialValue !== '') {
              if (pairFormat === 'input') {
                newSettings.value = normalize(pairFormat, pairType, initialValue);
              } else if ((pairFormat === 'static' || pairFormat === 'calling_api') && pairType === 'select') {
                newSettings.value = initialValue;
              } else {
                newSettings.value = initialValue;
              }
            }
            // Store operator for top-level field
            if (operator && baseBlock.operator && baseBlock.operator.length > 0 && baseBlock.operator[0].length > 0) {
              newSettings.operator = operator;
            }
          }
        }

        // always attach function_info so UI can display it
        newSettings.function_info = function_info;

        const newBlock: BlockInstance = {
          key: blockKey,
          item: itemToUse,
          settings: Object.keys(newSettings).length > 0 ? newSettings : {}
        };

        return {
          ...n,
          config: {
            ...(n.config || {}),
            blocks: [...existingBlocks, newBlock]
          },
        };
      })
    );

    // Store file objects if any were uploaded
    if (files && Object.keys(files).length > 0 && selectedNode) {
      setWorkflowFiles((prev) => {
        const nodeFiles = prev[selectedNode] || {};
        const existingBlocks = nodes.find(n => n.id === selectedNode)?.config?.blocks as BlockInstance[] || [];
        const newBlockIndex = existingBlocks.length; // Index of the block we just added

        // Convert files object to field-keyed structure
        const blockFiles: Record<string, File[]> = {};
        Object.entries(files).forEach(([idx, fileList]) => {
          const fieldKey = `value_${idx}`;
          blockFiles[fieldKey] = fileList;
        });

        return {
          ...prev,
          [selectedNode]: {
            ...nodeFiles,
            [newBlockIndex]: blockFiles
          }
        };
      });
    }

    setShowAddBlockSelector(false);
    setAddBlockKey(null);
    setAddBlockSubKey(null);
    setAddBlockInitialValue(null);
    setAddBlockOperator(null);
    setAddBlockMultipleValues({});
    setAddBlockMultipleOperators({});
    setAddBlockFiles({});
  };

  // Remove a block instance from the selected node
  const handleRemoveBlock = (index: number) => {
    if (!selectedNode) return;

    // Remove associated files
    setWorkflowFiles((prev) => {
      const nodeFiles = prev[selectedNode];
      if (!nodeFiles) return prev;

      const updatedNodeFiles = { ...nodeFiles };
      delete updatedNodeFiles[index];

      // Re-index remaining blocks (shift indices down)
      const reindexedFiles: Record<number, Record<string, File[]>> = {};
      Object.entries(updatedNodeFiles).forEach(([blockIdx, files]) => {
        const idx = parseInt(blockIdx);
        if (idx > index) {
          reindexedFiles[idx - 1] = files;
        } else {
          reindexedFiles[idx] = files;
        }
      });

      return {
        ...prev,
        [selectedNode]: reindexedFiles
      };
    });

    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== selectedNode) return n;
        const existingBlocks = ((n.config)?.blocks || []) as BlockInstance[];
        const blocks = existingBlocks.filter((_, i) => i !== index);
        return { ...n, config: { ...(n.config || {}), blocks } };
      })
    );
  };

  // Update settings for a block instance
  const handleUpdateBlockSettings = (index: number, settings: Record<string, SettingsValue | BlockFunctionInfo>) => {
    if (!selectedNode) return;
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== selectedNode) return n;
        const existingBlocks: BlockInstance[] = (n.config && 'blocks' in n.config && n.config.blocks) ? n.config.blocks as BlockInstance[] : [];
        const blocks = existingBlocks.map((b, i) => {
          if (i === index) {
            // Preserve function_info when updating settings
            return {
              ...b,
              settings: {
                ...settings,
                function_info: b.settings?.function_info || settings.function_info
              }
            };
          }
          return b;
        });
        return { ...n, config: { ...(n.config || {}), blocks } };
      })
    );
  };

  // Show loading state while fetching workflow data
  if (isLoading) {
    return (
      <section className="flex-1 flex flex-col bg-white w-full h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workflow...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex-1 flex flex-col bg-white w-full h-full">
      <Loading isLoading={isLoadingGetWorkflow} text="Loading workflow..." type="inline" className="min-h-[300px]">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="text-base md:text-lg md:font-bold font-semibold bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 outline-none px-2 py-1 transition-colors"
              placeholder="Workflow name"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={testWorkflow}
              className="flex items-center gap-2 px-2 md:px-4 md:py-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 md:rounded-lg rounded transition-colors font-medium text-sm"
            >
              <FaPlay size={10} />
              <span className='md:block hidden'>Test</span>
            </button>
            <Loading isLoading={isLoadingSaving} type="button" text="Saving..." theme="dark">
              <button
                onClick={saveWorkflow}
                disabled={isSaving}
                className="flex items-center gap-2 px-2 md:px-4 md:py-2 py-1 bg-blue-600 hover:bg-blue-700 text-white md:rounded-lg rounded transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaSave />
                <span className='md:block hidden'>{isSaving ? 'Saving...' : 'Save'}</span>
              </button>
            </Loading>

            <Link
              href="/dashboard/workflow/list"
              className="flex items-center gap-2 px-2 md:px-4 md:py-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 md:rounded-lg rounded transition-colors font-medium text-sm"
            >
              <FaTimes />
            </Link>
          </div>
        </div>

        {/* Main workspace */}
        <div className="parent flex flex-1 relative h-full w-full">
          {/* Left Sidebar - Elements Panel */}
          {selectedNode && addStep && (
            <div className="absolute inset-0 z-50 w-72 bg-gray-50 border-r border-gray-200 flex flex-col">
              {/* Panel Header */}
              <div className="flex px-4 py-3 border-b border-gray-200 bg-white justify-between items-top">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Add Steps</h3>
                  <p className="text-xs text-gray-500 mt-1">Click to add steps</p>
                  {selectedNode ? (
                    <p className="text-xs text-green-600 mt-2 font-medium">✓ Auto-connect enabled</p>
                  ) : (
                    <p className="text-xs text-blue-600 mt-2 font-medium">💡 Right-click nodes to connect</p>
                  )}
                </div>

                <button
                  onClick={() => setAddStep(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Elements List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {/* Trigger Section */}
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 px-2">Triggers</h4>
                  <div className="bg-white rounded-lg border border-gray-200 p-3 cursor-move hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">▶</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Webhook</p>
                        <p className="text-xs text-gray-500">Start with HTTP request</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Section */}
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 px-2">Actions</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => addNode('action')}
                      className="w-full bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow text-left hover:border-purple-300"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">⚙</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Action</p>
                          <p className="text-xs text-gray-500">Execute a task</p>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => addNode('condition')}
                      className="w-full bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow text-left hover:border-pink-300"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">◇</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Condition</p>
                          <p className="text-xs text-gray-500">Branch based on logic</p>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => addNode('delay')}
                      className="w-full bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow text-left hover:border-amber-300"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">⏱</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Delay</p>
                          <p className="text-xs text-gray-500">Wait before next step</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* End Section
                <div>
                  <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 px-2">End</h4>
                  <button
                    onClick={() => addNode('end')}
                    className="w-full bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow text-left hover:border-green-300"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">✓</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">End</p>
                        <p className="text-xs text-gray-500">Complete workflow</p>
                      </div>
                    </div>
                  </button>
                </div> */}
              </div>
            </div>
          )}

          {/* Canvas Area */}
          <div
            className={`bg-gray-200 overflow-auto h-full [width:calc(100vw)] ${sidebarHidden ? "md:[width:calc(100vw-var(--spacing)*20)]" : "md:[width:calc(100vw-var(--spacing)*56)]"}`}
            style={{ height: 'calc(100vh - var(--spacing)*24 - 2.25rem)' }}
          >
            <canvas
              ref={canvasRef}
              width={2000}
              height={screen.availHeight}
              onClick={handleCanvasClick}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              onContextMenu={(e: React.MouseEvent<HTMLCanvasElement>) => {
                e.preventDefault();
                handleCanvasMouseDown(e);
              }}
              className="child bg-white cursor-default"
            />
          </div>

          {/* Right Sidebar - Node Properties */}
          {selectedNode && setStep && (
            <div className="absolute inset-0 z-50 w-80 mr-0 ml-auto bg-white border-l border-gray-200 flex flex-col h-full shadow-xl transform transition-transform duration-300 translate-x-0 animate-in slide-in-from-right">
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 text-sm">Step Settings</h3>
                <button
                  onClick={() => setSetStep(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {(() => {
                  const node = nodes.find((n) => n.id === selectedNode);
                  if (!node) return null;
                  const config = NODE_TYPES[node.type];

                  return (
                    <>
                      {/* Type */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">Type</label>
                        <div className="px-3 py-2 bg-gray-50 rounded border border-gray-200 text-sm text-gray-900">
                          {config.label}
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">Description</label>
                        <textarea
                          value={node.description || ''}
                          onChange={(e) => {
                            setNodes((prevNodes) =>
                              prevNodes.map((n) =>
                                n.id === selectedNode ? { ...n, description: e.target.value } : n
                              )
                            );
                          }}
                          className="w-full px-3 py-2 bg-white rounded border border-gray-200 text-sm focus:border-blue-500 outline-none resize-none"
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        {/* Render existing block instances for this node */}
                        {(((node.config && 'blocks' in node.config && node.config.blocks) ? node.config.blocks : []) as BlockInstance[]).map((b, idx) => (
                          <BlockSettings
                            key={`${b.key}-${idx}`}
                            nodeId={node.id}
                            instance={b}
                            index={idx}
                            onChange={(s) => handleUpdateBlockSettings(idx, s)}
                            onRemove={() => handleRemoveBlock(idx)}
                          />
                        ))}

                        {/* Add block selector */}
                        <div>
                          {showAddBlockSelector ? (
                            <div className="space-y-2 w-full">
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <label className="text-sm text-gray-600">Select {config.label} Type</label>
                                  <select
                                    className="w-full py-2 px-3 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    value={addBlockKey ?? ''}
                                    onChange={(e) => {
                                      const newKey = e.target.value;
                                      setAddBlockKey(newKey);
                                      setAddBlockSubKey(null);
                                      setAddBlockInitialValue(null);
                                      // Set default operator when filter type changes
                                      const newBlock = block_data[newKey];
                                      const formatCount = newBlock?.format?.length || 1;

                                      if (formatCount > 1) {
                                        // Initialize multiple operators with defaults
                                        const initialOperators: Record<number, string> = {};
                                        for (let i = 0; i < formatCount; i++) {
                                          const defaultOp = newBlock?.operator?.[i]?.[0] || '';
                                          if (defaultOp) initialOperators[i] = defaultOp;
                                        }
                                        setAddBlockMultipleOperators(initialOperators);
                                        setAddBlockMultipleValues({});
                                      } else {
                                        // Get first operator from first pair
                                        const firstOperator = newBlock?.operator?.[0]?.[0] || null;
                                        setAddBlockOperator(firstOperator);
                                        setAddBlockMultipleOperators({});
                                        setAddBlockMultipleValues({});
                                      }
                                    }}
                                    required
                                  >
                                    <option value="">Select the {config.label.toLowerCase()}...</option>
                                    {getPossibleBlocks(node.type).map(([key, item]) => (
                                      <option key={key} value={key}>{item.label}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      if (addBlockKey) {
                                        const selected = block_data[addBlockKey];
                                        const formatCount = selected?.format?.length || 1;

                                        // If multiple formats, pass the multiple values/operators
                                        if (formatCount > 1) {
                                          handleAddBlock(addBlockKey, addBlockSubKey, addBlockInitialValue, addBlockOperator, addBlockMultipleValues, addBlockMultipleOperators, addBlockFiles);
                                        } else {
                                          handleAddBlock(addBlockKey, addBlockSubKey, addBlockInitialValue, addBlockOperator);
                                        }
                                      }
                                    }}
                                    disabled={!addBlockKey}
                                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Add {node.label}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setShowAddBlockSelector(false);
                                      setAddBlockKey(null);
                                      setAddBlockSubKey(null);
                                      setAddBlockInitialValue(null);
                                      setAddBlockOperator(null);
                                      setAddBlockMultipleValues({});
                                      setAddBlockMultipleOperators({});
                                      setAddBlockFiles({});
                                    }}
                                    className="py-2 px-4 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>

                              {/* If selected block has nested fields, show subkey selector and appropriate input/select */}
                              {addBlockKey && (() => {
                                const selected = block_data[addBlockKey];
                                // nested object fields (show subfield selector)
                                if (selected && selected.value && typeof selected.value === 'object' && !Array.isArray(selected.value)) {
                                  const entries = Object.entries(selected.value as Record<string, NestedFieldItem>);
                                  const child = addBlockSubKey ? (selected.value as Record<string, NestedFieldItem>)[addBlockSubKey] : null;
                                  return (
                                    <div className="space-y-2 w-full">
                                      <div className="space-y-2">
                                        <label className="text-sm text-gray-600">Select Field</label>
                                        <select
                                          className="w-full py-1 px-2 border rounded"
                                          value={addBlockSubKey ?? ''}
                                          onChange={(e) => {
                                            setAddBlockSubKey(e.target.value);
                                            setAddBlockInitialValue(null);
                                            // Set default operator when field changes
                                            const newChild = e.target.value ? (selected.value as Record<string, NestedFieldItem>)[e.target.value] : null;
                                            setAddBlockOperator(newChild?.operator?.[0] || null);
                                          }}
                                        >
                                          <option value="">Select field...</option>
                                          {entries.map(([k, v]) => (
                                            <option key={k} value={k}>{v.label || k}</option>
                                          ))}
                                        </select>

                                        {/* Operator select for nested field */}
                                        {child && child.operator && child.operator.length > 0 && (
                                          <div>
                                            <label className="text-sm text-gray-600">Operator</label>
                                            {child.operator && child.operator.length > 1 && (
                                              <select
                                                className="w-full py-1 px-2 border rounded"
                                                value={addBlockOperator ?? child.operator[0]}
                                                onChange={(e) => setAddBlockOperator(e.target.value)}
                                              >
                                                {child.operator.map((op) => (
                                                  <option key={op} value={op}>{op}</option>
                                                ))}
                                              </select>
                                            )}
                                          </div>
                                        )}

                                        {/* for nested child, if input -> show input; if static/calling_api + select -> show select */}
                                        {child && child.format === 'input' && (
                                          <div>
                                            <label className="text-sm text-gray-600">Value</label>
                                            <input
                                              className="w-full py-1 px-2 border rounded"
                                              type={child.type || 'text'}
                                              placeholder={`Enter ${child.label || 'value'}...`}
                                              value={addBlockInitialValue ?? ''}
                                              onChange={(e) => setAddBlockInitialValue(e.target.value)}
                                              required
                                            />
                                          </div>
                                        )}

                                        {child && (child.format === 'static' || child.format === 'calling_api') && child.type === 'select' && (
                                          <div>
                                            <label className="text-sm text-gray-600">Value</label>
                                            <select
                                              className="w-full py-1 px-2 border rounded"
                                              value={addBlockInitialValue ?? ''}
                                              onChange={(e) => setAddBlockInitialValue(e.target.value)}
                                              required
                                            >
                                              <option value="">Select {child.label}...</option>
                                              {(child.format === 'calling_api' ? addBlockCandidates : (Array.isArray(child.value) ? child.value : [])).map((opt) => (
                                                <option key={opt} value={opt}>{String(opt)}</option>
                                              ))}
                                            </select>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )
                                }

                                // top-level selected block handling with new array structure
                                // Get first pair's format, type, and operators
                                if (selected.format?.length == 1) {
                                  const firstFormat = selected?.format?.[0];
                                  const firstType = selected?.type?.[0];
                                  const firstOperators = selected?.operator?.[0];
                                  if (selected && firstFormat === 'input') {
                                    return (
                                      <div className="space-y-2">
                                        {/* Operator select for top-level input field */}
                                        {firstOperators && firstOperators.length > 1 && (
                                          <div>
                                            <label className="text-sm text-gray-600">Operator</label>
                                            <select
                                              className="w-full py-1 px-2 border rounded"
                                              value={addBlockOperator ?? firstOperators[0]}
                                              onChange={(e) => setAddBlockOperator(e.target.value)}
                                            >
                                              {firstOperators.map((op) => (
                                                <option key={op} value={op}>{op}</option>
                                              ))}
                                            </select>
                                          </div>
                                        )}
                                        <div>
                                          <label className="text-sm text-gray-600">{selected.sublabels?.[0] || 'Value'}</label>
                                          <input
                                            className="w-full py-1 px-2 border rounded"
                                            type={firstType || 'text'}
                                            placeholder={`Enter ${selected.label}...`}
                                            value={addBlockInitialValue ?? ''}
                                            onChange={(e) => setAddBlockInitialValue(e.target.value)}
                                            required
                                          />
                                        </div>
                                      </div>
                                    )
                                  }

                                  if (selected && (firstFormat === 'static' || firstFormat === 'calling_api') && firstType === 'select') {
                                    // Get options from the first value item if it's an array
                                    const firstValueItem = Array.isArray(selected.value) ? selected.value[0] : null;
                                    const options = firstFormat === 'calling_api'
                                      ? addBlockCandidates
                                      : (firstValueItem && typeof firstValueItem === 'object' && 'options' in firstValueItem
                                          ? (firstValueItem.options as unknown[])
                                          : []);

                                    return (
                                      <div className="space-y-2">
                                        {/* Operator select for top-level select field */}
                                        {firstOperators && firstOperators.length > 0 && (
                                          <div>
                                            <label className="text-sm text-gray-600">Operator</label>
                                            <select
                                              className="w-full py-1 px-2 border rounded"
                                              value={addBlockOperator ?? firstOperators[0]}
                                              onChange={(e) => setAddBlockOperator(e.target.value)}
                                            >
                                              {firstOperators.map((op) => (
                                                <option key={op} value={op}>{op}</option>
                                              ))}
                                            </select>
                                          </div>
                                        )}
                                        <div>
                                          <label className="text-sm text-gray-600">Value</label>
                                          <select
                                            className="w-full py-1 px-2 border rounded"
                                            value={addBlockInitialValue ?? ''}
                                            onChange={(e) => setAddBlockInitialValue(e.target.value)}
                                            required
                                          >
                                            <option value="">Select {selected.label}...</option>
                                            {options.map((opt) => (
                                              <option key={String(opt)} value={String(opt)}>{String(opt)}</option>
                                            ))}
                                          </select>
                                        </div>
                                      </div>
                                    )
                                  }
                                }
                                else {
                                  const several_format = selected.format?.map((format: string, idx: number) => {
                                    const oneformat = format;
                                    const onetype = selected?.type?.[idx];
                                    const oneoperator = selected?.operator?.[idx];
                                    const sublabel = selected?.sublabels?.[idx];

                                    if (selected && oneformat === 'input') {
                                      return (
                                        <div key={idx} className="space-y-2">
                                          {/* Operator select for top-level input field */}
                                          {oneoperator && oneoperator.length > 1 && (
                                            <div>
                                              <label className="text-sm text-gray-600">Operator</label>
                                              <select
                                                className="w-full py-1 px-2 border rounded"
                                                value={addBlockMultipleOperators[idx] ?? oneoperator[0]}
                                                onChange={(e) => setAddBlockMultipleOperators(prev => ({ ...prev, [idx]: e.target.value }))}
                                              >
                                                {oneoperator.map((op: string) => (
                                                  <option key={op} value={op}>{op}</option>
                                                ))}
                                              </select>
                                            </div>
                                          )}
                                          <div>
                                            <label className="text-sm text-gray-600">{sublabel || 'Value'}</label>
                                            {onetype === "textarea" ? (
                                              <textarea
                                                className="w-full py-1 px-2 border rounded"
                                                placeholder={`Enter ${sublabel || selected.label}...`}
                                                value={addBlockMultipleValues[idx] ?? ""}
                                                onChange={(e) =>
                                                  setAddBlockMultipleValues((prev) => ({
                                                    ...prev,
                                                    [idx]: e.target.value,
                                                  }))
                                                }
                                                required
                                              />
                                            ) : onetype === "multifile" ? (
                                              <input
                                                className="w-full py-1 px-2 border rounded"
                                                type="file"
                                                multiple
                                                onChange={(e) => {
                                                  const files = e.target.files ? Array.from(e.target.files) : [];
                                                  // Store file names for display
                                                  setAddBlockMultipleValues((prev) => ({
                                                    ...prev,
                                                    [idx]: files.map((file) => file.name).join(', '),
                                                  }));
                                                  // Store actual File objects
                                                  setAddBlockFiles((prev) => ({
                                                    ...prev,
                                                    [idx]: files,
                                                  }));
                                                }}
                                                required
                                              />
                                            ) : (
                                              <input
                                                className="w-full py-1 px-2 border rounded"
                                                type={onetype || "text"}
                                                placeholder={`Enter ${sublabel || selected.label}...`}
                                                value={addBlockMultipleValues[idx] ?? ""}
                                                onChange={(e) =>
                                                  setAddBlockMultipleValues((prev) => ({
                                                    ...prev,
                                                    [idx]: e.target.value,
                                                  }))
                                                }
                                                required
                                              />
                                            )}
                                          </div>
                                        </div>
                                      )
                                    }

                                    if (selected && (oneformat === 'static' || oneformat === 'calling_api') && onetype === 'select') {
                                      return (
                                        <div key={idx} className="space-y-2">
                                          {/* Operator select for top-level select field */}
                                          {oneoperator && oneoperator.length > 0 && (
                                            <div>
                                              <label className="text-sm text-gray-600">Operator</label>
                                              <select
                                                className="w-full py-1 px-2 border rounded"
                                                value={addBlockMultipleOperators[idx] ?? oneoperator[0]}
                                                onChange={(e) => setAddBlockMultipleOperators(prev => ({ ...prev, [idx]: e.target.value }))}
                                              >
                                                {oneoperator.map((op: string) => (
                                                  <option key={op} value={op}>{op}</option>
                                                ))}
                                              </select>
                                            </div>
                                          )}
                                          <div>
                                            <label className="text-sm text-gray-600">{sublabel || 'Value'}</label>
                                            <select
                                              className="w-full py-1 px-2 border rounded"
                                              value={addBlockMultipleValues[idx] ?? ''}
                                              onChange={(e) => setAddBlockMultipleValues(prev => ({ ...prev, [idx]: e.target.value }))}
                                              required
                                            >
                                              <option value="">Select {sublabel || selected.label}...</option>
                                              {(oneformat === 'calling_api' ? addBlockCandidates : []).map((opt: string) => (
                                                <option key={opt} value={opt}>{String(opt)}</option>
                                              ))}
                                            </select>
                                          </div>
                                        </div>
                                      )
                                    }

                                    return null;
                                  })
                                  return several_format;
                                }
                                return null;
                              })()}
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                const possible = getPossibleBlocks(node.type);
                                if (possible.length > 0) {
                                  setShowAddBlockSelector(true);
                                  const firstKey = possible[0][0];
                                  const firstBlock = possible[0][1];
                                  setAddBlockKey(firstKey);
                                  setAddBlockSubKey(null);
                                  setAddBlockInitialValue(null);

                                  const formatCount = firstBlock?.format?.length || 1;

                                  if (formatCount > 1) {
                                    // Initialize multiple operators with defaults
                                    const initialOperators: Record<number, string> = {};
                                    for (let i = 0; i < formatCount; i++) {
                                      const defaultOp = firstBlock?.operator?.[i]?.[0] || '';
                                      if (defaultOp) initialOperators[i] = defaultOp;
                                    }
                                    setAddBlockMultipleOperators(initialOperators);
                                    setAddBlockMultipleValues({});
                                  } else {
                                    // Set default operator for the first block (get first operator from first pair)
                                    const firstOperator = firstBlock.operator?.[0]?.[0] || null;
                                    setAddBlockOperator(firstOperator);
                                    setAddBlockMultipleOperators({});
                                    setAddBlockMultipleValues({});
                                  }
                                }
                              }}
                              className="px-3 py-2 border rounded text-sm bg-blue-500 text-white hover:bg-blue-600 transition-colors w-full"
                            >
                              + Add {node.label}
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Connections Info */}
                      <div className="border-t pt-4">
                        <h4 className="text-xs font-semibold text-gray-700 mb-3">Connections</h4>
                        <div className="space-y-2">
                          {/* Incoming */}
                          {edges.filter((e) => e.to === selectedNode).length > 0 && (
                            <div>
                              <p className="text-xs text-gray-600 font-medium mb-1">↓ From:</p>
                              {edges
                                .filter((e) => e.to === selectedNode)
                                .map((edge) => {
                                  const sourceNode = nodes.find((n) => n.id === edge.from);
                                  return (
                                    <div
                                      key={edge.id}
                                      className="text-xs bg-blue-50 border border-blue-200 rounded px-2 py-1 text-blue-700 flex items-center justify-between"
                                    >
                                      <span>{sourceNode?.label || 'Unknown'}</span>
                                      <button
                                        onClick={() => deleteEdge(edge.id)}
                                        className="text-blue-500 hover:text-blue-700 font-bold"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  );
                                })}
                            </div>
                          )}

                          {/* Outgoing */}
                          {edges.filter((e) => e.from === selectedNode).length > 0 && (
                            <div>
                              <p className="text-xs text-gray-600 font-medium mb-1">↑ To:</p>
                              {edges
                                .filter((e) => e.from === selectedNode)
                                .map((edge) => {
                                  const targetNode = nodes.find((n) => n.id === edge.to);
                                  return (
                                    <div
                                      key={edge.id}
                                      className="text-xs bg-green-50 border border-green-200 rounded px-2 py-1 text-green-700 flex items-center justify-between"
                                    >
                                      <span>{targetNode?.label || 'Unknown'}</span>
                                      <button
                                        onClick={() => deleteEdge(edge.id)}
                                        className="text-green-500 hover:text-green-700 font-bold"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  );
                                })}
                            </div>
                          )}

                          {/* No connections */}
                          {edges.filter((e) => e.from === selectedNode || e.to === selectedNode).length ===
                            0 && <p className="text-xs text-gray-500 italic">No connections yet</p>}
                        </div>
                      </div>

                      {/* Delete Step */}
                      <button
                        onClick={deleteNode}
                        className="w-full px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded transition-colors text-sm font-medium mt-4"
                      >
                        Delete Step
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </Loading>
    </section>

  );
}