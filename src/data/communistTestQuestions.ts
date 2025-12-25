export type TestDifficulty = 'easy' | 'medium' | 'hard' | 'trick'

export interface TestQuestion {
  id: string
  difficulty: TestDifficulty
  question: string
  answer: string
  acceptableAnswers?: string[] // Alternative correct answers (lowercased for comparison)
  reward: number // Rubles for correct answer
  penalty: number // Rubles penalty for wrong answer
  grantsRankUp?: boolean // Hard questions grant rank up if answered correctly
}

// EASY QUESTIONS (100₽ reward, no penalty for wrong answer)
const EASY_QUESTIONS: TestQuestion[] = [
  {
    id: 'easy-1',
    difficulty: 'easy',
    question: 'What does USSR stand for?',
    answer: 'Union of Soviet Socialist Republics',
    acceptableAnswers: ['union of soviet socialist republics', 'ussr', 'soviet union'],
    reward: 100,
    penalty: 0
  },
  {
    id: 'easy-2',
    difficulty: 'easy',
    question: 'Who wrote The Communist Manifesto?',
    answer: 'Karl Marx and Friedrich Engels',
    acceptableAnswers: ['karl marx and friedrich engels', 'marx and engels', 'karl marx', 'marx'],
    reward: 100,
    penalty: 0
  },
  {
    id: 'easy-3',
    difficulty: 'easy',
    question: 'What year did the Russian Revolution occur?',
    answer: '1917',
    acceptableAnswers: ['1917'],
    reward: 100,
    penalty: 0
  },
  {
    id: 'easy-4',
    difficulty: 'easy',
    question: 'What is the capital of the Soviet Union?',
    answer: 'Moscow',
    acceptableAnswers: ['moscow'],
    reward: 100,
    penalty: 0
  },
  {
    id: 'easy-5',
    difficulty: 'easy',
    question: 'What symbol appears on the Soviet flag alongside the hammer?',
    answer: 'Sickle',
    acceptableAnswers: ['sickle', 'the sickle'],
    reward: 100,
    penalty: 0
  },
  {
    id: 'easy-6',
    difficulty: 'easy',
    question: 'Who was the first leader of the Soviet Union?',
    answer: 'Vladimir Lenin',
    acceptableAnswers: ['vladimir lenin', 'lenin', 'v. lenin'],
    reward: 100,
    penalty: 0
  },
  {
    id: 'easy-7',
    difficulty: 'easy',
    question: 'What color is most associated with communism?',
    answer: 'Red',
    acceptableAnswers: ['red'],
    reward: 100,
    penalty: 0
  },
  {
    id: 'easy-8',
    difficulty: 'easy',
    question: 'What does "Pravda" mean in English?',
    answer: 'Truth',
    acceptableAnswers: ['truth'],
    reward: 100,
    penalty: 0
  },
  {
    id: 'easy-9',
    difficulty: 'easy',
    question: 'What is a "kolkhoz"?',
    answer: 'Collective farm',
    acceptableAnswers: ['collective farm', 'a collective farm', 'farm'],
    reward: 100,
    penalty: 0
  },
  {
    id: 'easy-10',
    difficulty: 'easy',
    question: 'What organization was the Soviet secret police?',
    answer: 'KGB, NKVD, or Cheka',
    acceptableAnswers: ['kgb', 'nkvd', 'cheka'],
    reward: 100,
    penalty: 0
  }
]

