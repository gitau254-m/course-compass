// Grade to points mapping
export const GRADE_POINTS: Record<string, number> = {
  'A': 12, 'A-': 11, 'B+': 10, 'B': 9, 'B-': 8,
  'C+': 7, 'C': 6, 'C-': 5, 'D+': 4, 'D': 3, 'D-': 2, 'E': 1,
};

export const GRADES = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'E'];

export const COMPULSORY_SUBJECTS = ['Mathematics', 'English', 'Kiswahili'];

export const OPTIONAL_SUBJECTS = [
  'Biology', 'Chemistry', 'Physics',
  'Geography', 'History', 'CRE', 'IRE', 'HRE',
  'Home Science', 'Agriculture',
  'Computer Studies', 'Business Studies',
  'French', 'German', 'Arabic',
  'Music', 'Art & Design',
  'Aviation Technology', 'Electricity', 'Metalwork',
  'Woodwork', 'Building Construction', 'Power Mechanics', 'Drawing & Design',
];

/**
 * INTEREST QUESTIONS
 *
 * Each option has a `fieldScores` map: { fieldName: scoreAdjustment }
 * Positive values BOOST that field in course ranking.
 * Negative values PENALISE that field (courses still shown, ranked lower).
 *
 * Fields must match the `field` column in the courses table.
 */
