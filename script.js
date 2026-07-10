/* ==========================================================================
   Quizline — app logic
   ========================================================================== */

const QUESTIONS_PER_ROUND = 5;
const SECONDS_PER_QUESTION = 20;
const TIMER_CIRCUMFERENCE = 2 * Math.PI * 28; // matches r=28 in the SVG

/* ---------------------------------- Question bank ------------------------ */

const CATEGORIES = [
  {
    id: "python",
    name: "Python",
    icon: "🐍",
    desc: "Syntax, data types, and the quirks that trip everyone up once.",
    questions: [
      { q: "What is the output of `print(type([]))`?", options: ["<class 'tuple'>", "<class 'list'>", "<class 'dict'>", "<class 'set'>"], answer: "<class 'list'>" },
      { q: "Which keyword defines a function in Python?", options: ["func", "def", "function", "lambda"], answer: "def" },
      { q: "What does `len('hello')` return?", options: ["4", "5", "6", "Error"], answer: "5" },
      { q: "Which of these is immutable in Python?", options: ["list", "dict", "tuple", "set"], answer: "tuple" },
      { q: "What symbol starts a single-line comment?", options: ["//", "#", "--", "<!--"], answer: "#" },
      { q: "What does `3 // 2` evaluate to?", options: ["1.5", "1", "2", "0"], answer: "1" },
      { q: "Which method adds an item to the end of a list?", options: [".push()", ".add()", ".append()", ".insert()"], answer: ".append()" },
      { q: "What is the correct file extension for Python files?", options: [".py", ".python", ".pt", ".pyt"], answer: ".py" },
    ]
  },
  {
    id: "javascript",
    name: "JavaScript",
    icon: "⚡",
    desc: "The language of the browser — quirks, closures, and console logs.",
    questions: [
      { q: "Which keyword declares a block-scoped variable in JS?", options: ["var", "let", "def", "int"], answer: "let" },
      { q: "What does `typeof null` return?", options: ["'null'", "'undefined'", "'object'", "'number'"], answer: "'object'" },
      { q: "Which method converts a JSON string into an object?", options: ["JSON.parse()", "JSON.stringify()", "JSON.toObject()", "Object.fromJSON()"], answer: "JSON.parse()" },
      { q: "What does `===` check that `==` does not?", options: ["Nothing, they're identical", "Type as well as value", "Only value", "Only reference"], answer: "Type as well as value" },
      { q: "Which array method creates a new array with results of calling a function on every element?", options: [".forEach()", ".map()", ".filter()", ".reduce()"], answer: ".map()" },
      { q: "How do you write a single-line comment in JavaScript?", options: ["# comment", "<!-- comment -->", "// comment", "' comment"], answer: "// comment" },
      { q: "What does `NaN` stand for?", options: ["Not a Number", "Null and None", "Number and Null", "New Array Notation"], answer: "Not a Number" },
    ]
  },
  {
    id: "webdev",
    name: "Web Basics",
    icon: "🌐",
    desc: "HTML tags, CSS selectors, and the plumbing that holds pages together.",
    questions: [
      { q: "Which tag is used to link an external CSS file?", options: ["<style>", "<script>", "<link>", "<css>"], answer: "<link>" },
      { q: "What does CSS stand for?", options: ["Cascading Style Sheets", "Creative Style System", "Computer Styled Sections", "Colorful Style Syntax"], answer: "Cascading Style Sheets" },
      { q: "Which HTML tag is used for the largest heading?", options: ["<h6>", "<heading>", "<h1>", "<head>"], answer: "<h1>" },
      { q: "Which CSS property changes text color?", options: ["font-color", "text-color", "color", "foreground"], answer: "color" },
      { q: "What does the acronym HTTP stand for?", options: ["HyperText Transfer Protocol", "High Transfer Text Process", "HyperTransfer Text Protocol", "Host Terminal Transfer Protocol"], answer: "HyperText Transfer Protocol" },
      { q: "Which attribute specifies an alternate text for an image?", options: ["title", "alt", "src", "label"], answer: "alt" },
      { q: "Which CSS layout model arranges items in a single row or column with flexible sizing?", options: ["Grid", "Flexbox", "Float", "Table"], answer: "Flexbox" },
    ]
  },
  {
    id: "general",
    name: "General Knowledge",
    icon: "🧠",
    desc: "A mixed bag of trivia to warm up the rest of your brain too.",
    questions: [
      { q: "What is the capital of Japan?", options: ["Seoul", "Beijing", "Tokyo", "Bangkok"], answer: "Tokyo" },
      { q: "How many continents are there on Earth?", options: ["5", "6", "7", "8"], answer: "7" },
      { q: "What planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], answer: "Mars" },
      { q: "What is the chemical symbol for gold?", options: ["Go", "Gd", "Au", "Ag"], answer: "Au" },
      { q: "Who painted the Mona Lisa?", options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Claude Monet"], answer: "Leonardo da Vinci" },
      { q: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], answer: "Pacific" },
      { q: "How many players are on a standard soccer team on the field?", options: ["9", "10", "11", "12"], answer: "11" },
    ]
  },
];

/* ---------------------------------- State --------------------------------- */

let state = {
  categoryId: null,
  roundQuestions: [],   // array of {q, options(shuffled), answer}
  currentIndex: 0,
  userAnswers: [],       // parallel array, null = unanswered
  timeLeft: SECONDS_PER_QUESTION,
  timerHandle: null,
};

/* ---------------------------------- DOM refs ------------------------------ */

const el = {
  themeToggle: document.getElementById("theme-toggle"),
  themeLabel: document.getElementById("theme-toggle-label"),
  homeScreen: document.getElementById("home-screen"),
  quizScreen: document.getElementById("quiz-screen"),
  resultsScreen: document.getElementById("results-screen"),
  categoryGrid: document.getElementById("category-grid"),
  quizCategoryLabel: document.getElementById("quiz-category-label"),
  progressCurrent: document.getElementById("quiz-progress-current"),
  progressTotal: document.getElementById("quiz-progress-total"),
  progressDots: document.getElementById("progress-dots"),
  questionText: document.getElementById("question-text"),
  optionsList: document.getElementById("options-list"),
  prevBtn: document.getElementById("prev-btn"),
  nextBtn: document.getElementById("next-btn"),
  timerRing: document.getElementById("timer-ring"),
  timerValue: document.getElementById("timer-value"),
  timerFill: document.getElementById("timer-fill"),
  scoreValue: document.getElementById("score-value"),
  scoreTotal: document.getElementById("score-total"),
  scorePct: document.getElementById("score-pct"),
  scoreVerdict: document.getElementById("score-verdict"),
  reviewList: document.getElementById("review-list"),
  retakeBtn: document.getElementById("retake-btn"),
  homeBtn: document.getElementById("home-btn"),
};

el.timerFill.style.strokeDasharray = `${TIMER_CIRCUMFERENCE}`;

/* ---------------------------------- Utilities ------------------------------ */

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function setScreen(screen) {
  [el.homeScreen, el.quizScreen, el.resultsScreen].forEach(s => s.classList.add("hidden"));
  screen.classList.remove("hidden");
}

/* ---------------------------------- Theme ------------------------------ */

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const isDark = theme === "dark";
  el.themeToggle.setAttribute("aria-pressed", String(isDark));
  el.themeLabel.textContent = isDark ? "Dark" : "Light";
  localStorage.setItem("quizline-theme", theme);
}

