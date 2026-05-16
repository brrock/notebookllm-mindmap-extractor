// NotebookLM Mindmap Extractor - Complete Parent-Child Logic v6.2
console.log("🗺️ NotebookLM Mindmap Extractor v6.2 - Complete Parent-Child Logic loaded");

if (typeof globalDebugData === "undefined") {
  var globalDebugData = null;
}

function collapseAllNodes() {
  return new Promise((resolve) => {
    const selectors = [
      'button[aria-label="Collapse all nodes"]',
      '[mattooltip="Collapse all nodes"]',
      'button[aria-label="Collapse all"]',
    ];
    for (const sel of selectors) {
      const btn = document.querySelector(sel);
      if (btn) {
        btn.click();
        console.log("Clicked collapse, waiting for animation...");
        setTimeout(() => {
          console.log("Collapse animation complete");
          resolve();
        }, 1000);
        return;
      }
    }
    console.log("Collapse button not found, proceeding without collapse");
    resolve();
  });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log("📨 Content script received message:", request);

  const timeout = setTimeout(() => {
    console.error("⏰ Operation timed out after 25 seconds");
    sendResponse({
      error: "Operation timed out. Try refreshing the page and ensure the mindmap is fully loaded.",
    });
  }, 25000);

  if (request.action === "detectMindmap") {
    try {
      console.log("🔍 Starting complete parent-child detection...");

      Promise.resolve()
        .then(() => extractMindmapWithCompleteLogic())
        .then((mindmapData) => {
          clearTimeout(timeout);
          sendResponse(mindmapData);
        })
        .catch((error) => {
          clearTimeout(timeout);
          sendResponse({ error: error.message });
        });
    } catch (error) {
      clearTimeout(timeout);
      sendResponse({ error: error.message });
    }
  } else if (request.action === "debugExtract") {
    try {
      console.log("🛠️ Starting complete debug extraction...");

      Promise.resolve()
        .then(() => performCompleteDebugExtraction())
        .then((debugData) => {
          clearTimeout(timeout);
          sendResponse(debugData);
        })
        .catch((error) => {
          clearTimeout(timeout);
          sendResponse({ error: error.message });
        });
    } catch (error) {
      clearTimeout(timeout);
      sendResponse({ error: error.message });
    }
  } else if (request.action === "extractWithRoot") {
    try {
      console.log("✅ Extracting with complete parent-child logic:", request.rootNodeId);

      Promise.resolve()
        .then(() => extractWithCompleteHierarchy(request.rootNodeId))
        .then((mindmapData) => {
          clearTimeout(timeout);
          sendResponse(mindmapData);
        })
        .catch((error) => {
          clearTimeout(timeout);
          sendResponse({ error: error.message });
        });
    } catch (error) {
      clearTimeout(timeout);
      sendResponse({ error: error.message });
    }
  } else {
    clearTimeout(timeout);
    sendResponse({ error: "Unknown action: " + request.action });
  }

  return true;
});

// ============= MAIN EXTRACTION WITH COMPLETE PARENT-CHILD LOGIC =============
async function extractMindmapWithCompleteLogic() {
  console.log("🔍 Starting extraction with COMPLETE parent-child logic...");
  await collapseAllNodes();

  return new Promise((resolve, reject) => {
    try {
      const svgElements = document.querySelectorAll("svg");
      if (svgElements.length === 0) {
        reject(
          new Error("No SVG elements found. Make sure the mindmap is fully loaded and visible."),
        );
        return;
      }

      console.log(`Found ${svgElements.length} SVG elements`);

      // Extract all unique nodes
      const allNodes = extractAllUniqueNodes(svgElements);
      if (allNodes.length === 0) {
        reject(new Error("No unique nodes found with complete detection"));
        return;
      }

      console.log(`✅ Extracted ${allNodes.length} unique nodes`);

      // COMPLETE LOGIC: Group nodes by X-coordinate levels (same X = same hierarchy level)
      const nodesByLevel = groupNodesByXCoordinateLevel(allNodes);
      console.log(`📊 Grouped nodes into ${Object.keys(nodesByLevel).length} X-coordinate levels`);

      // COMPLETE LOGIC: Extract connections with left-center/right-center detection
      const connections = extractConnectionsWithDirectionAnalysis(svgElements, allNodes);
      console.log(`🔗 Found ${connections.length} connections with direction analysis`);

      // COMPLETE LOGIC: Build parent-child map using consecutive level validation
      const parentChildMap = buildParentChildMapWithLevelValidation(
        connections,
        nodesByLevel,
        allNodes,
      );

      // COMPLETE LOGIC: Build hierarchy with deduplication and level validation
      const hierarchy = buildCompleteHierarchyWithDeduplication(
        allNodes,
        parentChildMap,
        nodesByLevel,
      );

      resolve(hierarchy);
    } catch (error) {
      reject(error);
    }
  });
}

