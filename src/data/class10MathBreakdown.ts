// src/data/class10MathBreakdown.ts

export type TopicDetail = {
  weightage_percent: number;
  key_concepts: string[];
  examples: string[];
};

export type AreaDetail = Record<string, TopicDetail>;

export interface Class10MathBreakdown {
  [area: string]: AreaDetail;
}

export const class10MathBreakdown: Class10MathBreakdown = {
  Algebra: {
    "Linear Equations": {
      weightage_percent: 30,
      key_concepts: [
        "Graphical Solution",
        "Algebraic Methods",
        "Applications/Word Problems"
      ],
      examples: [
        "Solve: 2x + 3y = 11, 3x - 2y = 4.",
        "The sum of two numbers is 15 and their difference is 5. Find the numbers.",
        "If the difference between two numbers is 2 and their sum is 10, what are the numbers?"
      ]
    },
    "Quadratic Equations": {
      weightage_percent: 25,
      key_concepts: ["Finding Roots", "Nature of Roots", "Application Problems"],
      examples: [
        "Solve: x^2 - 8x + 16 = 0.",
        "If the roots of x^2 + kx + 6 = 0 are equal, find k.",
        "A piece of cloth costs ₹200. If the piece was 5m longer and each metre was ₹2 less, the cost would remain unchanged. Find the length of the piece."
      ]
    },
    Polynomials: {
      weightage_percent: 20,
      key_concepts: [
        "Relationship of Zeros & Coefficients",
        "Construct Quadratic Polynomial from Roots"
      ],
      examples: [
        "Find the quadratic polynomial whose zeroes are 2 and -3.",
        "If α and β are zeroes of polynomial x^2 + px + 6 and α + β = 4, find p.",
        "Show that the graph of x^2 - 1 passes through (0, -1) and (1, 0)."
      ]
    },
    "Arithmetic Progression": {
      weightage_percent: 25,
      key_concepts: ["nth Term", "Sum of n Terms", "Application in Life"],
      examples: [
        "Find the 12th term of the AP: 3, 7, 11, ...",
        "Find the sum of first 15 terms of the AP: 4, 9, 14, ...",
        "A sum of ₹1000 is to be distributed among 10 people such that every next person gets ₹20 more than previous. Find the share of each."
      ]
    }
  },

  Geometry: {
    Triangles: {
      weightage_percent: 65,
      key_concepts: [
        "Similarity Criteria",
        "BPT",
        "Pythagoras Theorem",
        "Area Ratios"
      ],
      examples: [
        "In ∆ABC, if DE || BC and AD/DB = 2/3, find AE/EC.",
        "Prove: In a right triangle, the square of the hypotenuse equals the sum of squares of other two sides.",
        "If two triangles have sides in ratio 3:4, what is the ratio of their areas?"
      ]
    },
    Circles: {
      weightage_percent: 20,
      key_concepts: ["Properties of Tangents", "Theorems on Tangents"],
      examples: [
        "Prove that the tangents drawn from an external point to a circle are equal.",
        "Find the length of tangent drawn from a point 13 cm from the centre of a circle of radius 5 cm.",
        "Draw tangents to a circle of radius 4 cm from a point 8 cm away from its centre."
      ]
    },
    Constructions: {
      weightage_percent: 15,
      key_concepts: ["Division of Line", "Construction of Tangents"],
      examples: [
        "Construct a triangle similar to a given triangle as per required scale factor.",
        "Divide a line segment of length 8 cm in the ratio 3:5.",
        "Construct two tangents from a point 7 cm away from centre of a circle of radius 3 cm."
      ]
    }
  },

  Mensuration: {
    "Surface Areas & Volumes": {
      weightage_percent: 75,
      key_concepts: [
        "Surface Area Cube/Cuboid/Cylinder/Sphere/Cone",
        "Volume",
        "Frustum",
        "Conversion"
      ],
      examples: [
        "Find the total surface area of a cylinder of radius 7 cm and height 10 cm.",
        "A solid sphere is melted to form 3 smaller spheres. Find the radius.",
        "Volume of a cuboid is 144 cm³. If base area is 36 cm², find its height."
      ]
    },
    "Areas Related to Circles": {
      weightage_percent: 25,
      key_concepts: ["Area of Sector/Segment", "Perimeter of Segment"],
      examples: [
        "Find the area of sector of circle of radius 6 cm and angle 60°.",
        "A semi-circular piece of metal of radius 14 cm is bent into a cone. Find the base radius of the cone formed.",
        "What is the perimeter of the sector of a circle with radius 5 cm and angle 60°?"
      ]
    }
  },

  Statistics_Probability: {
    Statistics: {
      weightage_percent: 65,
      key_concepts: [
        "Mean by Step Deviation",
        "Median",
        "Mode",
        "Ogive/Graphs"
      ],
      examples: [
        "Find the mean of the following data using step deviation method: Classes: 10-20, 20-30, 30-40. Frequencies: 3, 6, 5.",
        "Write the formula for mode in a grouped frequency table.",
        "Draw an ogive for the data given."
      ]
    },
    Probability: {
      weightage_percent: 35,
      key_concepts: ["Classical Probability", "Simple Events"],
      examples: [
        "A bag contains 5 red and 7 black balls. If one ball is drawn at random, what is the probability it is black?",
        "Probability of getting 6 on a single die roll:",
        "From numbers 1 to 10, find the probability of picking an even number."
      ]
    }
  },

  Trigonometry: {
    "Intro & Ratios": {
      weightage_percent: 50,
      key_concepts: ["Definition of Ratios", "Trigonometric Values"],
      examples: [
        "What is value of sin 60°?",
        "Find value of tan 45°.",
        "If sin θ = 1/2, find θ."
      ]
    },
    Identities: {
      weightage_percent: 30,
      key_concepts: ["Proofs", "Simplification Using Identities"],
      examples: [
        "Prove that sin²θ + cos²θ = 1.",
        "Simplify: sec²A - tan²A"
      ]
    },
    "Heights & Distances": {
      weightage_percent: 20,
      key_concepts: ["Angle of Elevation/Depression"],
      examples: [
        "A tower is 20 m high. Find the angle of elevation from a point 20 m away from base.",
        "A ladder is placed against a wall so that it makes an angle of 60° with the ground. If the foot of the ladder is 5 m away from wall, find length of ladder."
      ]
    }
  },

  "Coordinate Geometry": {
    "Distance Formula": {
      weightage_percent: 50,
      key_concepts: ["Distance Between Points"],
      examples: [
        "Find the distance between points (3,2) and (7,6).",
        "Show that points (1,2), (4,6), (7,10) are collinear."
      ]
    },
    "Section Formula": {
      weightage_percent: 30,
      key_concepts: ["Internal, External Division"],
      examples: [
        "Find coordinates of point dividing join of A(2,-2), B(3,7) in ratio 1:2.",
        "A line divides AB in the ratio 2:3 internally. Find the coordinates."
      ]
    },
    "Area of Triangle": {
      weightage_percent: 20,
      key_concepts: ["Area from Vertex Coordinates"],
      examples: [
        "Find area of triangle with vertices (2,3), (4,5), (6,7).",
        "For given three points, check if they form a triangle of zero area."
      ]
    }
  },

  "Real Numbers": {
    "Euclid’s Lemma": {
      weightage_percent: 40,
      key_concepts: ["Divisibility of Integers", "Proof questions"],
      examples: [
        "Use Euclid’s division algorithm to find HCF of 4052 and 12576.",
        "Prove every composite number has a prime factor less than or equal to its square root."
      ]
    },
    "Irrationality and Fundamental Theorem": {
      weightage_percent: 60,
      key_concepts: ["Irrational Numbers", "Terminating/Recurring Decimals"],
      examples: [
        "Prove that √3 is irrational.",
        "Show that 0.142857 is a rational number.",
        "Check if 7/8 has a terminating decimal expansion."
      ]
    }
  }
};