export const INTEREST_QUESTIONS = [
  {
    id: 'tech_affinity',
    question: 'How do you feel about technology, computers, and coding?',
    helpText: "Honest answers help us rank courses you'll actually enjoy.",
    options: [
      {
        label: 'I love it – I could spend hours on a computer',
        icon: '💻',
        fieldScores: {
          'Computer Science': 30, 'Information Technology': 30, 'Data Science': 25,
          'Computer Technology': 25, 'Business IT': 20, 'Mathematics & Computing': 20,
          'Computer Engineering': 20, 'Electrical Engineering': 15,
        },
      },
      {
        label: "It's a useful tool but not my passion",
        icon: '🔧',
        fieldScores: {
          'Computer Science': 5, 'Information Technology': 5,
          'Business IT': 10, 'Engineering': 10,
        },
      },
      {
        label: 'I prefer working with people or in nature',
        icon: '🌿',
        fieldScores: {
          'Computer Science': -20, 'Information Technology': -20, 'Data Science': -15,
          'Health': 15, 'Agriculture': 15, 'Education Arts': 10, 'Social Work': 10,
        },
      },
      {
        label: 'Computers make me uncomfortable',
        icon: '😟',
        fieldScores: {
          'Computer Science': -30, 'Information Technology': -30, 'Data Science': -25,
          'Computer Technology': -25, 'Business IT': -15,
          'Arts': 15, 'Agriculture': 10, 'Education Arts': 10,
        },
      },
    ],
  },

  {
    id: 'helping_people',
    question: 'How strongly do you want to directly help people (patients, students, community)?',
    helpText: null,
    options: [
      {
        label: "Very strongly – that's my main motivation",
        icon: '❤️',
        fieldScores: {
          'Medicine & Surgery': 30, 'Nursing': 30, 'Pharmacy': 25,
          'Clinical Medicine': 25, 'Medical Laboratory Sciences': 20,
          'Physiotherapy': 20, 'Dental Surgery': 20,
          'Education Arts': 20, 'Education Science': 20,
          'Social Work': 20, 'Counseling': 15, 'Public Health': 20,
          'Veterinary Medicine': 15, 'Community Health': 15,
        },
      },
      {
        label: "Somewhat – I'd like to make an impact but indirectly",
        icon: '🤝',
        fieldScores: {
          'Medicine & Surgery': 10, 'Nursing': 10,
          'Business': 10, 'Public Administration': 10, 'Law': 10,
          'Agriculture': 10, 'Environmental Science': 10,
        },
      },
      {
        label: "I'd rather focus on technical or analytical work",
        icon: '📐',
        fieldScores: {
          'Medicine & Surgery': -10, 'Nursing': -15, 'Education Arts': -10,
          'Engineering': 15, 'Computer Science': 15,
          'Actuarial Science': 15, 'Mathematics': 15, 'Finance': 15,
        },
      },
    ],
  },

  {
    id: 'environment',
    question: 'What working environment appeals to you most?',
    helpText: null,
    options: [
      {
        label: 'Hospital / clinic / lab',
        icon: '🏥',
        fieldScores: {
          'Medicine & Surgery': 30, 'Nursing': 30, 'Pharmacy': 30,
          'Medical Laboratory Sciences': 25, 'Physiotherapy': 25,
          'Dental Surgery': 25, 'Clinical Medicine': 25, 'Radiography': 25,
          'Biomedical Engineering': 20, 'Veterinary Medicine': 15,
        },
      },
      {
        label: 'Office / corporate / boardroom',
        icon: '🏢',
        fieldScores: {
          'Commerce': 25, 'Finance': 25, 'Actuarial Science': 25,
          'Law': 25, 'Human Resource Management': 20,
          'Economics': 20, 'Business': 20, 'Banking & Finance': 20,
          'Economics & Statistics': 20, 'Public Administration': 15,
        },
      },
      {
        label: 'Outdoors / field work / nature',
        icon: '🌱',
        fieldScores: {
          'Agriculture': 30, 'Agribusiness': 25, 'Environmental Science': 25,
          'Geology': 25, 'GIS': 25, 'Geomatic Engineering': 20,
          'Meteorology': 20, 'Geophysics': 20,
          'Animal Science': 25, 'Veterinary Medicine': 20,
          'Landscape Architecture': 15,
        },
      },
      {
        label: 'Classroom / lecture hall / campus',
        icon: '📚',
        fieldScores: {
          'Education Arts': 30, 'Education Science': 30,
          'Early Childhood Education': 25, 'Special Education': 25,
          'Home Economics Education': 20, 'Physical Education': 20,
          'Arts': 15, 'Humanities': 15,
        },
      },
      {
        label: 'Construction site / workshop / factory',
        icon: '🏗️',
        fieldScores: {
          'Civil Engineering': 30, 'Mechanical Engineering': 30,
          'Architecture': 25, 'Construction Management': 25,
          'Quantity Surveying': 25, 'Electrical Engineering': 20,
          'Aerospace Engineering': 20, 'Marine Engineering': 20,
        },
      },
    ],
  },

  {
    id: 'subjects_enjoyed',
    question: 'Which KCSE subject type did you genuinely enjoy most?',
    helpText: 'Think about the subject you looked forward to in class.',
    options: [
      {
        label: 'Sciences (Physics, Chemistry, Biology)',
        icon: '⚗️',
        fieldScores: {
          'Medicine & Surgery': 20, 'Pharmacy': 20, 'Engineering': 20,
          'Biochemistry': 20, 'Microbiology': 20, 'Biotechnology': 15,
          'Industrial Chemistry': 15, 'Analytical Chemistry': 15,
          'Environmental Science': 15, 'Biological Sciences': 15,
        },
      },
      {
        label: 'Mathematics / Business Studies',
        icon: '🔢',
        fieldScores: {
          'Actuarial Science': 25, 'Mathematics': 25, 'Statistics': 25,
          'Finance': 20, 'Banking & Finance': 20, 'Economics': 20,
          'Financial Engineering': 20, 'Data Science': 15,
          'Commerce': 15, 'Economics & Statistics': 15,
        },
      },
      {
        label: 'Languages / History / CRE',
        icon: '📖',
        fieldScores: {
          'Law': 25, 'Arts': 20, 'Journalism': 20, 'Mass Communication': 20,
          'Media Studies': 20, 'Psychology': 15, 'Humanities': 20,
          'International Relations': 15, 'Anthropology': 15,
          'Education Arts': 15, 'Religious Studies': 15,
        },
      },
      {
        label: 'Technical / Practical subjects (Art, Music, Agriculture)',
        icon: '🎨',
        fieldScores: {
          'Architecture': 20, 'Interior Design': 20, 'Landscape Architecture': 20,
          'Fashion & Textile': 20, 'Fine Arts': 20, 'Music Performance': 25,
          'Music Technology': 25, 'Music Education': 20,
          'Agriculture': 20, 'Agribusiness': 15,
        },
      },
    ],
  },

  {
    id: 'career_dream',
    question: "What's your dream career outcome after university?",
    helpText: null,
    options: [
      {
        label: 'Become a doctor, nurse, or medical specialist',
        icon: '👩‍⚕️',
        fieldScores: {
          'Medicine & Surgery': 35, 'Nursing': 35, 'Pharmacy': 30,
          'Clinical Medicine': 30, 'Dental Surgery': 30, 'Radiography': 25,
          'Medical Laboratory Sciences': 25, 'Physiotherapy': 25,
          'Biomedical Engineering': 20, 'Veterinary Medicine': 20, 'Public Health': 20,
        },
      },
      {
        label: 'Build software, apps, or tech systems',
        icon: '👨‍💻',
        fieldScores: {
          'Computer Science': 35, 'Information Technology': 30, 'Data Science': 30,
          'Computer Technology': 25, 'Business IT': 25,
          'Mathematics & Computing': 25, 'Computer Engineering': 25,
          'Electrical Engineering': 15,
          'Medicine & Surgery': -10, 'Nursing': -15, 'Agriculture': -10,
        },
      },
      {
        label: 'Run my own business or work in finance',
        icon: '💼',
        fieldScores: {
          'Commerce': 30, 'Finance': 30, 'Banking & Finance': 30,
          'Actuarial Science': 25, 'Economics': 25, 'Human Resource Management': 20,
          'Entrepreneurship': 30, 'Supply Chain Management': 20,
          'Procurement': 15, 'Economics & Statistics': 20,
          'Strategic Management': 20, 'Project Management': 20,
        },
      },
      {
        label: 'Work as an engineer or architect',
        icon: '🏛️',
        fieldScores: {
          'Civil Engineering': 30, 'Mechanical Engineering': 30,
          'Electrical Engineering': 30, 'Architecture': 30,
          'Quantity Surveying': 25, 'Construction Management': 25,
          'Aerospace Engineering': 25, 'Mechatronics Engineering': 25,
          'Petroleum Engineering': 20, 'Marine Engineering': 20,
          'Biosystems Engineering': 15, 'Agricultural Engineering': 15,
        },
      },
      {
        label: 'Teach, counsel, or work in government',
        icon: '🎓',
        fieldScores: {
          'Education Arts': 30, 'Education Science': 30,
          'Special Education': 25, 'Early Childhood Education': 25,
          'Law': 25, 'Public Administration': 25, 'Social Work': 20,
          'International Relations': 20, 'Development Studies': 20,
          'Counseling': 20, 'Religious Studies': 15,
        },
      },
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