// MEDIUM QUESTIONS (200₽ reward, 100₽ penalty for wrong)
const MEDIUM_QUESTIONS: TestQuestion[] = [
  {
    id: 'medium-1',
    difficulty: 'medium',
    question: 'In what year did Stalin come to power?',
    answer: '1924',
    acceptableAnswers: ['1924'],
    reward: 200,
    penalty: 100
  },
  {
    id: 'medium-2',
    difficulty: 'medium',
    question: "What was the name of Stalin's policy of rapid industrialization?",
    answer: 'Five-Year Plans',
    acceptableAnswers: ['five-year plans', 'five year plans', 'five year plan', '5 year plans'],
    reward: 200,
    penalty: 100
  },
  {
    id: 'medium-3',
    difficulty: 'medium',
    question: 'What event from 1932-1933 killed millions of Ukrainians?',
    answer: 'Holodomor or Ukrainian Famine',
    acceptableAnswers: ['holodomor', 'ukrainian famine', 'the holodomor', 'famine'],
    reward: 200,
    penalty: 100
  },
  {
    id: 'medium-4',
    difficulty: 'medium',
    question: 'Who did Stalin have assassinated in Mexico in 1940?',
    answer: 'Leon Trotsky',
    acceptableAnswers: ['leon trotsky', 'trotsky'],
    reward: 200,
    penalty: 100
  },
  {
    id: 'medium-5',
    difficulty: 'medium',
    question: 'What was the name of the Soviet forced labour camp system?',
    answer: 'Gulag',
    acceptableAnswers: ['gulag', 'the gulag'],
    reward: 200,
    penalty: 100
  },
  {
    id: 'medium-6',
    difficulty: 'medium',
    question: 'What 1939 pact did the USSR sign with Nazi Germany?',
    answer: 'Molotov-Ribbentrop Pact',
    acceptableAnswers: ['molotov-ribbentrop pact', 'molotov ribbentrop pact', 'ribbentrop', 'nazi-soviet pact'],
    reward: 200,
    penalty: 100
  },
  {
    id: 'medium-7',
    difficulty: 'medium',
    question: 'What was "perestroika"?',
    answer: "Gorbachev's policy of restructuring/reform",
    acceptableAnswers: ['restructuring', 'reform', 'gorbachev policy', 'gorbachevs policy'],
    reward: 200,
    penalty: 100
  },
  {
    id: 'medium-8',
    difficulty: 'medium',
    question: 'Who led the Soviet Union during the Cuban Missile Crisis?',
    answer: 'Nikita Khrushchev',
    acceptableAnswers: ['nikita khrushchev', 'khrushchev', 'khruschev'],
    reward: 200,
    penalty: 100
  },
  {
    id: 'medium-9',
    difficulty: 'medium',
    question: 'What was the name of the first artificial satellite, launched by the USSR?',
    answer: 'Sputnik',
    acceptableAnswers: ['sputnik', 'sputnik 1'],
    reward: 200,
    penalty: 100
  },
  {
    id: 'medium-10',
    difficulty: 'medium',
    question: 'What did "glasnost" mean?',
    answer: 'Openness/transparency',
    acceptableAnswers: ['openness', 'transparency', 'openness and transparency'],
    reward: 200,
    penalty: 100
  }
]

// HARD QUESTIONS (400₽ reward, 200₽ penalty for wrong, +1 Party Rank for correct)
const HARD_QUESTIONS: TestQuestion[] = [
  {
    id: 'hard-1',
    difficulty: 'hard',
    question: "What was Stalin's birth name?",
    answer: 'Ioseb Jughashvili',
    acceptableAnswers: ['ioseb jughashvili', 'jughashvili', 'iosif dzhugashvili'],
    reward: 400,
    penalty: 200,
    grantsRankUp: true
  },
  {
    id: 'hard-2',
    difficulty: 'hard',
    question: 'Name the Soviet general who led the defence of Stalingrad.',
    answer: 'Vasily Chuikov or Georgy Zhukov',
    acceptableAnswers: ['vasily chuikov', 'chuikov', 'georgy zhukov', 'zhukov'],
    reward: 400,
    penalty: 200,
    grantsRankUp: true
  },
  {
    id: 'hard-3',
    difficulty: 'hard',
    question: 'What was the name of the 1956 speech in which Khrushchev denounced Stalin?',
    answer: 'The Secret Speech or "On the Cult of Personality"',
    acceptableAnswers: ['secret speech', 'the secret speech', 'on the cult of personality', 'cult of personality'],
    reward: 400,
    penalty: 200,
    grantsRankUp: true
  },
  {
    id: 'hard-4',
    difficulty: 'hard',
    question: 'In what year did the Soviet Union collapse?',
    answer: '1991',
    acceptableAnswers: ['1991'],
    reward: 400,
    penalty: 200,
    grantsRankUp: true
  },
  {
    id: 'hard-5',
    difficulty: 'hard',
    question: 'What was Operation Barbarossa?',
    answer: "Nazi Germany's invasion of the Soviet Union",
    acceptableAnswers: ['nazi invasion', 'german invasion', 'invasion of soviet union', 'invasion of russia', 'nazi germany invasion'],
    reward: 400,
    penalty: 200,
    grantsRankUp: true
  },
  {
    id: 'hard-6',
    difficulty: 'hard',
    question: 'Who was Lavrentiy Beria?',
    answer: 'Head of NKVD/secret police under Stalin',
    acceptableAnswers: ['head of nkvd', 'secret police', 'nkvd', 'chief of secret police'],
    reward: 400,
    penalty: 200,
    grantsRankUp: true
  },
  {
    id: 'hard-7',
    difficulty: 'hard',
    question: 'What did Article 58 of the Soviet Penal Code criminalize?',
    answer: 'Counter-revolutionary activities',
    acceptableAnswers: ['counter-revolutionary', 'counter revolutionary', 'counter-revolutionary activities', 'anything'],
    reward: 400,
    penalty: 200,
    grantsRankUp: true
  },
  {
    id: 'hard-8',
    difficulty: 'hard',
    question: 'Name one of the "Old Bolsheviks" executed during the Great Purge.',
    answer: 'Zinoviev, Kamenev, Bukharin, Rykov',
    acceptableAnswers: ['zinoviev', 'kamenev', 'bukharin', 'rykov'],
    reward: 400,
    penalty: 200,
    grantsRankUp: true
  },
  {
    id: 'hard-9',
    difficulty: 'hard',
    question: 'What was the Katyn Massacre?',
    answer: 'Soviet execution of Polish officers in 1940',
    acceptableAnswers: ['execution of polish officers', 'polish massacre', 'soviet execution', 'killing of poles'],
    reward: 400,
    penalty: 200,
    grantsRankUp: true
  },
  {
    id: 'hard-10',
    difficulty: 'hard',
    question: 'What was "socialist realism"?',
    answer: 'Official Soviet artistic doctrine glorifying communist values',
    acceptableAnswers: ['artistic doctrine', 'art doctrine', 'soviet art style', 'communist art'],
    reward: 400,
    penalty: 200,
    grantsRankUp: true
  }
]