// ============= COMPLETE NODE EXTRACTION WITH DEDUPLICATION =============
function extractAllUniqueNodes(svgElements) {
  const allNodes = [];
  const nodeTextSet = new Set(); // Track unique text content
  const nodePositionMap = new Map(); // Track unique positions
  let nodeId = 0;

  svgElements.forEach((svg, svgIndex) => {
    console.log(`🔍 Processing SVG ${svgIndex + 1} for unique nodes...`);

    const nodeSelectors = [
      "g.node", // Primary selector
      'g[class*="node"]', // Partial class match
      "g[transform] text", // Groups with transform containing text
      "text.node-name", // Direct text elements
    ];

    const foundElements = new Set();

    nodeSelectors.forEach((selector) => {
      try {
        const elements = svg.querySelectorAll(selector);
        elements.forEach((element) => foundElements.add(element));
      } catch (error) {
        console.warn(`Error with selector ${selector}:`, error);
      }
    });

    foundElements.forEach((element, index) => {
      try {
        const nodeData = extractCompleteNodeData(element, nodeId, index);
        if (nodeData && isUniqueNode(nodeData, nodeTextSet, nodePositionMap)) {
          allNodes.push(nodeData);
          nodeTextSet.add(nodeData.text.toLowerCase().trim());
          nodePositionMap.set(
            `${Math.round(nodeData.position.x)}_${Math.round(nodeData.position.y)}`,
            nodeData.id,
          );
          nodeId++;
          console.log(`✅ Added unique node: "${nodeData.text}"`);
        }
      } catch (error) {
        console.warn(`Error processing element ${index}:`, error);
      }
    });
  });

  return allNodes;
}

function extractCompleteNodeData(element, nodeId, index) {
  let text = "";
  let parentGroup = null;
  let actualElement = element;

  // Enhanced text extraction
  if (element.tagName?.toLowerCase() === "text") {
    text = element.textContent?.trim();
    parentGroup = element.closest("g.node") || element.parentElement;
    actualElement = parentGroup || element;
  } else if (element.tagName?.toLowerCase() === "g") {
    const textElement = element.querySelector("text.node-name") || element.querySelector("text");
    if (textElement) {
      text = textElement.textContent?.trim();
      parentGroup = element;
    }
  }

  if (!text || text.length < 1 || !isValidMindmapContent(text)) {
    return null;
  }

  // COMPLETE LOGIC: Get accurate position using transform analysis
  const position = getAccurateElementPosition(actualElement);

  // COMPLETE LOGIC: Calculate precise bounds for connection analysis
  const bounds = calculatePreciseElementBounds(actualElement, position);

  // COMPLETE LOGIC: Calculate connection points (left-center and right-center)
  const connectionPoints = calculateCompleteConnectionPoints(bounds);

  return {
    id: `node_${nodeId}`,
    text: text,
    position: position,
    bounds: bounds,
    connectionPoints: connectionPoints,
    element: actualElement,
    parentGroup: parentGroup,
    originalIndex: index,
    elementType: "Complete SVG Node",
  };
}

function getAccurateElementPosition(element) {
  let x = 0,
    y = 0;

  // COMPLETE LOGIC: Precise transform parsing
  const transform = element.getAttribute("transform");
  if (transform) {
    const match = transform.match(/translate\(\s*([-\d\.]+)\s*,\s*([-\d\.]+)\s*\)/);
    if (match) {
      x = parseFloat(match[1]) || 0;
      y = parseFloat(match[2]) || 0;
      console.log(
        `📍 Accurate position: (${x}, ${y}) for "${element.textContent?.substring(0, 20)}..."`,
      );
      return { x, y };
    }
  }

  // Fallback methods
  x = parseFloat(element.getAttribute("x") || "0");
  y = parseFloat(element.getAttribute("y") || "0");

  if (x === 0 && y === 0) {
    try {
      const rect = element.getBoundingClientRect();
      const svgRect = element.closest("svg")?.getBoundingClientRect();
      if (rect && svgRect) {
        x = rect.left - svgRect.left;
        y = rect.top - svgRect.top;
      }
    } catch (error) {
      console.warn("Could not get element position:", error);
    }
  }

  return { x, y };
}

function calculatePreciseElementBounds(element, position) {
  let bounds = null;

  try {
    // COMPLETE LOGIC: Look for rect element first (most accurate)
    const rectElement = element.querySelector("rect");
    if (rectElement) {
      const x = parseFloat(rectElement.getAttribute("x") || "0") + position.x;
      const y = parseFloat(rectElement.getAttribute("y") || "0") + position.y;
      const width = parseFloat(rectElement.getAttribute("width") || "0");
      const height = parseFloat(rectElement.getAttribute("height") || "0");

      bounds = {
        left: x,
        top: y,
        right: x + width,
        bottom: y + height,
        width: width,
        height: height,
        centerX: x + width / 2,
        centerY: y + height / 2,
      };
    }
  } catch (error) {
    console.warn("Error getting rect bounds:", error);
  }

  // Fallback to getBBox
  if (!bounds) {
    try {
      if (element.getBBox && typeof element.getBBox === "function") {
        const bbox = element.getBBox();
        bounds = {
          left: bbox.x + position.x,
          top: bbox.y + position.y,
          right: bbox.x + bbox.width + position.x,
          bottom: bbox.y + bbox.height + position.y,
          width: bbox.width,
          height: bbox.height,
          centerX: bbox.x + bbox.width / 2 + position.x,
          centerY: bbox.y + bbox.height / 2 + position.y,
        };
      }
    } catch (error) {
      console.warn("Error with getBBox:", error);
    }
  }

  // Final fallback
  if (!bounds) {
    bounds = {
      left: position.x - 18,
      top: position.y - 15,
      right: position.x + 18,
      bottom: position.y + 15,
      width: 36,
      height: 30,
      centerX: position.x,
      centerY: position.y,
    };
  }

  return bounds;
}