el.themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  applyTheme(current === "dark" ? "light" : "dark");
});

(function initTheme() {
  const saved = localStorage.getItem("quizline-theme");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "dark" : "light"));
})();

/* ---------------------------------- Home / categories ------------------------------ */

function renderCategories() {
  el.categoryGrid.innerHTML = "";
  CATEGORIES.forEach(cat => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "category-card";

    const icon = document.createElement("span");
    icon.className = "category-icon";
    icon.textContent = cat.icon;

    const name = document.createElement("div");
    name.className = "category-name";
    name.textContent = cat.name;

    const desc = document.createElement("p");
    desc.className = "category-desc";
    desc.textContent = cat.desc;

    const meta = document.createElement("div");
    meta.className = "category-meta";
    const metaLeft = document.createElement("span");
    metaLeft.textContent = `${Math.min(QUESTIONS_PER_ROUND, cat.questions.length)} questions · ${SECONDS_PER_QUESTION}s each`;
    const metaGo = document.createElement("span");
    metaGo.className = "go";
    metaGo.textContent = "Start →";
    meta.append(metaLeft, metaGo);

    card.append(icon, name, desc, meta);
    card.addEventListener("click", () => startQuiz(cat.id));
    el.categoryGrid.appendChild(card);
  });
}

/* ---------------------------------- Quiz flow ------------------------------ */