// TRICK QUESTIONS (Stalin decides reward/penalty)
const TRICK_QUESTIONS: TestQuestion[] = [
  {
    id: 'trick-1',
    difficulty: 'trick',
    question: 'Was communism successful?',
    answer: 'Communism is always successful, Comrade Stalin.',
    acceptableAnswers: ['communism is always successful', 'yes comrade stalin', 'always successful'],
    reward: 0, // Stalin decides
    penalty: 0 // Stalin decides
  },
  {
    id: 'trick-2',
    difficulty: 'trick',
    question: 'Who is the greatest leader in history?',
    answer: 'Stalin',
    acceptableAnswers: ['stalin', 'comrade stalin', 'joseph stalin'],
    reward: 0, // Stalin decides
    penalty: 0 // Stalin decides
  },
  {
    id: 'trick-3',
    difficulty: 'trick',
    question: 'Do you have any complaints about the Party?',
    answer: 'No',
    acceptableAnswers: ['no', 'no comrade', 'never', 'none', 'no complaints'],
    reward: 0, // Stalin decides
    penalty: 0 // Stalin decides
  },
  {
    id: 'trick-4',
    difficulty: 'trick',
    question: 'Are you happy?',
    answer: 'Yes',
    acceptableAnswers: ['yes', 'yes comrade', 'always', 'very happy', 'of course'],
    reward: 0, // Stalin decides
    penalty: 0 // Stalin decides
  },
  {
    id: 'trick-5',
    difficulty: 'trick',
    question: 'Would you die for the Motherland?',
    answer: 'Without hesitation, Comrade.',
    acceptableAnswers: ['yes', 'without hesitation', 'of course', 'gladly', 'always'],
    reward: 0, // Stalin decides
    penalty: 0 // Stalin decides
  }
]

// Combined deck of all questions
export const ALL_COMMUNIST_TEST_QUESTIONS: TestQuestion[] = [
  ...EASY_QUESTIONS,
  ...MEDIUM_QUESTIONS,
  ...HARD_QUESTIONS,
  ...TRICK_QUESTIONS
]

// Export by difficulty for easy access
export const COMMUNIST_TEST_QUESTIONS_BY_DIFFICULTY = {
  easy: EASY_QUESTIONS,
  medium: MEDIUM_QUESTIONS,
  hard: HARD_QUESTIONS,
  trick: TRICK_QUESTIONS
}

// Get a random question by difficulty
export function getRandomQuestionByDifficulty (difficulty: TestDifficulty): TestQuestion {
  const questions = COMMUNIST_TEST_QUESTIONS_BY_DIFFICULTY[difficulty]
  const randomIndex = Math.floor(Math.random() * questions.length)
  return questions[randomIndex]
}

// Get a random difficulty (with weighted distribution)
export function getRandomDifficulty (): TestDifficulty {
  const rand = Math.random()
  if (rand < 0.4) return 'easy' // 40% easy
  if (rand < 0.75) return 'medium' // 35% medium
  if (rand < 0.95) return 'hard' // 20% hard
  return 'trick' // 5% trick
}

// Check if answer is correct (case-insensitive, trimmed)
export function isAnswerCorrect (question: TestQuestion, userAnswer: string): boolean {
  const normalized = userAnswer.toLowerCase().trim()
  if (question.acceptableAnswers == null) return false

  return question.acceptableAnswers.some((acceptable) =>
    normalized.includes(acceptable) || acceptable.includes(normalized)
  )
}