function calculateCompleteConnectionPoints(bounds) {
  if (!bounds) return [];

  return [
    { x: bounds.left, y: bounds.centerY, side: "left" }, // LEFT CENTER (child connection target)
    { x: bounds.right, y: bounds.centerY, side: "right" }, // RIGHT CENTER (parent connection source)
    { x: bounds.centerX, y: bounds.top, side: "top" }, // Top center
    { x: bounds.centerX, y: bounds.bottom, side: "bottom" }, // Bottom center
    { x: bounds.centerX, y: bounds.centerY, side: "center" }, // Center
  ];
}

function isUniqueNode(nodeData, nodeTextSet, nodePositionMap) {
  const textKey = nodeData.text.toLowerCase().trim();
  const positionKey = `${Math.round(nodeData.position.x)}_${Math.round(nodeData.position.y)}`;

  // Check for duplicate text
  if (nodeTextSet.has(textKey)) {
    return false;
  }

  // Check for duplicate position (within tolerance)
  const tolerance = 10;
  for (let [existingPosKey, existingNodeId] of nodePositionMap) {
    const [existingX, existingY] = existingPosKey.split("_").map(Number);
    const currentX = Math.round(nodeData.position.x);
    const currentY = Math.round(nodeData.position.y);

    const distance = Math.sqrt((currentX - existingX) ** 2 + (currentY - existingY) ** 2);

    if (distance <= tolerance) {
      console.log(`🔄 Position duplicate detected: distance ${distance} <= ${tolerance}`);
      return false;
    }
  }

  return true;
}

// ============= COMPLETE X-COORDINATE LEVEL GROUPING =============
function groupNodesByXCoordinateLevel(nodes) {
  console.log(
    "📊 COMPLETE LOGIC: Grouping nodes by X-coordinate LEVELS (same X = same hierarchy level)...",
  );

  const nodesByLevel = {};
  const tolerance = 5; // Allow small variations in X coordinates

  nodes.forEach((node) => {
    const x = Math.round(node.position.x / tolerance) * tolerance;
    if (!nodesByLevel[x]) {
      nodesByLevel[x] = [];
    }
    nodesByLevel[x].push(node);
  });

  // Sort X levels from left to right (hierarchy depth)
  const sortedXLevels = Object.keys(nodesByLevel)
    .map((x) => parseFloat(x))
    .sort((a, b) => a - b);

  console.log("🎯 COMPLETE X-coordinate hierarchy levels:");
  sortedXLevels.forEach((x, levelIndex) => {
    const count = nodesByLevel[x].length;
    console.log(
      `  Level ${levelIndex}: X=${x}, Nodes=${count} (same hierarchy depth, different parents possible)`,
    );
    nodesByLevel[x].forEach((node) => {
      console.log(`    - "${node.text.substring(0, 30)}..."`);
    });
  });

  return nodesByLevel;
}

// ============= COMPLETE CONNECTION ANALYSIS WITH DIRECTION =============
function extractConnectionsWithDirectionAnalysis(svgElements, nodes) {
  console.log("🔗 COMPLETE LOGIC: Extracting connections with direction analysis...");

  const connections = [];

  svgElements.forEach((svg) => {
    const connectionElements = [
      ...Array.from(svg.querySelectorAll("path.link")), // Prefer paths with link class
      ...Array.from(svg.querySelectorAll("path")),
      ...Array.from(svg.querySelectorAll("line")),
      ...Array.from(svg.querySelectorAll("polyline")),
    ];

    console.log(`Found ${connectionElements.length} potential connection elements`);

    connectionElements.forEach((connElement) => {
      try {
        const connectionData = analyzeConnectionWithCompleteLogic(connElement, nodes);
        if (connectionData) {
          connections.push(connectionData);
        }
      } catch (error) {
        console.warn("Error analyzing connection element:", error);
      }
    });
  });

  console.log(`✅ Analyzed ${connections.length} valid connections with complete logic`);
  return connections;
}

