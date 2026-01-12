// Grade to points mapping
export const GRADE_POINTS: Record<string, number> = {
  'A': 12,
  'A-': 11,
  'B+': 10,
  'B': 9,
  'B-': 8,
  'C+': 7,
  'C': 6,
  'C-': 5,
  'D+': 4,
  'D': 3,
  'D-': 2,
  'E': 1,
};

export const GRADES = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'E'];

export const COMPULSORY_SUBJECTS = ['Mathematics', 'English', 'Kiswahili'];

export const OPTIONAL_SUBJECTS = [
  'Biology',
  'Chemistry',
  'Physics',
  'Geography',
  'History',
  'CRE',
  'IRE',
  'HRE',
  'Home Science',
  'Agriculture',
  'Computer Studies',
  'Business Studies',
  'French',
  'German',
  'Arabic',
  'Music',
  'Art & Design',
  'Aviation Technology',
  'Electricity',
  'Metalwork',
  'Woodwork',
  'Building Construction',
  'Power Mechanics',
  'Drawing & Design',
];

export const INTEREST_QUESTIONS = [
  {
    id: 'numbers',
    question: 'Do you enjoy working with numbers and solving mathematical problems?',
    options: [
      { label: 'Yes, I love it!', score: 3, fields: ['Engineering', 'Business', 'Science'] },
      { label: 'Sometimes', score: 2, fields: ['Engineering', 'Business'] },
      { label: 'Not really', score: 1, fields: ['Arts', 'Humanities'] },
    ],
  },
  {
    id: 'practical',
    question: 'Do you prefer practical hands-on work or theoretical learning?',
    options: [
      { label: 'Practical work', score: 3, fields: ['Engineering', 'Health', 'Technical'] },
      { label: 'A mix of both', score: 2, fields: ['Science', 'Business'] },
      { label: 'Theoretical learning', score: 1, fields: ['Law', 'Humanities', 'Arts'] },
    ],
  },
  {
    id: 'people',
    question: 'Do you enjoy interacting with and helping people?',
    options: [
      { label: 'Yes, definitely!', score: 3, fields: ['Health', 'Education', 'Social Sciences'] },
      { label: 'Sometimes', score: 2, fields: ['Business', 'Law'] },
      { label: 'I prefer working alone', score: 1, fields: ['IT', 'Engineering', 'Science'] },
    ],
  },
  {
    id: 'creativity',
    question: 'How creative do you consider yourself?',
    options: [
      { label: 'Very creative', score: 3, fields: ['Arts', 'Media', 'Architecture'] },
      { label: 'Somewhat creative', score: 2, fields: ['Business', 'Engineering'] },
      { label: 'More logical than creative', score: 1, fields: ['Science', 'IT', 'Law'] },
    ],
  },
  {
    id: 'interest_area',
    question: 'Which area interests you the most?',
    options: [
      { label: 'Healthcare & Medicine', score: 3, fields: ['Health'] },
      { label: 'Technology & Computing', score: 3, fields: ['IT', 'Engineering'] },
      { label: 'Business & Finance', score: 3, fields: ['Business'] },
      { label: 'Arts & Humanities', score: 3, fields: ['Arts', 'Humanities'] },
    ],
  },
];

export const STEPS = [
  { id: 1, title: 'Welcome', description: 'Tell us about yourself' },
  { id: 2, title: 'KCSE Results', description: 'Enter your grades' },
  { id: 3, title: 'Interests', description: 'Career preferences' },
  { id: 4, title: 'Clusters', description: 'Eligibility summary' },
  { id: 5, title: 'Payment', description: 'Unlock results' },
  { id: 6, title: 'Results', description: 'Your matches' },
];