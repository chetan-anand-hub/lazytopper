// src/data/class10ExampleQuestions.ts

// We keep this file simple on purpose – no fancy TypeScript types,
// so it doesn't create new TS errors anywhere else.

export const exampleQuestionsByTopic: Record<
  string,
  Record<string, { id: string; label: string; marks: number; difficulty: string; text: string }[]>
> = {
  "Pair of Linear Equations": {
    "Algebraic Solution Methods": [
      {
        id: "ple-alg-1",
        label: "CBSE-style, 3 marks (elimination method)",
        marks: 3,
        difficulty: "Medium",
        text:
          "Solve the following pair of linear equations using the elimination method:\n" +
          "3x + 4y = 10\n" +
          "2x − y = 1",
      },
      {
        id: "ple-alg-2",
        label: "CBSE-style, 4 marks (substitution / comparison)",
        marks: 4,
        difficulty: "Medium",
        text:
          "Solve the following pair of linear equations and hence find the value of x and y:\n" +
          "2x − 3y = 7\n" +
          "x + 2y = 4",
      },
    ],

    "Word & Application Problems": [
      {
        id: "ple-word-1",
        label: "CBSE-style, 4 marks (age problem)",
        marks: 4,
        difficulty: "Medium",
        text:
          "The sum of the ages of a father and his son is 50 years. Four years ago, the father's age was three times the age of his son. Form a pair of linear equations in two variables and find their present ages.",
      },
      {
        id: "ple-word-2",
        label: "CBSE-style, 4 marks (number problem)",
        marks: 4,
        difficulty: "Medium",
        text:
          "The sum of two numbers is 35. Three times the larger number exceeds twice the smaller number by 15. Form a pair of linear equations to represent this situation and find the numbers.",
      },
    ],

    "Graphical Solutions/Nature": [
      {
        id: "ple-graph-1",
        label: "CBSE-style, 3 marks (intersection point)",
        marks: 3,
        difficulty: "Easy",
        text:
          "Draw the graphs of the equations 2x + y = 6 and x − y = 1 on the same graph paper. From the graph, find the solution of the pair of linear equations.",
      },
      {
        id: "ple-graph-2",
        label: "CBSE-style, 3 marks (nature of solutions)",
        marks: 3,
        difficulty: "Easy",
        text:
          "By graphical method, show that the pair of equations 3x + 2y = 6 and 6x + 4y = 12 has infinitely many solutions. How is this visible from the graph?",
      },
    ],
  },

  // You can add more topics gradually in the same structure later, e.g.:
  //
  // "Triangles": {
  //   "Similarity Criteria": [ ... ],
  //   "BPT (Basic Proportionality Theorem)": [ ... ],
  //   ...
  // },
};