function analyzeConnectionWithCompleteLogic(connElement, nodes) {
  const tagName = connElement.tagName.toLowerCase();
  let startPoint = null;
  let endPoint = null;

  if (tagName === "path") {
    const pathPoints = parseCompletePathData(connElement.getAttribute("d"));
    if (pathPoints.length >= 2) {
      startPoint = pathPoints[0];
      endPoint = pathPoints[pathPoints.length - 1];
    }
  } else if (tagName === "line") {
    startPoint = {
      x: parseFloat(connElement.getAttribute("x1") || "0"),
      y: parseFloat(connElement.getAttribute("y1") || "0"),
    };
    endPoint = {
      x: parseFloat(connElement.getAttribute("x2") || "0"),
      y: parseFloat(connElement.getAttribute("y2") || "0"),
    };
  } else if (tagName === "polyline") {
    const points = parsePointsAttribute(connElement.getAttribute("points"));
    if (points.length >= 2) {
      startPoint = points[0];
      endPoint = points[points.length - 1];
    }
  }

  if (!startPoint || !endPoint) {
    return null;
  }

  // COMPLETE LOGIC: Find parent node (connection starts from its RIGHT CENTER)
  const parentNode = findNodeByRightCenterConnection(startPoint, nodes);

  // COMPLETE LOGIC: Find child node (connection ends at its LEFT CENTER)
  const childNode = findNodeByLeftCenterConnection(endPoint, nodes);

  if (parentNode && childNode && parentNode.id !== childNode.id) {
    // COMPLETE LOGIC: Validate that child is to the right of parent (next X level)
    if (childNode.position.x > parentNode.position.x) {
      console.log(
        `🔗 COMPLETE Connection: "${parentNode.text.substring(
          0,
          20,
        )}..." → "${childNode.text.substring(0, 20)}..."`,
      );

      return {
        parentNode: parentNode,
        childNode: childNode,
        startPoint: startPoint,
        endPoint: endPoint,
        element: connElement,
        type: tagName,
        direction: "parent-to-child",
      };
    } else {
      console.warn(
        `⚠️ Invalid connection: child X(${childNode.position.x}) not > parent X(${parentNode.position.x})`,
      );
    }
  }

  return null;
}

function findNodeByRightCenterConnection(startPoint, nodes, tolerance = 25) {
  return nodes.find((node) => {
    if (!node.connectionPoints) return false;

    // Look for right center connection point (where parent connections start)
    const rightCenter = node.connectionPoints.find((cp) => cp.side === "right");
    if (rightCenter) {
      const distance = Math.sqrt(
        (startPoint.x - rightCenter.x) ** 2 + (startPoint.y - rightCenter.y) ** 2,
      );
      if (distance <= tolerance) {
        console.log(
          `🎯 COMPLETE: Found parent node "${node.text.substring(0, 20)}..." at right center`,
        );
        return true;
      }
    }
    return false;
  });
}

function findNodeByLeftCenterConnection(endPoint, nodes, tolerance = 25) {
  return nodes.find((node) => {
    if (!node.connectionPoints) return false;

    // Look for left center connection point (where child connections arrive)
    const leftCenter = node.connectionPoints.find((cp) => cp.side === "left");
    if (leftCenter) {
      const distance = Math.sqrt(
        (endPoint.x - leftCenter.x) ** 2 + (endPoint.y - leftCenter.y) ** 2,
      );
      if (distance <= tolerance) {
        console.log(
          `🎯 COMPLETE: Found child node "${node.text.substring(0, 20)}..." at left center`,
        );
        return true;
      }
    }
    return false;
  });
}

function parseCompletePathData(pathData) {
  if (!pathData) return [];

  const points = [];
  const commands = pathData.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || [];

  let currentX = 0,
    currentY = 0;

  commands.forEach((command) => {
    const type = command[0];
    const coords = command
      .slice(1)
      .trim()
      .split(/[\s,]+/)
      .map(parseFloat)
      .filter((n) => !isNaN(n));

    switch (type.toUpperCase()) {
      case "M":
        if (coords.length >= 2) {
          currentX = type === "M" ? coords[0] : currentX + coords[0];
          currentY = type === "M" ? coords[1] : currentY + coords[1];
          points.push({ x: currentX, y: currentY });
        }
        break;
      case "L":
        if (coords.length >= 2) {
          currentX = type === "L" ? coords[0] : currentX + coords[0];
          currentY = type === "L" ? coords[1] : currentY + coords[1];
          points.push({ x: currentX, y: currentY });
        }
        break;
      case "C":
        if (coords.length >= 6) {
          currentX = type === "C" ? coords[4] : currentX + coords[4];
          currentY = type === "C" ? coords[5] : currentY + coords[5];
          points.push({ x: currentX, y: currentY });
        }
        break;
      case "H":
        if (coords.length >= 1) {
          currentX = type === "H" ? coords[0] : currentX + coords[0];
          points.push({ x: currentX, y: currentY });
        }
        break;
      case "V":
        if (coords.length >= 1) {
          currentY = type === "V" ? coords[0] : currentY + coords[0];
          points.push({ x: currentX, y: currentY });
        }
        break;
    }
  });

  return points;
}

function parsePointsAttribute(pointsAttr) {
  if (!pointsAttr) return [];

  const coords = pointsAttr
    .trim()
    .split(/[\s,]+/)
    .map(parseFloat)
    .filter((n) => !isNaN(n));
  const points = [];

  for (let i = 0; i < coords.length; i += 2) {
    if (i + 1 < coords.length) {
      points.push({ x: coords[i], y: coords[i + 1] });
    }
  }

  return points;
}