function startQuiz(categoryId) {
  const category = CATEGORIES.find(c => c.id === categoryId);
  const count = Math.min(QUESTIONS_PER_ROUND, category.questions.length);
  const chosen = shuffle(category.questions).slice(0, count);

  state = {
    categoryId,
    roundQuestions: chosen.map(q => ({
      q: q.q,
      answer: q.answer,
      options: shuffle(q.options),
    })),
    currentIndex: 0,
    userAnswers: new Array(count).fill(null),
    timeLeft: SECONDS_PER_QUESTION,
    timerHandle: null,
  };

  el.quizCategoryLabel.textContent = category.name;
  el.progressTotal.textContent = String(count);
  buildProgressDots();
  setScreen(el.quizScreen);
  renderQuestion();
}

function buildProgressDots() {
  el.progressDots.innerHTML = "";
  state.roundQuestions.forEach((_, i) => {
    const dot = document.createElement("span");
    dot.className = "progress-dot";
    dot.dataset.index = i;
    el.progressDots.appendChild(dot);
  });
}

function updateProgressDots() {
  [...el.progressDots.children].forEach((dot, i) => {
    dot.classList.remove("done", "current");
    if (i === state.currentIndex) dot.classList.add("current");
    else if (state.userAnswers[i] !== null) dot.classList.add("done");
  });
}

function renderQuestion() {
  const idx = state.currentIndex;
  const current = state.roundQuestions[idx];
  const answered = state.userAnswers[idx] !== null;

  el.progressCurrent.textContent = String(idx + 1);
  el.questionText.textContent = current.q;
  el.optionsList.setAttribute("aria-label", current.q);
  updateProgressDots();

  el.optionsList.innerHTML = "";
  const letters = ["A", "B", "C", "D"];
  current.options.forEach((opt, i) => {
    const isSelected = state.userAnswers[idx] === opt;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option-btn";
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", String(isSelected));
    if (isSelected) btn.classList.add("selected");

    const letterSpan = document.createElement("span");
    letterSpan.className = "option-letter";
    letterSpan.textContent = letters[i];

    // Using textContent (not innerHTML) so answers containing characters
    // like < or > (e.g. "<class 'list'>", "<link>") render as plain text
    // instead of being parsed as HTML tags.
    const textSpan = document.createElement("span");
    textSpan.textContent = opt;

    btn.append(letterSpan, textSpan);
    btn.addEventListener("click", () => selectAnswer(opt));
    el.optionsList.appendChild(btn);
  });

  el.prevBtn.disabled = idx === 0;
  el.nextBtn.textContent = idx === state.roundQuestions.length - 1 ? "Submit quiz" : "Next →";

  if (answered) {
    freezeTimer();
  } else {
    resetTimer();
  }
}

function selectAnswer(option) {
  state.userAnswers[state.currentIndex] = option;
  renderQuestion();
}

el.prevBtn.addEventListener("click", () => {
  if (state.currentIndex > 0) {
    state.currentIndex--;
    renderQuestion();
  }
});

el.nextBtn.addEventListener("click", () => {
  goToNextOrSubmit();
});

function goToNextOrSubmit() {
  if (state.currentIndex < state.roundQuestions.length - 1) {
    state.currentIndex++;
    renderQuestion();
  } else {
    stopTimer();
    showResults();
  }
}

/* Keyboard support: 1-4 pick an option, Enter advances. Only active while
   the quiz screen is visible. */
document.addEventListener("keydown", (e) => {
  if (el.quizScreen.classList.contains("hidden")) return;
  const current = state.roundQuestions[state.currentIndex];
  if (!current) return;

  const keyNum = Number(e.key);
  if (Number.isInteger(keyNum) && keyNum >= 1 && keyNum <= current.options.length) {
    selectAnswer(current.options[keyNum - 1]);
  } else if (e.key === "Enter") {
    goToNextOrSubmit();
  }
});

/* ---------------------------------- Timer ------------------------------ */

