// AUTO-GENERATED. DO NOT EDIT BY HAND.
// Source: src\data\_final\maths-triangles\boardSteps.json

export const trianglesBoardSteps = [
  {
    "subjectKey": "Maths",
    "topicKeyCanonical": "maths-triangles",
    "questionType": "proof",
    "examWeight": "5m",
    "boardSteps": {
      "given": [
        "Triangle ABC with line DE parallel to BC",
        "D intersects AB, E intersects AC"
      ],
      "toProve": [
        "AD / DB = AE / EC"
      ],
      "construction": [
        "Join BE and CD. Draw DM perpendicular to AC and EN perpendicular to AB."
      ],
      "steps": [
        {
          "step": "Area(ADE) = (1/2) * AD * EN",
          "reason": "Area of triangle = 1/2 * base * height"
        },
        {
          "step": "Area(BDE) = (1/2) * DB * EN",
          "reason": "Same height EN for base DB"
        },
        {
          "step": "Area(ADE) / Area(BDE) = AD / DB",
          "reason": "Dividing areas (Eq 1)"
        },
        {
          "step": "Similarly, Area(ADE) = (1/2) * AE * DM and Area(DEC) = (1/2) * EC * DM",
          "reason": "Considering AC as base"
        },
        {
          "step": "Area(ADE) / Area(DEC) = AE / EC",
          "reason": "Dividing areas (Eq 2)"
        },
        {
          "step": "Area(BDE) = Area(DEC)",
          "reason": "Triangles on same base DE and between same parallels DE and BC are equal in area"
        },
        {
          "step": "AD / DB = AE / EC",
          "reason": "From Eq 1, Eq 2 and area equality"
        }
      ],
      "result": "Hence proved (Basic Proportionality Theorem)"
    },
    "commonMistakes": [
      "Missing the construction statement entirely.",
      "Not stating 'triangles on same base and between same parallels'.",
      "Forgetting to label the perpendiculars in the diagram."
    ],
    "examinerNotes": [
      "Diagram with construction lines is essential for full marks.",
      "The theorem name (BPT) should be mentioned at the end."
    ]
  },
  {
    "subjectKey": "Maths",
    "topicKeyCanonical": "maths-triangles",
    "questionType": "numerical",
    "examWeight": "3m",
    "boardSteps": {
      "given": [
        "Vertical pole height = 6m, Shadow = 4m",
        "Tower shadow = 28m at same time"
      ],
      "toProve": [
        "Height of tower (h)"
      ],
      "construction": [
        "Draw two right-angled triangles ABC (pole) and PQR (tower)."
      ],
      "steps": [
        {
          "step": "In Triangle ABC and Triangle PQR, Angle B = Angle Q = 90 degrees",
          "reason": "Vertical objects"
        },
        {
          "step": "Angle C = Angle R",
          "reason": "Elevation of sun is same at same instant"
        },
        {
          "step": "Triangle ABC similar to Triangle PQR",
          "reason": "AA Similarity Criterion"
        },
        {
          "step": "AB / PQ = BC / QR",
          "reason": "CPST (Corresponding Parts of Similar Triangles)"
        },
        {
          "step": "6 / h = 4 / 28",
          "reason": "Substitution"
        },
        {
          "step": "h = (6 * 28) / 4",
          "reason": "Solving"
        },
        {
          "step": "h = 42",
          "reason": "Calculation"
        }
      ],
      "result": "Height of tower is 42m."
    },
    "commonMistakes": [
      "Directly using ratio without proving similarity first.",
      "Calculation error in cross-multiplication.",
      "Missing units in final answer."
    ],
    "examinerNotes": [
      "Must explicitly write 'AA Similarity'.",
      "Steps showing correspondence of sides are mandatory."
    ]
  },
  {
    "subjectKey": "Maths",
    "topicKeyCanonical": "maths-triangles",
    "questionType": "numerical",
    "examWeight": "2m",
    "boardSteps": {
      "given": [
        "Triangle ABC, DE || BC",
        "AD/DB = 3/5, AC = 4.8 cm"
      ],
      "toProve": [
        "Length of AE"
      ],
      "construction": [
        "None"
      ],
      "steps": [
        {
          "step": "AD / DB = AE / EC",
          "reason": "Basic Proportionality Theorem"
        },
        {
          "step": "Let AE = x, then EC = 4.8 - x",
          "reason": "Since AC = AE + EC"
        },
        {
          "step": "3 / 5 = x / (4.8 - x)",
          "reason": "Substitution"
        },
        {
          "step": "3(4.8 - x) = 5x",
          "reason": "Cross multiplication"
        },
        {
          "step": "14.4 - 3x = 5x",
          "reason": "Expansion"
        },
        {
          "step": "8x = 14.4 implies x = 1.8",
          "reason": "Solving for x"
        }
      ],
      "result": "AE = 1.8 cm."
    },
    "commonMistakes": [
      "Incorrectly taking EC as x without adjusting the ratio denominator.",
      "Calculation error with decimals.",
      "Not writing the theorem name."
    ],
    "examinerNotes": [
      "Alternative method using AD/AB = AE/AC is also accepted.",
      "Final answer unit is crucial."
    ]
  }
] as const;