// ============= COMPLETE PARENT-CHILD MAP WITH LEVEL VALIDATION =============
function buildParentChildMapWithLevelValidation(connections, nodesByLevel, allNodes) {
  console.log("🔗 COMPLETE LOGIC: Building parent-child map with level validation...");

  const parentChildMap = {};
  const childToParentMap = new Map(); // Ensure each child has only one parent
  const xLevels = Object.keys(nodesByLevel)
    .map((x) => parseFloat(x))
    .sort((a, b) => a - b);

  console.log(`Available X-levels: ${xLevels.join(", ")}`);

  connections.forEach((conn) => {
    if (conn.direction === "parent-to-child") {
      const parentX = conn.parentNode.position.x;
      const childX = conn.childNode.position.x;

      // COMPLETE LOGIC: Validate consecutive levels
      const parentLevelIndex = xLevels.findIndex((x) => Math.abs(x - parentX) <= 5);
      const childLevelIndex = xLevels.findIndex((x) => Math.abs(x - childX) <= 5);

      if (childLevelIndex === parentLevelIndex + 1) {
        const parentId = conn.parentNode.id;
        const childId = conn.childNode.id;

        // Check if child already has a parent
        if (childToParentMap.has(childId)) {
          const existingParentId = childToParentMap.get(childId);
          const existingParent = allNodes.find((n) => n.id === existingParentId);

          // Choose better parent based on distance and Y-coordinate proximity
          if (
            shouldReplaceParentWithCompleteLogic(existingParent, conn.parentNode, conn.childNode)
          ) {
            console.log(
              `🔄 COMPLETE: Replacing parent for "${conn.childNode.text}": "${existingParent.text}" → "${conn.parentNode.text}"`,
            );

            // Remove from old parent
            if (parentChildMap[existingParentId]) {
              parentChildMap[existingParentId] = parentChildMap[existingParentId].filter(
                (id) => id !== childId,
              );
            }

            // Add to new parent
            if (!parentChildMap[parentId]) {
              parentChildMap[parentId] = [];
            }
            parentChildMap[parentId].push(childId);
            childToParentMap.set(childId, parentId);
          } else {
            console.log(
              `🚫 COMPLETE: Keeping existing parent for "${conn.childNode.text}": "${existingParent.text}"`,
            );
          }
        } else {
          // Child doesn't have a parent yet
          if (!parentChildMap[parentId]) {
            parentChildMap[parentId] = [];
          }
          parentChildMap[parentId].push(childId);
          childToParentMap.set(childId, parentId);

          console.log(
            `✅ COMPLETE: Level ${parentLevelIndex} → Level ${childLevelIndex}: "${conn.parentNode.text}" → "${conn.childNode.text}"`,
          );
        }
      } else {
        console.warn(
          `⚠️ COMPLETE: Invalid level connection: Level ${parentLevelIndex} → Level ${childLevelIndex}`,
        );
      }
    }
  });

  console.log(
    `🔗 COMPLETE Parent-child relationships: ${Object.keys(parentChildMap).length} parents`,
  );
  Object.entries(parentChildMap).forEach(([parentId, childIds]) => {
    const parentNode = allNodes.find((n) => n.id === parentId);
    const parentText = parentNode?.text || parentId;
    console.log(`  "${parentText.substring(0, 20)}..." → ${childIds.length} children`);
  });

  return parentChildMap;
}

function shouldReplaceParentWithCompleteLogic(existingParent, newParent, childNode) {
  // COMPLETE LOGIC: Criteria for choosing the better parent

  // 1. Prefer parent with closer X-coordinate (immediate previous level)
  const existingXDiff = Math.abs(childNode.position.x - existingParent.position.x);
  const newXDiff = Math.abs(childNode.position.x - newParent.position.x);

  if (Math.abs(existingXDiff - newXDiff) > 50) {
    return newXDiff < existingXDiff;
  }

  // 2. Prefer parent with closer Y-coordinate (vertical proximity)
  const existingYDiff = Math.abs(childNode.position.y - existingParent.position.y);
  const newYDiff = Math.abs(childNode.position.y - newParent.position.y);

  if (Math.abs(existingYDiff - newYDiff) > 30) {
    return newYDiff < existingYDiff;
  }

  // 3. Keep existing parent if differences are small
  return false;
}

// ============= COMPLETE HIERARCHY BUILDING WITH DEDUPLICATION =============
function buildCompleteHierarchyWithDeduplication(allNodes, parentChildMap, nodesByLevel) {
  console.log("🏗️ COMPLETE LOGIC: Building hierarchy with deduplication and level validation...");

  if (allNodes.length === 0) {
    throw new Error("No nodes available for complete hierarchy building");
  }

  // COMPLETE LOGIC: Find root node (leftmost X coordinate = level 0)
  const rootNode = findRootNodeByXLevel(nodesByLevel);
  console.log(`🎯 COMPLETE root node identified: "${rootNode.text}"`);

  // COMPLETE LOGIC: Build hierarchy using BFS with strict deduplication
  const hierarchy = buildHierarchyBFSWithCompleteLogic(
    allNodes,
    rootNode,
    parentChildMap,
    nodesByLevel,
  );

  console.log(`✅ Built COMPLETE hierarchy with ${hierarchy.nodes.length} unique nodes`);

  // Final validation
  validateCompleteHierarchy(hierarchy.nodes);

  return hierarchy;
}