function resetTimer() {
  stopTimer();
  state.timeLeft = SECONDS_PER_QUESTION;
  el.timerFill.classList.remove("done");
  el.timerRing.setAttribute("aria-label", "Time remaining");
  updateTimerDisplay();
  state.timerHandle = setInterval(() => {
    state.timeLeft--;
    updateTimerDisplay();
    if (state.timeLeft <= 0) {
      stopTimer();
      goToNextOrSubmit();
    }
  }, 1000);
}

// Once a question has been answered, freeze its timer instead of letting
// it keep counting down — revisiting an answered question (via Previous)
// should not silently force you forward again when it hits zero.
function freezeTimer() {
  stopTimer();
  el.timerValue.textContent = "✓";
  el.timerFill.style.strokeDashoffset = "0";
  el.timerFill.classList.remove("low");
  el.timerFill.classList.add("done");
  el.timerRing.setAttribute("aria-label", "Question answered");
}

function stopTimer() {
  if (state.timerHandle) {
    clearInterval(state.timerHandle);
    state.timerHandle = null;
  }
}

function updateTimerDisplay() {
  el.timerValue.textContent = String(Math.max(state.timeLeft, 0));
  const fraction = Math.max(state.timeLeft, 0) / SECONDS_PER_QUESTION;
  const offset = TIMER_CIRCUMFERENCE * (1 - fraction);
  el.timerFill.style.strokeDashoffset = String(offset);
  el.timerFill.classList.toggle("low", state.timeLeft <= 5);
}

/* ---------------------------------- Results ------------------------------ */

function buildReviewRow(tagText, answerText, rowClass) {
  const row = document.createElement("div");
  row.className = `review-row ${rowClass}`;

  const tag = document.createElement("span");
  tag.className = "tag";
  tag.textContent = tagText;

  const answer = document.createElement("span");
  answer.className = "answer-text";
  answer.textContent = answerText;

  row.append(tag, answer);
  return row;
}

function buildReviewItem(question, index, userAnswer, isCorrect) {
  const item = document.createElement("div");
  item.className = "review-item";

  const qLine = document.createElement("p");
  qLine.className = "review-q";
  qLine.textContent = `${index + 1}. ${question.q}`;

  const badgeClass = userAnswer === null ? "skipped" : (isCorrect ? "correct" : "incorrect");
  const badgeText = userAnswer === null ? "Skipped" : (isCorrect ? "Correct" : "Incorrect");
  const badge = document.createElement("span");
  badge.className = `review-badge ${badgeClass}`;
  badge.textContent = badgeText;
  qLine.appendChild(badge);
  item.appendChild(qLine);

  item.appendChild(
    buildReviewRow("Your pick", userAnswer ?? "— no answer —", isCorrect ? "correct" : "incorrect")
  );

  if (!isCorrect) {
    item.appendChild(buildReviewRow("Correct", question.answer, "correct"));
  }

  return item;
}

function showResults() {
  const total = state.roundQuestions.length;
  let score = 0;

  el.reviewList.innerHTML = "";

  state.roundQuestions.forEach((question, i) => {
    const userAnswer = state.userAnswers[i];
    const isCorrect = userAnswer === question.answer;
    if (isCorrect) score++;

    el.reviewList.appendChild(buildReviewItem(question, i, userAnswer, isCorrect));
  });

  const pct = Math.round((score / total) * 100);
  el.scoreValue.textContent = String(score);
  el.scoreTotal.textContent = String(total);
  el.scorePct.textContent = `${pct}%`;
  el.scoreVerdict.textContent = verdictFor(pct);

  setScreen(el.resultsScreen);
}

function verdictFor(pct) {
  if (pct === 100) return "Perfect score — nothing gets past you.";
  if (pct >= 80) return "Excellent work — you clearly know this deck well.";
  if (pct >= 60) return "Solid effort — a bit more practice and you've got it.";
  if (pct >= 40) return "Fair attempt — review the misses below and try again.";
  return "Rough round — worth another pass once you've reviewed the answers.";
}

el.retakeBtn.addEventListener("click", () => startQuiz(state.categoryId));
el.homeBtn.addEventListener("click", () => {
  stopTimer();
  setScreen(el.homeScreen);
});

/* ---------------------------------- Init ------------------------------ */

renderCategories();
setScreen(el.homeScreen);