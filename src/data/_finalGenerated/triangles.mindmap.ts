// AUTO-GENERATED. DO NOT EDIT BY HAND.
// Source: src\data\_final\maths-triangles\mindmap.json

export const trianglesMindMap = {
  "mapId": "maths-triangles-bpt-vs-similarity",
  "subjectKey": "Maths",
  "topicKeyCanonical": "maths-triangles",
  "topology": "decision_tree",
  "title": "Triangles: Parallel Line or Two Triangles?",
  "description": "Fast decision router: BPT vs Similarity in exam questions.",
  "nodes": [
    {
      "id": "n0",
      "label": "START: Analyze Diagram",
      "level": 1,
      "nodeType": "start",
      "tags": ["keyword"],
      "zombieVisible": true
    },
    {
      "id": "n1",
      "label": "One line parallel to side?",
      "level": 2,
      "nodeType": "decision",
      "tags": ["cue"],
      "zombieVisible": true
    },
    {
      "id": "n2",
      "label": "Use BPT (Thales)",
      "level": 3,
      "nodeType": "action",
      "tags": ["theorem"],
      "zombieVisible": false
    },
    {
      "id": "n3",
      "label": "Formula: AD/DB = AE/EC",
      "level": 4,
      "nodeType": "formula",
      "tags": ["formula"],
      "zombieVisible": false
    },
    {
      "id": "n4",
      "label": "Write BPT statement: free 1 mark",
      "level": 4,
      "nodeType": "warning",
      "tags": ["marks", "roi"],
      "zombieVisible": false
    },
    {
      "id": "n5",
      "label": "Two full triangles?",
      "level": 2,
      "nodeType": "decision",
      "tags": ["cue"],
      "zombieVisible": true
    },
    {
      "id": "n6",
      "label": "Check equal angles",
      "level": 3,
      "nodeType": "decision",
      "tags": ["method"],
      "zombieVisible": false
    },
    {
      "id": "n7",
      "label": "Use AA / SAS / SSS",
      "level": 3,
      "nodeType": "action",
      "tags": ["theorem"],
      "zombieVisible": false
    },
    {
      "id": "n8",
      "label": "Write CPST ratios",
      "level": 4,
      "nodeType": "action",
      "tags": ["writing_step"],
      "zombieVisible": false
    },
    {
      "id": "n9",
      "label": "Trap: Vertex order must match",
      "level": 4,
      "nodeType": "warning",
      "tags": ["trap", "marks"],
      "zombieVisible": false
    }
  ],
  "edges": [
    {
      "id": "e0",
      "source": "n0",
      "target": "n1",
      "label": "check_parallel",
      "animated": false
    },
    {
      "id": "e1",
      "source": "n1",
      "target": "n2",
      "label": "yes",
      "animated": true
    },
    {
      "id": "e2",
      "source": "n2",
      "target": "n3",
      "label": "apply",
      "animated": false
    },
    {
      "id": "e3",
      "source": "n2",
      "target": "n4",
      "label": "examiner_note",
      "animated": false
    },
    {
      "id": "e4",
      "source": "n0",
      "target": "n5",
      "label": "check_shapes",
      "animated": false
    },
    {
      "id": "e5",
      "source": "n5",
      "target": "n6",
      "label": "yes",
      "animated": true
    },
    {
      "id": "e6",
      "source": "n6",
      "target": "n7",
      "label": "found_match",
      "animated": false
    },
    {
      "id": "e7",
      "source": "n7",
      "target": "n8",
      "label": "result",
      "animated": false
    },
    {
      "id": "e8",
      "source": "n7",
      "target": "n9",
      "label": "warning",
      "animated": false
    }
  ]
} as const;