function findRootNodeByXLevel(nodesByLevel) {
  // COMPLETE LOGIC: Root is at the leftmost X position (level 0)
  const xLevels = Object.keys(nodesByLevel)
    .map((x) => parseFloat(x))
    .sort((a, b) => a - b);
  const rootX = xLevels[0];
  const rootCandidates = nodesByLevel[rootX];

  console.log(`🎯 COMPLETE Root X-coordinate: ${rootX}, Candidates: ${rootCandidates.length}`);

  if (rootCandidates.length === 1) {
    return rootCandidates[0];
  }

  // If multiple candidates at root level, choose the most central one vertically
  const centerY =
    rootCandidates.reduce((sum, node) => sum + node.position.y, 0) / rootCandidates.length;

  return rootCandidates.reduce((closest, node) => {
    const distFromCenter = Math.abs(node.position.y - centerY);
    const closestDist = Math.abs(closest.position.y - centerY);
    return distFromCenter < closestDist ? node : closest;
  });
}

function buildHierarchyBFSWithCompleteLogic(allNodes, rootNode, parentChildMap, nodesByLevel) {
  console.log("🌳 COMPLETE LOGIC: Building hierarchy using BFS with strict deduplication...");

  const hierarchyNodes = [];
  const processedNodes = new Set(); // Strict tracking of processed nodes
  const nodeIdToHierarchyIndex = new Map(); // Map node ID to hierarchy index
  const queue = [{ nodeId: rootNode.id, level: 0, parentId: null }];
  const xLevels = Object.keys(nodesByLevel)
    .map((x) => parseFloat(x))
    .sort((a, b) => a - b);

  // Add root
  hierarchyNodes.push({
    id: rootNode.id,
    text: rootNode.text,
    parentId: null,
    level: 0,
    originalIndex: rootNode.originalIndex,
  });
  processedNodes.add(rootNode.id);
  nodeIdToHierarchyIndex.set(rootNode.id, 0);

  // COMPLETE BFS traversal with level validation
  while (queue.length > 0) {
    const { nodeId, level, parentId } = queue.shift();
    const childIds = parentChildMap[nodeId] || [];

    console.log(
      `🔍 COMPLETE: Processing node "${allNodes
        .find((n) => n.id === nodeId)
        ?.text?.substring(0, 20)}..." with ${childIds.length} children`,
    );

    childIds.forEach((childId) => {
      if (!processedNodes.has(childId)) {
        const childNode = allNodes.find((n) => n.id === childId);
        if (childNode) {
          // COMPLETE LOGIC: X-level validation - child should be at next level
          const parentNode = allNodes.find((n) => n.id === nodeId);
          const parentLevelIndex = xLevels.findIndex(
            (x) => Math.abs(x - parentNode.position.x) <= 5,
          );
          const childLevelIndex = xLevels.findIndex((x) => Math.abs(x - childNode.position.x) <= 5);

          if (childLevelIndex === parentLevelIndex + 1) {
            // Strict validation: ensure child is not already in hierarchy
            const existingHierarchyIndex = nodeIdToHierarchyIndex.get(childId);
            if (existingHierarchyIndex !== undefined) {
              console.warn(
                `⚠️ COMPLETE: Attempted to add duplicate node: "${childNode.text}" already exists at index ${existingHierarchyIndex}`,
              );
              return;
            }

            const hierarchyIndex = hierarchyNodes.length;
            hierarchyNodes.push({
              id: childId,
              text: childNode.text,
              parentId: nodeId, // COMPLETE: Proper parent assignment
              level: level + 1, // COMPLETE: Proper level assignment
              originalIndex: childNode.originalIndex,
            });

            processedNodes.add(childId);
            nodeIdToHierarchyIndex.set(childId, hierarchyIndex);
            queue.push({ nodeId: childId, level: level + 1, parentId: nodeId });

            console.log(
              `  ✅ COMPLETE: Added child: "${childNode.text.substring(
                0,
                20,
              )}..." at level ${level + 1}`,
            );
          } else {
            console.warn(
              `  ❌ COMPLETE: Skipped invalid child: level mismatch ${parentLevelIndex} → ${childLevelIndex}`,
            );
          }
        }
      } else {
        console.log(
          `  🔄 COMPLETE: Skipped already processed child: "${
            allNodes.find((n) => n.id === childId)?.text
          }"`,
        );
      }
    });
  }

  // COMPLETE LOGIC: Handle orphaned nodes by X-level (nodes with no connections)
  allNodes.forEach((node) => {
    if (!processedNodes.has(node.id)) {
      // Find appropriate parent based on X-level (previous level)
      const appropriateParent = findParentByXLevelComplete(node, hierarchyNodes, allNodes, xLevels);

      if (appropriateParent) {
        hierarchyNodes.push({
          id: node.id,
          text: node.text,
          parentId: appropriateParent.id,
          level: appropriateParent.level + 1,
          originalIndex: node.originalIndex,
        });
        processedNodes.add(node.id);

        console.log(
          `🔗 COMPLETE: Attached orphan "${node.text.substring(
            0,
            20,
          )}..." to "${appropriateParent.text.substring(0, 20)}..."`,
        );
      }
    }
  });

  return {
    nodes: hierarchyNodes,
    rootNode: hierarchyNodes[0],
  };
}

