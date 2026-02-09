// This file contains appendâ€‘only predicted question additions for Mathematics.
// It expands the existing predicted questions to align with CBSE 2025â€“26 competency focus.
// Note: Do not overwrite existing arrays; import and merge as needed in the main engine.

import type { PredictedQuestion } from "./predictedQuestions";

export const predictedQuestionsAdditions: PredictedQuestion[] = [
  // ===== Pair of Linear Equations (mustâ€‘crack) =====
  {
    id: "2026-PLE-MCQ-07",
    topicKey: "Pair of Linear Equations",
    subtopic: "Graphical Solutions/Nature",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Analysing",
    questionText:
      "For the system of equations 4x âˆ’ 5y = 1 and 8x âˆ’ 10y = 3, choose the correct statement about its solution set:",
    options: [
      "Exactly one solution",
      "Infinitely many solutions",
      "No solution",
      "It depends on values of x and y",
    ],
    answer: "No solution",
    explanation:
      "Doubling the first equation gives 8x âˆ’ 10y = 2, which conflicts with 8x âˆ’ 10y = 3. The lines are parallel and never meet.",
  },
  {
    id: "2026-PLE-MCQ-08",
    topicKey: "Pair of Linear Equations",
    subtopic: "Algebraic Solution Methods",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Applying",
    questionText:
      "Solve the system x + y = 5 and 2x + 3y = 12. What is the value of x?",
    options: ["1", "2", "3", "4"],
    answer: "3",
    explanation:
      "From x + y = 5 we get y = 5 âˆ’ x. Substitute into 2x + 3(5 âˆ’ x) = 12 and solve for x = 3.",
  },
  {
    id: "2026-PLE-SA-09",
    topicKey: "Pair of Linear Equations",
    subtopic: "Word & Application Problems",
    kind: "Short",
    section: "C",
    marks: 3,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "A taxi service charges â‚¹10 per kilometre for the first 5Â km and â‚¹8 per kilometre thereafter. A passenger pays â‚¹90 for a ride of 10Â km. Form a pair of linear equations to find the kilometres charged at each rate and solve them.",
    answer: "5Â km at â‚¹10 per km and 5Â km at â‚¹8 per km.",
    explanation:
      "Let x and y be the kilometres charged at â‚¹10 and â‚¹8 respectively. Then x + y = 10 (total distance) and 10x + 8y = 90 (total fare). Solving gives x = 5 and y = 5.",
    solutionSteps: [
      "Let x km be charged at â‚¹10 and y km at â‚¹8.",
      "Form equations: x + y = 10 and 10x + 8y = 90.",
      "Subtract 8 times the first equation from the second: 2x = 10 â‡’ x = 5.",
      "Hence y = 5 from x + y = 10.",
    ],
    strategyHint:
      "Translate the charges into equations and use elimination to solve.",
  },
  {
    id: "2026-PLE-SA-10",
    topicKey: "Pair of Linear Equations",
    subtopic: "Algebraic Solution Methods",
    kind: "Short",
    section: "B",
    marks: 2,
    difficulty: "Easy",
    bloomSkill: "Understanding",
    questionText:
      "Solve the following pair of equations using substitution: 3x + 2y = 12 and 2x + y = 7.",
    answer: "x = 2, y = 3.",
    explanation:
      "From 2x + y = 7 we get y = 7 âˆ’ 2x. Substitute into 3x + 2y = 12 to obtain 3x + 2(7 âˆ’ 2x) = 12 â‡’ 3x + 14 âˆ’ 4x = 12 â‡’ âˆ’x = âˆ’2 â‡’ x = 2 and y = 3.",
    solutionSteps: [
      "Make y the subject: y = 7 âˆ’ 2x.",
      "Substitute into 3x + 2y = 12.",
      "Simplify and solve for x.",
      "Backâ€‘substitute to find y.",
    ],
  },
  {
    id: "2026-PLE-AR-11",
    topicKey: "Pair of Linear Equations",
    subtopic: "Graphical Solutions/Nature",
    kind: "Assertion-Reasoning",
    section: "A",
    marks: 1,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "Assertion (A): The pair of equations 3x âˆ’ 2y + 4 = 0 and 9x âˆ’ 6y + 12 = 0 has infinitely many solutions.\nReason (R): For two linear equations aâ‚x + bâ‚y + câ‚ = 0 and aâ‚‚x + bâ‚‚y + câ‚‚ = 0, the condition for infinitely many solutions is \\((\\frac{aâ‚}{aâ‚‚} = \\frac{bâ‚}{bâ‚‚} = \\frac{câ‚}{câ‚‚})\\).",
    answer:
      "Both Assertion and Reason are true and Reason is the correct explanation of Assertion.",
    explanation:
      "The second equation is a multiple of the first, so both represent the same line, giving infinitely many solutions. The stated condition correctly identifies coincident lines.",
  },
  {
    id: "2026-PLE-CASE-12",
    topicKey: "Pair of Linear Equations",
    subtopic: "Word & Application Problems",
    kind: "Case-Based",
    section: "E",
    marks: 4,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "Two inlet pipes A and B can fill a water tank in different times, and there is a leak at the bottom. PipeÂ A alone can fill the tank in 10Â hours. When both pipes A and B are opened together, they fill the tank in 6Â hours. However, because of a leak, the tank actually takes 8Â hours to fill when both pipes are open.\n(a) Write two linear equations in x and y if xÂ hours is the time taken by pipeÂ B alone to fill the tank and yÂ hours is the time taken by the leak alone to empty it.\n(b) Solve the equations to find x and y.",
    answer:
      "PipeÂ B alone can fill the tank in 15Â hours and the leak alone would empty it in 24Â hours.",
    explanation:
      "Let the filling rates be 1/10, 1/x and the leak emptying rate be 1/y per hour. Without the leak: 1/10 + 1/x = 1/6. With the leak: 1/10 + 1/x âˆ’ 1/y = 1/8. Solving gives 1/x = 1/15 and 1/y = 1/24.",
    solutionSteps: [
      "Assign rates: pipeÂ A = 1/10, pipeÂ B = 1/x, leak = 1/y.",
      "Without leak: 1/10 + 1/x = 1/6.",
      "With leak: 1/10 + 1/x âˆ’ 1/y = 1/8.",
      "Subtract the first equation from the second to eliminate 1/x and solve for 1/y.",
      "Backâ€‘substitute to find 1/x.",
    ],
    strategyHint: "Convert times to rates and form equations for the combined rates.",
  },

  // ===== Quadratic Equations (mustâ€‘crack) =====
  {
    id: "2026-QE-MCQ-07",
    topicKey: "Quadratic Equations",
    subtopic: "Nature of Roots (Discriminant)",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Understanding",
    questionText:
      "For the quadratic equation 2xÂ² âˆ’ 3x + 5 = 0, what is the nature of its roots?",
    options: [
      "Real and distinct",
      "Real and equal",
      "No real roots",
      "Imaginary and equal",
    ],
    answer: "No real roots",
    explanation:
      "Discriminant D = (âˆ’3)Â² âˆ’ 4Â·2Â·5 = 9 âˆ’ 40 = âˆ’31 < 0; therefore the roots are not real.",
  },
  {
    id: "2026-QE-MCQ-08",
    topicKey: "Quadratic Equations",
    subtopic: "Coefficientâ€“root Relations",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Understanding",
    questionText:
      "For the equation xÂ² âˆ’ 7x + 10 = 0, what is the product of its roots?",
    options: ["7", "10", "âˆ’10", "âˆ’7"],
    answer: "10",
    explanation:
      "For axÂ² + bx + c = 0, product of roots = c/a. Here c = 10 and a = 1, so the product is 10.",
  },
  {
    id: "2026-QE-SA-09",
    topicKey: "Quadratic Equations",
    subtopic: "Algebraic Solution",
    kind: "Short",
    section: "B",
    marks: 2,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "Solve the quadratic equation 3tÂ² âˆ’ 2t âˆ’ 1 = 0 using the quadratic formula.",
    answer: "t = 1 or t = âˆ’1/3.",
    explanation:
      "Identify a = 3, b = âˆ’2, c = âˆ’1. Discriminant D = bÂ² âˆ’ 4ac = 16. Using t = [âˆ’b Â± âˆšD]/(2a) gives t = [2 Â± 4]/6 â‡’ t = 1 or âˆ’1/3.",
    solutionSteps: [
      "Compute D = (âˆ’2)Â² âˆ’ 4Â·3Â·(âˆ’1) = 16.",
      "Apply t = [âˆ’(âˆ’2) Â± âˆš16]/(2Â·3) = [2 Â± 4]/6.",
      "Simplify to get t = 1 or t = âˆ’1/3.",
    ],
    strategyHint:
      "Apply the quadratic formula when factorisation is not obvious.",
  },
  {
    id: "2026-QE-SA-10",
    topicKey: "Quadratic Equations",
    subtopic: "Word/Application Problems",
    kind: "Short",
    section: "C",
    marks: 3,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "A farmer wishes to fence a rectangular field such that its length is 20Â m more than its breadth. If the area of the field is 300Â mÂ², form a quadratic equation in the breadth and find the dimensions of the field.",
    answer: "Breadth = 10Â m and length = 30Â m.",
    explanation:
      "Let breadth = xÂ m, then length = x + 20. Area = x(x + 20) = 300 â‡’ xÂ² + 20x âˆ’ 300 = 0. Solving gives x = 10 (positive root), hence length = 30Â m.",
    solutionSteps: [
      "Let breadth be x and length be x + 20.",
      "Write x(x + 20) = 300 to model the area.",
      "Rearrange to xÂ² + 20x âˆ’ 300 = 0.",
      "Solve to obtain x = 10 (positive value) and length = x + 20 = 30.",
    ],
    strategyHint:
      "Translate the statement into algebra and solve the resulting quadratic.",
  },
  {
    id: "2026-QE-AR-11",
    topicKey: "Quadratic Equations",
    subtopic: "Nature of Roots (Discriminant)",
    kind: "Assertion-Reasoning",
    section: "A",
    marks: 1,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "Assertion (A): The quadratic equation xÂ² + 4x + 5 = 0 has no real roots.\nReason (R): A quadratic equation axÂ² + bx + c = 0 has real roots only when the discriminant bÂ² âˆ’ 4ac is nonâ€‘negative.",
    answer:
      "Both Assertion and Reason are true and Reason is the correct explanation of Assertion.",
    explanation:
      "For xÂ² + 4x + 5, D = 16 âˆ’ 20 = âˆ’4 < 0, so there are no real roots. The discriminant test exactly determines whether roots are real.",
  },
  {
    id: "2026-QE-CASE-12",
    topicKey: "Quadratic Equations",
    subtopic: "Word/Application Problems",
    kind: "Case-Based",
    section: "E",
    marks: 4,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "A rectangular garden measures 40Â m by 30Â m. A path of uniform width runs around the inside of the garden. The area of the path is 476Â mÂ². Let xÂ metres be the width of the path.\n(a) Write a quadratic equation in x that models the situation.\n(b) Solve the equation to find the width of the path (give your answer correct to two decimal places).",
    answer:
      "The quadratic equation is 4xÂ² âˆ’ 140x + 476 = 0 and the path is approximately 3.81Â m wide.",
    explanation:
      "Area of garden = 40 Ã— 30 = 1200Â mÂ²; area of inner rectangle = (40 âˆ’ 2x)(30 âˆ’ 2x). Difference = 476 â‡’ 1200 âˆ’ (40 âˆ’ 2x)(30 âˆ’ 2x) = 476. Simplifying yields 4xÂ² âˆ’ 140x + 476 = 0. Solving gives x â‰ˆ 3.81Â m.",
    solutionSteps: [
      "Let inner dimensions be (40 âˆ’ 2x) and (30 âˆ’ 2x).",
      "Set 40Ã—30 âˆ’ (40 âˆ’ 2x)(30 âˆ’ 2x) = 476.",
      "Expand and rearrange to 4xÂ² âˆ’ 140x + 476 = 0.",
      "Use the quadratic formula: x = [140 Â± âˆš(140Â² âˆ’ 4Â·4Â·476)]/(8).",
      "Choose the positive root and round to two decimal places (â‰ˆ 3.81Â m).",
    ],
    strategyHint:
      "Express areas in terms of x and apply the quadratic formula.",
  },

  // ===== Triangles (mustâ€‘crack) =====
  {
    id: "2026-TRI-MCQ-05",
    topicKey: "Triangles",
    subtopic: "Similarity Criteria",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Understanding",
    questionText:
      "If Î”ABC âˆ¼ Î”DEF with \\(\\\\frac{AB}{DE} = \\\\frac{AC}{DF})\\, which of the following is true?",
    options: ["âˆ A = âˆ D", "âˆ A = âˆ E", "âˆ A = âˆ F", "No relation"],
    answer: "âˆ A = âˆ D",
    explanation:
      "The pairs AB:DE and AC:DF correspond, so vertex A matches with D. Therefore âˆ A = âˆ D.",
  },
  {
    id: "2026-TRI-MCQ-06",
    topicKey: "Triangles",
    subtopic: "Pythagoras/Converse",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Understanding",
    questionText:
      "In a right triangle, the hypotenuse is 10Â cm and one of the other sides is 6Â cm. The length of the third side is:",
    options: ["4Â cm", "6Â cm", "8Â cm", "12Â cm"],
    answer: "8Â cm",
    explanation:
      "By the Pythagoras theorem: third side = âˆš(10Â² âˆ’ 6Â²) = âˆš64 = 8Â cm.",
  },
  {
    id: "2026-TRI-SA-07",
    topicKey: "Triangles",
    subtopic: "BPT (Basic Proportionality Theorem)",
    kind: "Short",
    section: "C",
    marks: 3,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "In Î”ABC, DE âˆ¥ BC intersects AB at D and AC at E. If AD = 3Â cm, DB = 2Â cm and AC = 10Â cm, find the length of AE.",
    answer: "AE = 6Â cm.",
    explanation:
      "By BPT, AD/DB = AE/EC. Let AE = x. Then EC = 10 âˆ’ x. So 3/2 = x/(10 âˆ’ x) â‡’ 30 âˆ’ 3x = 2x â‡’ x = 6Â cm.",
    solutionSteps: [
      "Let AE = x â‡’ EC = 10 âˆ’ x.",
      "Apply BPT: 3/2 = x/(10 âˆ’ x).",
      "Crossâ€‘multiply and solve for x.",
    ],
    strategyHint: "Relate the segments using the Basic Proportionality Theorem.",
  },
  {
    id: "2026-TRI-SA-08",
    topicKey: "Triangles",
    subtopic: "Pythagoras/Converse",
    kind: "Short",
    section: "B",
    marks: 2,
    difficulty: "Easy",
    bloomSkill: "Understanding",
    questionText:
      "In Î”ABC, AB = 6Â cm, AC = 8Â cm and BC = 10Â cm. Show that Î”ABC is a rightâ€‘angled triangle.",
    answer: "Yes, it is rightâ€‘angled at A because 6Â² + 8Â² = 10Â².",
    explanation:
      "Compute 6Â² + 8Â² = 36 + 64 = 100. Since this equals 10Â², by the converse of the Pythagoras theorem Î”ABC is rightâ€‘angled at A.",
    solutionSteps: [
      "Calculate 6Â² + 8Â² = 36 + 64 = 100.",
      "Compute 10Â² = 100.",
      "Since the sums match, the triangle is rightâ€‘angled at the vertex opposite the 10Â cm side.",
    ],
  },
  {
    id: "2026-TRI-AR-09",
    topicKey: "Triangles",
    subtopic: "Similarity Criteria",
    kind: "Assertion-Reasoning",
    section: "A",
    marks: 1,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "Assertion (A): If two sides of one triangle are proportional to two sides of another triangle and the included angles are equal, the triangles are similar.\nReason (R): By the SAS similarity criterion, two triangles are similar when the ratio of two pairs of corresponding sides is equal and the included angles are equal.",
    answer:
      "Both Assertion and Reason are true and Reason is the correct explanation of Assertion.",
    explanation:
      "The statement describes exactly the SAS criterion: two sides in proportion and the included angle equal implies similarity.",
  },
  {
    id: "2026-TRI-CASE-10",
    topicKey: "Triangles",
    subtopic: "Area Ratio in Similar Triangles",
    kind: "Case-Based",
    section: "E",
    marks: 4,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "In Î”ABC, the three medians intersect at the centroid G. Medians divide the triangle into six smaller triangles of equal area.\n(a) Use similarity to explain why Î”AGB, Î”BGC and Î”CGA all have equal areas.\n(b) Hence, find the ratio of the area of Î”AGB to the area of Î”ABC.",
    answer:
      "(a) Each median divides the triangle into two equalâ€‘area triangles, and the medians further divide these into six congruent triangles. (b) Area(Î”AGB) : Area(Î”ABC) = 1 : 3.",
    explanation:
      "Medians meet at the centroid and divide the triangle into six smaller triangles of equal area. Î”AGB consists of two such small triangles, so its area is oneâ€‘third of the area of Î”ABC.",
    solutionSteps: [
      "Recall that each median bisects the area of the triangle.",
      "Show that the centroid divides medians in the ratio 2:1, creating six smaller triangles of equal area.",
      "Observe that Î”AGB is composed of two of the six equal parts, so its area is 2/6 = 1/3 of Î”ABC.",
    ],
    strategyHint:
      "Use properties of medians and the centroid to compare the areas of the resulting triangles.",
  },

  // ===== Trigonometry (mustâ€‘crack) =====
  {
    id: "2026-TRIG-MCQ-09",
    topicKey: "Trigonometry",
    subtopic: "Trig Ratios/Values",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Remembering",
    questionText:
      "Evaluate sinâ€¯30Â°Â Ã—Â cosâ€¯60Â°Â +Â tanâ€¯45Â°.",
    options: ["1/2", "1", "5/4", "3/4"],
    answer: "5/4",
    explanation:
      "sinâ€¯30Â° = 1/2 and cosâ€¯60Â° = 1/2, so their product is 1/4. tanâ€¯45Â° = 1; thus 1/4 + 1 = 5/4.",
  },
  {
    id: "2026-TRIG-MCQ-10",
    topicKey: "Trigonometry",
    subtopic: "Trig Ratios/Values",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Understanding",
    questionText:
      "If tanâ€¯Î¸ = 3/4 for an acute angle Î¸, then secâ€¯Î¸ equals:",
    options: ["5/4", "4/3", "5/3", "3/5"],
    answer: "5/4",
    explanation:
      "secÂ²â€¯Î¸ = 1 + tanÂ²â€¯Î¸ = 1 + 9/16 = 25/16 â‡’ secâ€¯Î¸ = 5/4.",
  },
  {
    id: "2026-TRIG-SA-11",
    topicKey: "Trigonometry",
    subtopic: "Trig Identities/Proofs",
    kind: "Short",
    section: "B",
    marks: 2,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "Prove that \\(\\\\frac{1 - \\\\cos Î¸}{1 + \\\\cos Î¸} = \\\\tan^2\\\\frac{Î¸}{2}\\).",
    answer:
      "Using 1 âˆ’ cosâ€¯Î¸ = 2â€¯sinÂ²(Î¸/2) and 1 + cosâ€¯Î¸ = 2â€¯cosÂ²(Î¸/2), the given expression simplifies to tanÂ²(Î¸/2).",
    explanation:
      "Express the numerator and denominator using the halfâ€‘angle identities. Cancelling factors gives tanÂ²(Î¸/2).",
    solutionSteps: [
      "Recall: 1 âˆ’ cosâ€¯Î¸ = 2â€¯sinÂ²(Î¸/2) and 1 + cosâ€¯Î¸ = 2â€¯cosÂ²(Î¸/2).",
      "Substitute into the fraction.",
      "Simplify to obtain tanÂ²(Î¸/2).",
    ],
    strategyHint:
      "Use halfâ€‘angle identities for 1 Â± cosâ€¯Î¸.",
  },
  {
    id: "2026-TRIG-SA-12",
    topicKey: "Trigonometry",
    subtopic: "Application/Heights & Distances",
    kind: "Short",
    section: "C",
    marks: 3,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "From the top of a 15Â m high tower, the angle of depression of a car on the road is 30Â°. Find the distance of the car from the foot of the tower. (Take \\(\\\\sqrt{3} = 1.732\\).",
    answer: "Approximately 25.98Â m.",
    explanation:
      "Let the horizontal distance be d. tanâ€¯30Â° = 15/d â‡’ 1/âˆš3 = 15/d â‡’ d = 15âˆš3 â‰ˆ 25.98Â m.",
    solutionSteps: [
      "Draw a right triangle with height 15Â m and base d.",
      "Use tanâ€¯30Â° = 1/âˆš3 = 15/d.",
      "Solve for d = 15âˆš3.",
      "Substitute âˆš3 = 1.732 to find d â‰ˆ 25.98Â m.",
    ],
    strategyHint:
      "Relate the angle of depression to the angle of elevation and apply the tangent ratio.",
  },
  {
    id: "2026-TRIG-AR-13",
    topicKey: "Trigonometry",
    subtopic: "Trig Ratios/Values",
    kind: "Assertion-Reasoning",
    section: "A",
    marks: 1,
    difficulty: "Medium",
    bloomSkill: "Understanding",
    questionText:
      "Assertion (A): sin(90Â° âˆ’ Î¸) = cosâ€¯Î¸ for all Î¸.\nReason (R): In a right triangle, exchanging the roles of the adjacent and opposite sides for complementary angles gives the cofunction identity.",
    answer:
      "Both Assertion and Reason are true and Reason is the correct explanation of Assertion.",
    explanation:
      "The cofunction identity follows from considering complementary angles in a right triangle. The reason clearly explains the assertion.",
  },
  {
    id: "2026-TRIG-CASE-14",
    topicKey: "Trigonometry",
    subtopic: "Application/Heights & Distances",
    kind: "Case-Based",
    section: "E",
    marks: 4,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "A vertical pole 12Â m high casts a shadow 4âˆš3Â m long on level ground. At the same time, a nearby tower casts a shadow 12âˆš3Â m long.\n(a) Find the angle of elevation of the Sun.\n(b) Calculate the height of the tower. (Take \\(\\\\sqrt{3} = 1.732\\).",
    answer:
      "Angle of elevation of the Sun = 60Â°; height of the tower = 36Â m.",
    explanation:
      "For the pole: tanâ€¯Î¸ = 12/(4âˆš3) = âˆš3 â‡’ Î¸ = 60Â°. For the tower with shadow 12âˆš3Â m, tanâ€¯60Â° = âˆš3 = height/(12âˆš3) â‡’ height = 12âˆš3 Ã— âˆš3 = 36Â m.",
    solutionSteps: [
      "Compute tanâ€¯Î¸ = 12/(4âˆš3) = âˆš3 and deduce Î¸ = 60Â°.",
      "Let the tower height be h. Write tanâ€¯60Â° = âˆš3 = h/(12âˆš3).",
      "Solve: h = 12âˆš3 Ã— âˆš3 = 36Â m.",
    ],
    strategyHint:
      "Use the same angle of elevation for both objects since observations are simultaneous.",
  },

  // ===== Statistics (mustâ€‘crack) =====
  {
    id: "2026-STAT-MCQ-07",
    topicKey: "Statistics",
    subtopic: "Mode of Grouped Data",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Understanding",
    questionText:
      "Given a frequency distribution with class intervals 0â€“10 (5), 10â€“20 (10) and 20â€“30 (15), the modal class is:",
    options: ["0â€“10", "10â€“20", "20â€“30", "Cannot be determined"],
    answer: "20â€“30",
    explanation:
      "The modal class has the greatest frequency. Here 20â€“30 has the highest frequency (15).",
  },
  {
    id: "2026-STAT-MCQ-08",
    topicKey: "Statistics",
    subtopic: "Median of Grouped Data",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Understanding",
    questionText:
      "For the same distribution (0â€“10:Â 5, 10â€“20:Â 10, 20â€“30:Â 15), the median class is:",
    options: ["0â€“10", "10â€“20", "20â€“30", "Cannot be determined"],
    answer: "10â€“20",
    explanation:
      "Total frequency is 30. The median (15th observation) lies in the class whose cumulative frequency reaches at least 15: the class 10â€“20.",
  },
  {
    id: "2026-STAT-SA-09",
    topicKey: "Statistics",
    subtopic: "Mean (Step Deviation)",
    kind: "Short",
    section: "B",
    marks: 2,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "Calculate the mean of the following data: values 2, 4, 6 and 8 have frequencies 3, 5, 4 and 2 respectively.",
    answer: "Mean â‰ˆ 4.71.",
    explanation:
      "Î£f = 14 and Î£f x = 2Â·3 + 4Â·5 + 6Â·4 + 8Â·2 = 66. Mean = 66/14 â‰ˆ 4.71.",
    solutionSteps: [
      "Total frequency = 3 + 5 + 4 + 2 = 14.",
      "Sum of products = 6 + 20 + 24 + 16 = 66.",
      "Mean = 66 Ã· 14 â‰ˆ 4.71.",
    ],
    strategyHint:
      "Use the direct formula \\(\\\\bar{x} = \\\\frac{\\\\Sigma f_i x_i}{\\\\Sigma f_i}\\).",
  },
  {
    id: "2026-STAT-SA-10",
    topicKey: "Statistics",
    subtopic: "Mean (Step Deviation)",
    kind: "Short",
    section: "C",
    marks: 3,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "Use the step deviation method to compute the mean of the following grouped data:\nClass: 0â€“10, 10â€“20, 20â€“30, 30â€“40\nFrequency: 4, 6, 10, 8.",
    answer: "Mean â‰ˆ 22.86.",
    explanation:
      "Midpoints: 5, 15, 25, 35; assumed mean A = 25; class width h = 10. d_i = (m_i âˆ’ 25)/10: âˆ’2, âˆ’1, 0, 1. Î£fd = âˆ’6 and Î£f = 28. Mean = 25 + (âˆ’6/28) Ã— 10 â‰ˆ 22.86.",
    solutionSteps: [
      "List midpoints and choose A = 25, h = 10.",
      "Compute deviations and multiply by frequencies.",
      "Find Î£fd = âˆ’6 and Î£f = 28.",
      "Substitute into \\(\\\\bar{x} = A + \\\\frac{\\\\Sigma fd}{\\\\Sigma f} Ã— h\\).",
    ],
    strategyHint:
      "Choose a convenient assumed mean to simplify calculations.",
  },
  {
    id: "2026-STAT-AR-11",
    topicKey: "Statistics",
    subtopic: "Mean (Step Deviation)",
    kind: "Assertion-Reasoning",
    section: "A",
    marks: 1,
    difficulty: "Medium",
    bloomSkill: "Understanding",
    questionText:
      "Assertion (A): In any dataset, the mode is the value with the highest frequency.\nReason (R): For a grouped frequency distribution, the class interval with the greatest frequency is called the modal class.",
    answer:
      "Both Assertion and Reason are true and Reason is the correct explanation of Assertion.",
    explanation:
      "Mode represents the most frequent observation. In grouped data, the class with highest frequency is termed the modal class.",
  },
  {
    id: "2026-STAT-CASE-12",
    topicKey: "Statistics",
    subtopic: "Mean (Step Deviation)",
    kind: "Case-Based",
    section: "E",
    marks: 4,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "A company records the daily wages of its 20 workers as follows:\nClass (â‚¹): 100â€“120, 120â€“140, 140â€“160, 160â€“180, 180â€“200\nFrequency: 2, 5, 8, 3, 2\n(a) Identify the modal class.\n(b) Estimate the mean daily wage using the stepâ€‘deviation method.\n(c) Comment on the wage distribution.",
    answer:
      "(a) The modal class is 140â€“160. (b) Mean â‰ˆ â‚¹148. (c) Wages cluster around the middle class; most workers earn between â‚¹140 and â‚¹160, indicating moderate dispersion.",
    explanation:
      "The highest frequency is 8 in the 140â€“160 class. Taking A = 150 and h = 20 yields Î£fd = âˆ’2 and Î£f = 20, so mean = 150 + (âˆ’2/20) Ã— 20 = 148. The distribution peaks in the middle class.",
    solutionSteps: [
      "Midpoints: 110, 130, 150, 170, 190; assumed mean A = 150; h = 20.",
      "Calculate d_i and Î£fd = âˆ’2; Î£f = 20.",
      "Mean = 150 + (âˆ’2/20) Ã— 20 = 148.",
      "Identify modal class as the one with highest frequency (140â€“160).",
      "Discuss that most frequencies lie near the middle class.",
    ],
    strategyHint:
      "Apply stepâ€‘deviation and interpret both mean and modal class.",
  },

  // ===== Probability (mustâ€‘crack) =====
  {
    id: "2026-PROB-MCQ-09",
    topicKey: "Probability",
    subtopic: "Single Event Probability",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Remembering",
    questionText:
      "A fair coin is tossed once. What is the probability of getting a tail?",
    options: ["0", "1/2", "1", "2"],
    answer: "1/2",
    explanation:
      "There are two equally likely outcomes (H or T). Only one is a tail, so probability = 1/2.",
  },
  {
    id: "2026-PROB-MCQ-10",
    topicKey: "Probability",
    subtopic: "Single Event Probability",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Understanding",
    questionText:
      "A fair die is rolled once. What is the probability of getting a prime number?",
    options: ["1/3", "1/2", "2/3", "1/6"],
    answer: "1/2",
    explanation:
      "Prime outcomes on a die are 2, 3 and 5. There are 3 favourable outcomes out of 6, so the probability is 3/6 = 1/2.",
  },
  {
    id: "2026-PROB-SA-11",
    topicKey: "Probability",
    subtopic: "Single Event Probability",
    kind: "Short",
    section: "B",
    marks: 2,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "A bag contains 3Â red balls, 5Â white balls and 7Â blue balls. A ball is drawn at random. Find the probability that it is (i) white, (ii) not red.",
    answer: "(i) 1/3, (ii) 4/5.",
    explanation:
      "Total balls = 15. (i) White balls = 5 â‡’ probability = 5/15 = 1/3. (ii) Not red = 5 + 7 = 12 â‡’ probability = 12/15 = 4/5.",
    solutionSteps: [
      "Compute total balls = 3 + 5 + 7 = 15.",
      "For (i), favourable outcomes = 5 â‡’ probability = 5/15.",
      "For (ii), favourable outcomes = 12 â‡’ probability = 12/15.",
    ],
    strategyHint:
      "Count favourable outcomes and divide by total outcomes.",
  },
  {
    id: "2026-PROB-SA-12",
    topicKey: "Probability",
    subtopic: "Combined/Word Problem Probability",
    kind: "Short",
    section: "C",
    marks: 3,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "Two coins are tossed simultaneously. Find the probability of getting (i) exactly one head, (ii) at most one head, and (iii) at least one head.",
    answer: "(i) 1/2, (ii) 3/4, (iii) 3/4.",
    explanation:
      "Sample space = {HH, HT, TH, TT}. Exactly one head in HT or TH: probability = 2/4. At most one head includes HT, TH, TT: probability = 3/4. At least one head includes HH, HT, TH: probability = 3/4.",
    solutionSteps: [
      "List all possible outcomes.",
      "Count favourable outcomes for each event.",
      "Divide by total outcomes (4).",
    ],
    strategyHint:
      "Enumerate outcomes for two coin tosses and classify them by number of heads.",
  },
  {
    id: "2026-PROB-AR-13",
    topicKey: "Probability",
    subtopic: "Probability Axioms",
    kind: "Assertion-Reasoning",
    section: "A",
    marks: 1,
    difficulty: "Medium",
    bloomSkill: "Understanding",
    questionText:
      "Assertion (A): The probability of an event always lies between 0 and 1.\nReason (R): The number of favourable outcomes for an event cannot exceed the total number of equally likely outcomes.",
    answer:
      "Both Assertion and Reason are true and Reason is the correct explanation of Assertion.",
    explanation:
      "An event's probability is a ratio of non-negative counts to total outcomes and therefore cannot exceed 1. The reason explains why the ratio is bounded.",
  },
  {
    id: "2026-PROB-CASE-14",
    topicKey: "Probability",
    subtopic: "Combined/Word Problem Probability",
    kind: "Case-Based",
    section: "E",
    marks: 4,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "A box contains 6Â green pens, 4Â blue pens and 5Â black pens. Two pens are drawn at random one after the other without replacement. Find the probability that:\n(a) both pens are green,\n(b) one pen is green and the other is blue,\n(c) none of the pens is black.",
    answer: "(a) 1/7, (b) 8/35, (c) 3/7.",
    explanation:
      "Total pens = 15. (a) P(GG) = (6/15) x (5/14) = 1/7. (b) P(GB or BG) = (6/15)(4/14) + (4/15)(6/14) = 8/35. (c) Non-black pens = 10 => P(both non-black) = (10/15) x (9/14) = 3/7.",
    solutionSteps: [
      "Count total pens and identify favourable outcomes for each event.",
      "Calculate probabilities sequentially without replacement.",
      "Sum probabilities for (b) where order matters.",
    ],
    strategyHint:
      "Adjust the denominator after the first draw and consider both orders for mixed draws.",
  },

  // ===== Real Numbers (high-roi) =====
  {
    id: "2026-RN-MCQ-03",
    topicKey: "Real Numbers",
    subtopic: "Euclid's Division Algorithm",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Remembering",
    questionText: "The HCF of 42 and 56 is:",
    options: ["7", "8", "14", "6"],
    answer: "14",
    explanation:
      "Applying Euclid's algorithm: 56 = 42 x 1 + 14 and 42 = 14 x 3 + 0, giving HCF = 14.",
  },
  {
    id: "2026-RN-MCQ-04",
    topicKey: "Real Numbers",
    subtopic: "Decimal Expansions",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Understanding",
    questionText:
      "Which of the following rational numbers has a terminating decimal expansion?",
    options: ["2/15", "3/7", "14/125", "1/11"],
    answer: "14/125",
    explanation:
      "A fraction has a terminating decimal expansion when its denominator (in lowest terms) has only the prime factors 2 or 5. 125 = 5^3, so 14/125 qualifies.",
  },
  {
    id: "2026-RN-SA-05",
    topicKey: "Real Numbers",
    subtopic: "Euclid's Division Algorithm",
    kind: "Short",
    section: "B",
    marks: 2,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "Use Euclid's division lemma to find the HCF of 135 and 225 and express it as a linear combination of 135 and 225.",
    answer: "HCF = 45 and 45 = 2 x 135 - 225.",
    explanation:
      "Applying Euclid's algorithm: 225 = 135 x 1 + 90; 135 = 90 x 1 + 45; 90 = 45 x 2 + 0, so HCF = 45. Back-substituting gives 45 = 135 - (225 - 135) = 2 x 135 - 225.",
    solutionSteps: [
      "Perform Euclid's algorithm to find the HCF.",
      "Express the remainder relation: 45 = 135 - 90 and 90 = 225 - 135.",
      "Substitute to get 45 = 2 x 135 - 225.",
    ],
    strategyHint:
      "After finding the HCF, work backwards to express it as a linear combination.",
  },
  {
    id: "2026-RN-AR-06",
    topicKey: "Real Numbers",
    subtopic: "Irrational Numbers & Proofs",
    kind: "Assertion-Reasoning",
    section: "A",
    marks: 1,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "Assertion (A): \\(\\\\sqrt{5}\\) is an irrational number.\nReason (R): The square root of any prime number is irrational.",
    answer:
      "Both Assertion and Reason are true and Reason is the correct explanation of Assertion.",
    explanation:
      "Prime factors of 5 cannot be paired to form a rational square. The Fundamental Theorem of Arithmetic shows that âˆšp is irrational for any prime p.",
  },

  // ===== Polynomials (highâ€‘roi) =====
  {
    id: "2026-POLY-MCQ-05",
    topicKey: "Polynomials",
    subtopic: "Coefficientâ€“root Relations",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Understanding",
    questionText:
      "If one zero of the cubic polynomial f(x) = xÂ³ âˆ’ 4xÂ² + 3x is 0, what is the sum of the other two zeroes?",
    options: ["1", "3", "4", "5"],
    answer: "4",
    explanation:
      "Sum of all zeroes = coefficient of xÂ² with sign changed = 4. One zero is 0, so the sum of the remaining two zeroes is 4.",
  },
  {
    id: "2026-POLY-MCQ-06",
    topicKey: "Polynomials",
    subtopic: "Factor Theorem",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Understanding",
    questionText:
      "Which of the following is a factor of the polynomial xÂ³ + xÂ² âˆ’ 4x âˆ’ 4?",
    options: ["x âˆ’ 1", "x + 1", "x âˆ’ 2", "x + 2"],
    answer: "x + 1",
    explanation:
      "Substitute x = âˆ’1: (âˆ’1)Â³ + (âˆ’1)Â² âˆ’ 4(âˆ’1) âˆ’ 4 = âˆ’1 + 1 + 4 âˆ’ 4 = 0, so x + 1 is a factor by the Factor Theorem.",
  },
  {
    id: "2026-POLY-SA-07",
    topicKey: "Polynomials",
    subtopic: "Zeros & Factorisation",
    kind: "Short",
    section: "C",
    marks: 3,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "Divide the polynomial p(x) = xâ´ âˆ’ 5xÂ³ + 7x âˆ’ 3 by xÂ² âˆ’ 2 and find the quotient and remainder.",
    answer: "Quotient = xÂ² âˆ’ 5x + 2; Remainder = 1 âˆ’ 3x.",
    explanation:
      "Perform polynomial long division. After dividing term by term, the quotient is xÂ² âˆ’ 5x + 2 and the remainder is 1 âˆ’ 3x.",
    solutionSteps: [
      "Arrange p(x) and the divisor in descending powers.",
      "Divide the highest degree term and subtract repeatedly.",
      "Stop when the degree of the remainder is less than that of the divisor.",
    ],
    strategyHint:
      "Align like terms carefully during polynomial division.",
  },
  {
    id: "2026-POLY-CASE-08",
    topicKey: "Polynomials",
    subtopic: "Zeros & Factorisation",
    kind: "Case-Based",
    section: "E",
    marks: 4,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "The polynomial f(x) = xÂ³ âˆ’ 6xÂ² + 11x âˆ’ 6 models the number of organisms in a culture dish (in millions) after x hours.\n(a) Factorise f(x) completely.\n(b) Find the times at which the population becomes zero.\n(c) Discuss which of these times are meaningful.",
    answer:
      "(a) f(x) = (x âˆ’ 1)(x âˆ’ 2)(x âˆ’ 3). (b) The roots are x = 1, 2 and 3Â hours. (c) All three roots are positive and correspond to possible times when the population could become zero.",
    explanation:
      "By testing small integers, f(1) = f(2) = f(3) = 0. Factorising gives (x âˆ’ 1)(x âˆ’ 2)(x âˆ’ 3). The positive roots represent times at which the population would be zero; negative times are not meaningful.",
    solutionSteps: [
      "Evaluate f(1), f(2) and f(3) to find zeros.",
      "Use synthetic division or repeated factorisation to obtain f(x) = (x âˆ’ 1)(x âˆ’ 2)(x âˆ’ 3).",
      "Interpret the positive roots in the context of time.",
    ],
    strategyHint:
      "Test small integer values to identify factors and relate roots to realâ€‘world contexts.",
  },

  // ===== Arithmetic Progression (highâ€‘roi) =====
  {
    id: "2026-AP-MCQ-05",
    topicKey: "Arithmetic Progression",
    subtopic: "nth Term",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Applying",
    questionText:
      "What is the 10th term of the arithmetic progression 3, 8, 13, â€¦?",
    options: ["48", "45", "50", "53"],
    answer: "48",
    explanation:
      "First term a = 3 and common difference d = 5. 10th term = a + 9d = 3 + 45 = 48.",
  },
  {
    id: "2026-AP-MCQ-06",
    topicKey: "Arithmetic Progression",
    subtopic: "Sum of n Terms",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Understanding",
    questionText:
      "Find the sum of the first 20 terms of the arithmetic progression 2, 5, 8, â€¦. (Assume n â‰¥ 1).",
    options: ["400", "610", "620", "590"],
    answer: "610",
    explanation:
      "a = 2, d = 3. Sâ‚™ = n/2[2a + (n âˆ’ 1)d] â‡’ Sâ‚‚â‚€ = 10[4 + 57] = 610.",
  },
  {
    id: "2026-AP-SA-07",
    topicKey: "Arithmetic Progression",
    subtopic: "nth Term",
    kind: "Short",
    section: "B",
    marks: 2,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "In an arithmetic progression, the 5th term is 22 and the 13th term is 46. Find the first term and the common difference.",
    answer: "First term = 10, common difference = 3.",
    explanation:
      "Let a be the first term and d be the common difference. Then a + 4d = 22 and a + 12d = 46. Subtracting gives 8d = 24 â‡’ d = 3; substituting back gives a = 10.",
    solutionSteps: [
      "Write equations: a + 4d = 22 and a + 12d = 46.",
      "Subtract to eliminate a and solve for d.",
      "Substitute d into one equation to find a.",
    ],
    strategyHint:
      "Use the nthâ€‘term formula and solve the resulting system.",
  },
  {
    id: "2026-AP-AR-08",
    topicKey: "Arithmetic Progression",
    subtopic: "Sum of n Terms",
    kind: "Assertion-Reasoning",
    section: "A",
    marks: 1,
    difficulty: "Medium",
    bloomSkill: "Understanding",
    questionText:
      "Assertion (A): In any arithmetic progression, the sum of terms equidistant from the beginning and the end is the same.\nReason (R): For an arithmetic progression, each pair of equidistant terms adds up to the sum of the first and last terms.",
    answer:
      "Both Assertion and Reason are true and Reason is the correct explanation of Assertion.",
    explanation:
      "In an AP, the kâ€‘th term from the beginning and the kâ€‘th term from the end are a + (k âˆ’ 1)d and l âˆ’ (k âˆ’ 1)d. Their sum is a + l, independent of k.",
  },

  // ===== Coordinate Geometry (highâ€‘roi) =====
  {
    id: "2026-CG-MCQ-08",
    topicKey: "Coordinate Geometry",
    subtopic: "Distance Formula",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Applying",
    questionText:
      "The distance between the points (2, âˆ’3) and (âˆ’4, 5) is:",
    options: ["2âˆš13", "10", "âˆš52", "8"],
    answer: "10",
    explanation:
      "Distance = âˆš[(2 + 4)Â² + (âˆ’3 âˆ’ 5)Â²] = âˆš[6Â² + (âˆ’8)Â²] = âˆš100 = 10.",
  },
  {
    id: "2026-CG-MCQ-09",
    topicKey: "Coordinate Geometry",
    subtopic: "Distance Formula",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "If a point (x, 4) is equidistant from (2, âˆ’1) and (âˆ’2, 3), then x equals:",
    options: ["1", "2", "3", "4"],
    answer: "3",
    explanation:
      "Equate squares of distances: (x âˆ’ 2)Â² + 25 = (x + 2)Â² + 1 â‡’ âˆ’4x + 29 = 4x + 5 â‡’ x = 3.",
  },
  {
    id: "2026-CG-SA-10",
    topicKey: "Coordinate Geometry",
    subtopic: "Section Formula",
    kind: "Short",
    section: "C",
    marks: 3,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "Find the coordinates of the point that divides the line segment joining A(2,Â 3) and B(8,Â 5) internally in the ratio 3â€¯:â€¯2.",
    answer: "The point is (28/5, 21/5) or (5.6, 4.2).",
    explanation:
      "Using the section formula: x = (3Ã—8 + 2Ã—2)/5 = 28/5, y = (3Ã—5 + 2Ã—3)/5 = 21/5.",
    solutionSteps: [
      "Label A(xâ‚, yâ‚) = (2,3) and B(xâ‚‚, yâ‚‚) = (8,5); m:n = 3:2.",
      "Apply section formula: x = (m xâ‚‚ + n xâ‚)/(m + n), y = (m yâ‚‚ + n yâ‚)/(m + n).",
      "Compute x and y to get (28/5, 21/5).",
    ],
    strategyHint:
      "Multiply the coordinates by the opposite segment lengths and divide by the total parts.",
  },
  {
    id: "2026-CG-CASE-11",
    topicKey: "Coordinate Geometry",
    subtopic: "Distance Formula",
    kind: "Case-Based",
    section: "E",
    marks: 4,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "Given triangle P(1,Â 1), Q(4,Â 5) and R(7,Â 1):\n(a) Show that PQ = QR.\n(b) Find the area of Î”PQR using the coordinate method.\n(c) State the type of triangle PQR is.",
    answer:
      "(a) PQ = QR = 5Â units. (b) Area of Î”PQR = 12Â square units. (c) Î”PQR is an isosceles triangle.",
    explanation:
      "Compute PQ = âˆš[(4 âˆ’ 1)Â² + (5 âˆ’ 1)Â²] = 5 and QR = âˆš[(7 âˆ’ 4)Â² + (1 âˆ’ 5)Â²] = 5. Using the determinant formula, area = Â½|1(5 âˆ’ 1) + 4(1 âˆ’ 1) + 7(1 âˆ’ 5)| = 12. Two equal sides imply an isosceles triangle.",
    solutionSteps: [
      "Use the distance formula to show PQ and QR both equal 5.",
      "Use the coordinate area formula to compute area.",
      "Conclude that the triangle is isosceles.",
    ],
    strategyHint:
      "Compute side lengths and use the determinant method for area.",
  },

  // ===== Circles (highâ€‘roi) =====
  {
    id: "2026-CIRC-MCQ-08",
    topicKey: "Circles",
    subtopic: "Tangent Properties",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Understanding",
    questionText:
      "From a point A, a tangent AT is drawn to a circle with centre O and radius r. If OA = 13Â cm and AT = 12Â cm, the radius r is:",
    options: ["5Â cm", "12Â cm", "13Â cm", "25Â cm"],
    answer: "5Â cm",
    explanation:
      "Right triangle OAT gives OAÂ² = OTÂ² + ATÂ² â‡’ 13Â² = rÂ² + 12Â² â‡’ rÂ² = 25 â‡’ r = 5Â cm.",
  },
  {
    id: "2026-CIRC-MCQ-09",
    topicKey: "Circles",
    subtopic: "Tangent Theorems & Proofs",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "Two tangents PA and PB are drawn to a circle from an external point P. If chord AB subtends an angle of 60Â° at the centre, then âˆ APB equals:",
    options: ["30Â°", "60Â°", "90Â°", "120Â°"],
    answer: "120Â°",
    explanation:
      "The angle between tangents is supplementary to the central angle subtended by the chord: âˆ APB = 180Â° âˆ’ 60Â° = 120Â°.",
  },
  {
    id: "2026-CIRC-SA-10",
    topicKey: "Circles",
    subtopic: "Tangent Properties",
    kind: "Short",
    section: "B",
    marks: 2,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "From an external point P, tangents PT and PS are drawn to a circle with centre O. If OP = 25Â cm and PT = 24Â cm, find the radius of the circle.",
    answer: "7Â cm.",
    explanation:
      "OT âŸ‚ PT. In Î”OPT: OPÂ² = PTÂ² + OTÂ² â‡’ 25Â² = 24Â² + rÂ² â‡’ r = 7Â cm.",
    solutionSteps: [
      "Recognise that OT is perpendicular to PT at T.",
      "Apply the Pythagoras theorem in Î”OPT.",
      "Substitute OP = 25 and PT = 24 to find r.",
    ],
    strategyHint:
      "Use the property that tangents from an external point are equal and perpendicular to the radius.",
  },
  {
    id: "2026-CIRC-CASE-11",
    topicKey: "Circles",
    subtopic: "Number/Type of Tangents",
    kind: "Case-Based",
    section: "E",
    marks: 4,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "A circle has radius 5Â cm. Two chords are drawn at distances of 4Â cm and 3Â cm from the centre.\n(a) Find the length of each chord.\n(b) Which chord is longer and why?",
    answer:
      "(a) The chord at 4Â cm from the centre is 6Â cm; the chord at 3Â cm is 8Â cm. (b) The chord closer to the centre (3Â cm away) is longer.",
    explanation:
      "Chord length = 2âˆš(rÂ² âˆ’ dÂ²). For d = 4: 2âˆš(25 âˆ’ 16) = 6Â cm. For d = 3: 2âˆš(25 âˆ’ 9) = 8Â cm. The closer chord subtends a larger arc and is longer.",
    solutionSteps: [
      "Use chord length formula L = 2âˆš(rÂ² âˆ’ dÂ²).",
      "Compute lengths for d = 4 and d = 3.",
      "Compare and explain why the chord nearer the centre is longer.",
    ],
    strategyHint:
      "Remember the relationship between distance from the centre and chord length.",
  },

  // ===== Surface Areas and Volumes (highâ€‘roi) =====
  {
    id: "2026-SAV-MCQ-06",
    topicKey: "Surface Areas and Volumes",
    subtopic: "Cylinder/Cone/Sphere",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Applying",
    questionText:
      "What is the volume of a sphere of radius 3Â cm? (Take Ï€ = 22/7)",
    options: [
      "36Ï€Â cmÂ³",
      "72Ï€Â cmÂ³",
      "113Â 1/7Â cmÂ³",
      "452/7Â cmÂ³",
    ],
    answer: "113Â 1/7Â cmÂ³",
    explanation:
      "Volume = \\((4/3)Ï€rÂ³ = (4/3) Ã— (22/7) Ã— 27 = 792/7 â‰ˆ 113\\\\frac{1}{7}\\\\).",
  },
  {
    id: "2026-SAV-MCQ-07",
    topicKey: "Surface Areas and Volumes",
    subtopic: "Cylinder/Cone/Sphere",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Medium",
    bloomSkill: "Understanding",
    questionText:
      "If the ratio of the surface areas of two spheres is 16Â :Â 25, the ratio of their volumes is:",
    options: ["4Â :Â 5", "8Â :Â 15", "64Â :Â 125", "16Â :Â 25"],
    answer: "64Â :Â 125",
    explanation:
      "Surface area ratio = (râ‚/râ‚‚)Â² = 16/25 â‡’ râ‚/râ‚‚ = 4/5. Volume ratio = (râ‚/râ‚‚)Â³ = (4/5)Â³ = 64/125.",
  },
  {
    id: "2026-SAV-SA-08",
    topicKey: "Surface Areas and Volumes",
    subtopic: "Combination/Transformation",
    kind: "Short",
    section: "C",
    marks: 3,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "A metal sphere of radius 10Â cm is melted and recast into small cones, each of radius 2.5Â cm and height 8Â cm. How many such cones can be formed? (Use Ï€ in your answer.)",
    answer: "80 cones.",
    explanation:
      "Volume of sphere = \\((4/3)Ï€(10)Â³ = 4000/3 Ï€\\\\). Volume of one cone = \\((1/3)Ï€(2.5)Â² Ã— 8 = 50/3 Ï€\\\\). Number of cones = (4000/3)/(50/3) = 80.",
    solutionSteps: [
      "Compute sphere volume: \\((4/3)Ï€(10)Â³\\\\).",
      "Compute cone volume: \\((1/3)Ï€(2.5)Â² Ã— 8\\\\).",
      "Divide V_s by V_c.",
    ],
    strategyHint:
      "Conservation of volume applies when recasting shapes.",
  },
  {
    id: "2026-SAV-CASE-09",
    topicKey: "Surface Areas and Volumes",
    subtopic: "Cylinder/Cone/Sphere",
    kind: "Case-Based",
    section: "E",
    marks: 4,
    difficulty: "Medium",
    bloomSkill: "Analysing",
    questionText:
      "A cylindrical water tank of radius 1.5Â m and height 5Â m has to be painted both inside and outside, leaving the top open. The cost of painting is â‚¹120 per square metre. Calculate the total cost.",
    answer: "Approximately â‚¹13,020.",
    explanation:
      "Outer curved surface area + base = 2Ï€rh + Ï€rÂ² = 17.25Ï€Â mÂ². Inner curved surface area + base = 17.25Ï€Â mÂ². Total area = 34.5Ï€Â mÂ² â‰ˆ 108.5Â mÂ² (taking Ï€ â‰ˆ 3.14). Cost â‰ˆ 108.5 Ã— 120 â‰ˆ â‚¹13,020.",
    solutionSteps: [
      "Calculate outer curved surface: 2Ï€rh = 2Ï€Ã—1.5Ã—5 = 15Ï€.",
      "Calculate area of base: Ï€rÂ² = 2.25Ï€.",
      "Total outer + inner surface (excluding top) = 2 Ã— (15Ï€ + 2.25Ï€) = 34.5Ï€.",
      "Convert to decimal using Ï€ â‰ˆ 3.14 and multiply by â‚¹120.",
    ],
    strategyHint:
      "Paint both inner and outer surfaces except the open top.",
  },

  // ===== Constructions (goodâ€‘toâ€‘do) =====
  {
    id: "2026-CONST-MCQ-04",
    topicKey: "Constructions",
    subtopic: "Divide Segment",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Understanding",
    questionText:
      "To divide a given line segment AB into 4 equal parts using ruler and compass, how many equal divisions should be marked on an auxiliary ray?",
    options: ["2", "3", "4", "5"],
    answer: "4",
    explanation:
      "To divide a segment into n equal parts, mark n equal arcs on the auxiliary ray. Therefore 4 equal marks are required.",
  },
  {
    id: "2026-CONST-SA-05",
    topicKey: "Constructions",
    subtopic: "Divide Segment",
    kind: "Short",
    section: "C",
    marks: 3,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "Construct a line segment PQ of length 8Â cm and divide it internally in the ratio 3Â :Â 2 using only a straightedge and compass. Describe the steps and justify your construction.",
    answer:
      "Draw PQ = 8Â cm. Draw an acute ray PR. Mark five equal segments on PR. Join the fifth mark to Q. Through the third mark draw a line parallel to this, meeting PQ at S. Then PS:PQ = 3:5 and SQ:PQ = 2:5, so S divides PQ in the ratio 3:2.",
    explanation:
      "Using equal divisions and drawing a parallel line ensures that corresponding segments are proportional (Basic Proportionality Theorem). Hence PS:SQ = 3:2.",
    solutionSteps: [
      "Draw PQ = 8Â cm and an acute ray PR.",
      "On PR, mark five equal divisions (since 3 + 2 = 5 parts).",
      "Join the fifth division point to Q.",
      "Through the third division point, draw a line parallel to this connecting line to meet PQ at S.",
      "PS:PQ = 3:5 â‡’ PS = 4.8Â cm and SQ = 3.2Â cm.",
    ],
    strategyHint:
      "Divide the auxiliary ray into total parts equal to the sum of the ratio terms.",
  },

  // ===== Areas Related to Circles (goodâ€‘toâ€‘do) =====
  {
    id: "2026-ARC-MCQ-03",
    topicKey: "Areas Related to Circles",
    subtopic: "Sectors and Segments",
    kind: "MCQ",
    section: "A",
    marks: 1,
    difficulty: "Easy",
    bloomSkill: "Applying",
    questionText:
      "Find the area of a sector of a circle with radius 7Â cm and angle 60Â°. (Take Ï€ = 22/7.)",
    options: ["77Â cmÂ²", "154/3Â cmÂ²", "77/3Â cmÂ²", "154Â cmÂ²"],
    answer: "77/3Â cmÂ²",
    explanation:
      "Area = (60/360) Ã— Ï€rÂ² = (1/6) Ã— 22/7 Ã— 49 = 154/6 = 77/3Â cmÂ².",
  },
  {
    id: "2026-ARC-SA-04",
    topicKey: "Areas Related to Circles",
    subtopic: "Composite Figures",
    kind: "Short",
    section: "C",
    marks: 3,
    difficulty: "Medium",
    bloomSkill: "Applying",
    questionText:
      "A running track consists of two straight sections each of length 50Â m joined by two semicircles of radius 20Â m. Find the total length of the track and the area enclosed by it. (Take Ï€ = 3.14.)",
    answer:
      "Length â‰ˆ 225.6Â m; Area â‰ˆ 3,256Â mÂ².",
    explanation:
      "Length: two semicircles make a full circle of circumference 2Ï€r = 40Ï€Â m; adding straight sections gives 40Ï€ + 100 â‰ˆ 125.6 + 100 = 225.6Â m. Area: rectangle 50 Ã— 40 = 2,000Â mÂ² plus circle area Ï€rÂ² = 3.14 Ã— 400 = 1,256Â mÂ²; total â‰ˆ 3,256Â mÂ².",
    solutionSteps: [
      "Compute the circular part: circumference = 2Ï€Ã—20 = 40Ï€Â m.",
      "Add the two straight segments (100Â m).",
      "For area, combine the area of the rectangle (50 Ã— 40) and the area of the full circle (Ï€Ã—20Â²).",
      "Use Ï€ = 3.14 for numerical results.",
    ],
    strategyHint:
      "Break the track into simple geometric shapes: a rectangle and a circle.",
  },
  {
    id: "2026-TRIG-LA-13",
    topicKey: "Trigonometry",
    subtopic: "Application/Heights & Distances",
    kind: "Short",
    section: "D",
    marks: 5,
    difficulty: "Hard",
    bloomSkill: "Applying",
    questionText:
      "From the top of a tower, the angle of depression of two objects on the same straight line with the foot of the tower are 45Â° and 30Â°. If the two objects are 40 m apart, find the height of the tower and the distance of the nearer object from the foot of the tower.",
    answer:
      "Let nearer distance = x m, farther distance = x + 40 m. tan45Â° = h/x gives h = x. tan30Â° = h/(x+40) gives h = (x+40)/âˆš3. Equating: x = (x+40)/âˆš3 â‡’ x(âˆš3âˆ’1)=40 â‡’ x = 20(âˆš3+1). Height h = 20(âˆš3+1) m.",
    finalAnswer:
      "Height of tower = 20(âˆš3+1) m and distance of nearer object from foot = 20(âˆš3+1) m.",
    explanation:
      "Board-style 5-mark application that combines two depression angles with a shared-height setup.",
    solutionSteps: [
      "Draw a labelled diagram with tower AB and points C (nearer) and D (farther) on horizontal line through B.",
      "Use angle of depression = angle of elevation to write âˆ ACB = 45Â° and âˆ ADB = 30Â°.",
      "Assume BC = x, so BD = x + 40 and AB = h.",
      "From triangle ABC: tan45Â° = h/x â‡’ h = x.",
      "From triangle ABD: tan30Â° = h/(x+40) â‡’ h = (x+40)/âˆš3.",
      "Equate both values of h and solve for x.",
      "State h and BC clearly with units.",
    ],
    strategyHint:
      "For two observations on one line, create two tan equations using the same height variable.",
    policyTag: "Trigonometry 5-mark competency application",
    pastBoardYear: "2024",
  },
];
