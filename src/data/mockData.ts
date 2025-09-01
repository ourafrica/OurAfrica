import { Module } from '../types';

// Sample module for demonstration purposes
export const sampleModule: Module = {
  id: 1,
  title: 'Introduction to Computer Science',
  description: 'A foundational course that introduces the basic principles of computer science, programming concepts, and computational thinking.',
  author: 'Computer Science Department',
  difficulty_level: 'Beginner',
  tags: ['programming', 'algorithms', 'computer-science', 'software-engineering'],
  estimated_duration: 180,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  content: {
    lessons: [
      {
        id: 'lesson-1',
        title: 'What is Computer Science?',
        order: 1,
        content: [
          {
            type: 'text',
            content: 'Computer Science is the study of computers and computational systems. Unlike electrical and computer engineers, computer scientists deal mostly with software and software systems; this includes their theory, design, development, and application. Principal areas of study within Computer Science include artificial intelligence, computer systems and networks, security, database systems, human computer interaction, vision and graphics, numerical analysis, programming languages, software engineering, bioinformatics, and theory of computing.'
          },
          {
            type: 'image',
            src: 'https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            alt: 'Computer code on screen'
          },
          {
            type: 'text',
            content: 'Although knowing how to program is essential to the study of computer science, it is only one element of the field. Computer scientists design and analyze algorithms to solve programs and study the performance of computer hardware and software. The problems that computer scientists encounter range from the abstract (determining what problems can be solved with computers and the complexity of the algorithms that solve them) to the tangible (designing applications that perform well on handheld devices, that are easy to use, and that uphold security measures).'
          }
        ]
      },
      {
        id: 'lesson-2',
        title: 'Introduction to Programming',
        order: 2,
        content: [
          {
            type: 'text',
            content: 'Programming is the process of creating a set of instructions that tell a computer how to perform a task. Programming can be done using a variety of computer programming languages, such as JavaScript, Python, and C++.'
          },
          {
            type: 'code',
            language: 'python',
            content: '# This is a simple Python program\nprint(\'Hello, World!\')\n\n# Variables\nname = \'Student\'\nage = 20\n\n# Conditional statement\nif age >= 18:\n    print(f\'{name} is an adult.\')\nelse:\n    print(f\'{name} is a minor.\')'
          },
          {
            type: 'text',
            content: 'When learning to program, it\'s important to understand fundamental concepts like variables, data types, control structures, and functions. These building blocks are common across most programming languages, though the syntax may differ.'
          },
          {
            type: 'video',
            src: 'https://www.youtube.com/embed/zOjov-2OZ0E',
            title: 'Introduction to Programming'
          }
        ]
      },
      {
        id: 'lesson-3',
        title: 'Algorithms and Data Structures',
        order: 3,
        content: [
          {
            type: 'text',
            content: 'Algorithms are step-by-step procedures for solving problems, while data structures are ways of organizing and storing data. Together, they form the cornerstone of computer science and efficient problem-solving.'
          },
          {
            type: 'image',
            src: 'https://images.pexels.com/photos/1181298/pexels-photo-1181298.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            alt: 'Data visualization concept'
          },
          {
            type: 'text',
            content: 'Common data structures include arrays, linked lists, stacks, queues, trees, and graphs. Each has its own strengths and weaknesses, making them suitable for different types of problems. For example, arrays provide fast access to elements by index but can be slow for insertions and deletions, while linked lists excel at insertions and deletions but have slower access times.'
          },
          {
            type: 'code',
            language: 'javascript',
            content: '// Implementation of a simple stack in JavaScript\nclass Stack {\n  constructor() {\n    this.items = [];\n  }\n  \n  push(element) {\n    this.items.push(element);\n  }\n  \n  pop() {\n    if (this.items.length === 0) return \\"Underflow\\";\n    return this.items.pop();\n  }\n  \n  peek() {\n    return this.items[this.items.length - 1];\n  }\n  \n  isEmpty() {\n    return this.items.length === 0;\n  }\n}\n\n// Usage\nconst stack = new Stack();\nstack.push(10);\nstack.push(20);\nconsole.log(stack.peek()); // 20\nconsole.log(stack.pop());  // 20\nconsole.log(stack.isEmpty()); // false'
          }
        ]
      },
      {
        id: 'lesson-4',
        title: 'Computer Architecture',
        order: 4,
        content: [
          {
            type: 'text',
            content: 'Computer Architecture is the conceptual design and fundamental operational structure of a computer system. It focuses on the way computer components are organized and integrated.'
          },
          {
            type: 'text',
            content: 'The main components of a computer system include:\n\n1. Central Processing Unit (CPU) - The brain of the computer that performs calculations and executes instructions\n2. Memory (RAM) - Temporary storage for data and programs currently in use\n3. Storage (HDD/SSD) - Permanent storage for data and programs\n4. Input/Output Devices - Allow interaction between the computer and the outside world\n5. Motherboard - Connects all components together'
          },
          {
            type: 'image',
            src: 'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            alt: 'Computer motherboard'
          },
          {
            type: 'text',
            content: 'Modern computers use the Von Neumann architecture, which stores both program instructions and data in the same memory. This design allows for flexibility but can create a bottleneck between the CPU and memory, known as the Von Neumann bottleneck.'
          }
        ]
      },
      {
        id: 'lesson-5',
        title: 'Software Development Life Cycle',
        order: 5,
        content: [
          {
            type: 'text',
            content: 'The Software Development Life Cycle (SDLC) is a process used by the software industry to design, develop, and test high-quality software. It consists of several phases that help organize the development process.'
          },
          {
            type: 'image',
            src: 'https://images.pexels.com/photos/7376/startup-photos.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            alt: 'Software development team'
          },
          {
            type: 'text',
            content: 'The main phases of SDLC include:\n\n1. Planning - Define the scope and purpose of the application\n2. Analysis - Gather and document requirements\n3. Design - Outline the software architecture\n4. Implementation - Write the actual code\n5. Testing - Verify the software works as expected\n6. Deployment - Release the software to users\n7. Maintenance - Fix bugs and add new features as needed'
          },
          {
            type: 'text',
            content: 'Different SDLC models organize these phases in different ways. Common models include:\n\n- Waterfall: A linear, sequential approach where each phase must be completed before the next begins\n- Agile: An iterative approach that emphasizes flexibility, customer satisfaction, and rapid delivery\n- DevOps: Combines software development and IT operations to shorten the development lifecycle\n- Spiral: Combines elements of waterfall and iterative development with a focus on risk assessment'
          }
        ]
      }
    ],
    quizzes: [
      {
        id: 'quiz-1',
        title: 'Mid-Module Quiz',
        description: 'Test your understanding of the first three lessons',
        afterLessonId: 'lesson-3',
        passingScore: 70,
        questions: [
          {
            id: 'q1-1',
            question: 'What is Computer Science primarily concerned with?',
            options: [
              'Hardware manufacturing',
              'Software and computational systems',
              'Electrical circuits',
              'Internet infrastructure'
            ],
            correctAnswer: 1
          },
          {
            id: 'q1-2',
            question: 'Which of the following is NOT a programming language?',
            options: [
              'Python',
              'JavaScript',
              'HTML',
              'Algorithm'
            ],
            correctAnswer: 3
          },
          {
            id: 'q1-3',
            question: 'What does the following Python code output? print(10 > 5 and 7 < 3)',
            options: [
              'True',
              'False',
              'Error',
              'None'
            ],
            correctAnswer: 1
          },
          {
            id: 'q1-4',
            question: 'Which data structure operates on a Last-In-First-Out (LIFO) principle?',
            options: [
              'Queue',
              'Stack',
              'Linked List',
              'Array'
            ],
            correctAnswer: 1
          },
          {
            id: 'q1-5',
            question: 'What is an algorithm?',
            options: [
              'A programming language',
              'A computer hardware component',
              'A step-by-step procedure for solving a problem',
              'A type of computer virus'
            ],
            correctAnswer: 2
          }
        ]
      },
      {
        id: 'quiz-2',
        title: 'Final Module Quiz',
        description: 'Test your understanding of the entire module',
        afterLessonId: 'lesson-5',
        passingScore: 70,
        questions: [
          {
            id: 'q2-1',
            question: 'Which component of a computer is considered its \'brain\'?',
            options: [
              'RAM',
              'Hard Drive',
              'CPU',
              'Motherboard'
            ],
            correctAnswer: 2
          },
          {
            id: 'q2-2',
            question: 'What is the Von Neumann architecture known for?',
            options: [
              'Storing program instructions and data in separate memories',
              'Storing program instructions and data in the same memory',
              'Using multiple CPUs for parallel processing',
              'Being immune to security vulnerabilities'
            ],
            correctAnswer: 1
          },
          {
            id: 'q2-3',
            question: 'Which of the following is NOT a phase in the Software Development Life Cycle?',
            options: [
              'Planning',
              'Marketing',
              'Testing',
              'Maintenance'
            ],
            correctAnswer: 1
          },
          {
            id: 'q2-4',
            question: 'In the context of algorithms, what does O(n) represent?',
            options: [
              'The best-case scenario',
              'The worst-case scenario',
              'Time complexity that grows linearly with input size',
              'Space complexity that grows exponentially with input size'
            ],
            correctAnswer: 2
          },
          {
            id: 'q2-5',
            question: 'Which SDLC model emphasizes flexibility and customer satisfaction?',
            options: [
              'Waterfall',
              'Agile',
              'V-Model',
              'Big Bang'
            ],
            correctAnswer: 1
          },
          {
            id: 'q2-6',
            question: 'What is the primary purpose of a data structure?',
            options: [
              'To make code look more professional',
              'To organize and store data efficiently',
              'To secure data from unauthorized access',
              'To compress data to save storage space'
            ],
            correctAnswer: 1
          },
          {
            id: 'q2-7',
            question: 'Which of the following best describes a linked list?',
            options: [
              'A collection of elements with a fixed size',
              'A hierarchical structure with parent-child relationships',
              'A collection of elements where each element points to the next',
              'A collection organized by key-value pairs'
            ],
            correctAnswer: 2
          }
        ]
      }
    ],
    estimatedTime: 180
  },
  version: '1.0.0'
};