function findParentByXLevelComplete(orphanNode, hierarchyNodes, allNodes, xLevels) {
  // COMPLETE LOGIC: Find the appropriate parent from the previous X-level
  const orphanLevelIndex = xLevels.findIndex((x) => Math.abs(x - orphanNode.position.x) <= 5);

  if (orphanLevelIndex <= 0) {
    // If at root level or invalid, attach to root
    return hierarchyNodes[0];
  }

  const parentLevelX = xLevels[orphanLevelIndex - 1];
  const potentialParents = hierarchyNodes.filter((hierNode) => {
    const originalNode = allNodes.find((n) => n.id === hierNode.id);
    return originalNode && Math.abs(originalNode.position.x - parentLevelX) <= 5;
  });

  if (potentialParents.length === 0) {
    return hierarchyNodes[0]; // Fallback to root
  }

  // Find closest parent by Y position
  return potentialParents.reduce((closest, parent) => {
    const parentNode = allNodes.find((n) => n.id === parent.id);
    const closestNode = allNodes.find((n) => n.id === closest.id);

    if (!parentNode || !closestNode) return closest;

    const parentDist = Math.abs(orphanNode.position.y - parentNode.position.y);
    const closestDist = Math.abs(orphanNode.position.y - closestNode.position.y);

    return parentDist < closestDist ? parent : closest;
  });
}

function validateCompleteHierarchy(hierarchyNodes) {
  console.log("✅ COMPLETE: Validating hierarchy structure...");

  const seenIds = new Set();
  const seenTexts = new Set();
  const duplicates = [];
  const levels = {};

  hierarchyNodes.forEach((node, index) => {
    // Check for duplicate IDs
    if (seenIds.has(node.id)) {
      duplicates.push({ type: "ID", value: node.id, index });
    } else {
      seenIds.add(node.id);
    }

    // Check for duplicate text content
    const normalizedText = node.text.toLowerCase().trim();
    if (seenTexts.has(normalizedText)) {
      duplicates.push({ type: "TEXT", value: normalizedText, index });
    } else {
      seenTexts.add(normalizedText);
    }

    // Count levels
    levels[node.level] = (levels[node.level] || 0) + 1;
  });

  if (duplicates.length > 0) {
    console.error("❌ COMPLETE: Duplicates found in hierarchy:", duplicates);
    throw new Error(`COMPLETE hierarchy validation failed: ${duplicates.length} duplicates found`);
  }

  console.log("✅ COMPLETE: Hierarchy validation passed - no duplicates found");
  console.log("📊 COMPLETE: Level distribution:", levels);
}

// ============= DEBUG AND EXTRACTION FUNCTIONS =============
async function performCompleteDebugExtraction() {
  console.log("🛠️ Starting COMPLETE debug extraction...");
  await collapseAllNodes();

  const completeHtml = extractCompleteHTML();
  const allNodes = extractAllUniqueNodes(document.querySelectorAll("svg"));

  let connections = [];
  let nodesByLevel = {};
  let detectedRoot = null;
  let parentChildMap = {};

  try {
    if (allNodes.length > 0) {
      nodesByLevel = groupNodesByXCoordinateLevel(allNodes);
      connections = extractConnectionsWithDirectionAnalysis(
        document.querySelectorAll("svg"),
        allNodes,
      );

      if (Object.keys(nodesByLevel).length > 0) {
        detectedRoot = findRootNodeByXLevel(nodesByLevel);

        if (connections.length > 0) {
          parentChildMap = buildParentChildMapWithLevelValidation(
            connections,
            nodesByLevel,
            allNodes,
          );
        }

        allNodes.forEach((node) => {
          node.isDetectedRoot = node.id === detectedRoot?.id;
        });
      }
    }
  } catch (error) {
    console.log("COMPLETE debug analysis failed:", error.message);
  }

  globalDebugData = {
    allNodes: allNodes,
    connections: connections,
    nodesByLevel: nodesByLevel,
    detectedRoot: detectedRoot,
    parentChildMap: parentChildMap,
    completeHtml: completeHtml,
  };

  console.log("🛠️ COMPLETE debug analysis complete:", {
    nodes: allNodes.length,
    connections: connections.length,
    xLevels: Object.keys(nodesByLevel).length,
    parentChildRelations: Object.keys(parentChildMap).length,
    root: detectedRoot?.text || "None",
  });

  return globalDebugData;
}

function extractWithCompleteHierarchy(selectedRootId) {
  console.log("✅ Extracting with COMPLETE hierarchy logic using selected root:", selectedRootId);

  if (!globalDebugData || !globalDebugData.allNodes) {
    throw new Error("Debug data not available. Run Debug Mode first.");
  }

  const selectedRoot = globalDebugData.allNodes.find((node) => node.id === selectedRootId);
  if (!selectedRoot) {
    throw new Error("Selected root node not found.");
  }

  console.log(`🎯 COMPLETE: Selected root: "${selectedRoot.text}"`);

  const nodesByLevel = groupNodesByXCoordinateLevel(globalDebugData.allNodes);

  let hierarchy;

  if (globalDebugData.connections && globalDebugData.connections.length > 0) {
    // Use COMPLETE parent-child logic with connections
    const parentChildMap = buildParentChildMapWithLevelValidation(
      globalDebugData.connections,
      nodesByLevel,
      globalDebugData.allNodes,
    );
    hierarchy = buildHierarchyBFSWithCompleteLogic(
      globalDebugData.allNodes,
      selectedRoot,
      parentChildMap,
      nodesByLevel,
    );
  } else {
    // Fallback to X-level only hierarchy
    hierarchy = buildXLevelHierarchyComplete(globalDebugData.allNodes, selectedRoot, nodesByLevel);
  }

  // Final validation
  validateCompleteHierarchy(hierarchy.nodes);

  console.log(
    "✅ COMPLETE: Extracted with complete parent-child mapping:",
    hierarchy.nodes.length,
    "unique nodes",
  );

  return hierarchy;
}

function buildXLevelHierarchyComplete(allNodes, rootNode, nodesByLevel) {
  console.log("🏗️ COMPLETE: Building hierarchy based on X-level logic...");

  const hierarchyNodes = [];
  const processedNodes = new Set();
  const xLevels = Object.keys(nodesByLevel)
    .map((x) => parseFloat(x))
    .sort((a, b) => a - b);

  console.log(`📊 COMPLETE X-level hierarchy: ${xLevels.join(", ")}`);

  // Add root
  hierarchyNodes.push({
    id: rootNode.id,
    text: rootNode.text,
    parentId: null,
    level: 0,
    originalIndex: rootNode.originalIndex,
  });
  processedNodes.add(rootNode.id);

  // Process each X level sequentially
  for (let levelIndex = 1; levelIndex < xLevels.length; levelIndex++) {
    const currentX = xLevels[levelIndex];
    const previousX = xLevels[levelIndex - 1];

    const currentLevelNodes = nodesByLevel[currentX] || [];
    const previousLevelNodes = nodesByLevel[previousX] || [];

    console.log(
      `📍 COMPLETE Level ${levelIndex}: X=${currentX}, Nodes=${currentLevelNodes.length}`,
    );

    currentLevelNodes.forEach((node) => {
      if (!processedNodes.has(node.id)) {
        // Find closest parent from previous level based on Y-coordinate
        const closestParent = findClosestParentByYComplete(node, previousLevelNodes);
        const parentInHierarchy = hierarchyNodes.find((h) => h.id === closestParent.id);

        if (parentInHierarchy) {
          hierarchyNodes.push({
            id: node.id,
            text: node.text,
            parentId: closestParent.id,
            level: parentInHierarchy.level + 1,
            originalIndex: node.originalIndex,
          });
          processedNodes.add(node.id);

          console.log(
            `  ✅ COMPLETE: "${node.text.substring(
              0,
              20,
            )}..." → parent: "${closestParent.text.substring(0, 20)}..."`,
          );
        }
      }
    });
  }

  return {
    nodes: hierarchyNodes,
    rootNode: hierarchyNodes[0],
  };
}

function findClosestParentByYComplete(childNode, parentCandidates) {
  return parentCandidates.reduce((closest, candidate) => {
    const childY = childNode.position.y;
    const candidateY = candidate.position.y;
    const closestY = closest.position.y;

    const candidateDist = Math.abs(childY - candidateY);
    const closestDist = Math.abs(childY - closestY);

    return candidateDist < closestDist ? candidate : closest;
  });
}

// ============= UTILITY FUNCTIONS =============
function isValidMindmapContent(text) {
  if (!text || text.length < 2) return false;

  const noisePatterns = [
    /^(lock|settings|sources|chat|studio|arrow_back)$/i,
    /^(collapse|expand|add|remove|thumb_up|thumb_down)$/i,
    /^(copy|good response|bad response|light mode|dark mode)$/i,
    /^(google apps|google account|gmail)$/i,
    /^\d+$/,
    /^[^\w\s]*$/,
    /@\w+\.com$/i,
    /^https?:\/\//i,
    /^\s*$/,
  ];

  return !noisePatterns.some((pattern) => pattern.test(text.trim()));
}

function extractCompleteHTML() {
  try {
    return document.documentElement.outerHTML;
  } catch (error) {
    return document.body?.outerHTML || "Unable to extract HTML";
  }
}

console.log("🛠️ COMPLETE NotebookLM Extractor v6.2 with Full Parent-Child Logic loaded");
