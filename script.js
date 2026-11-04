const STORAGE_KEY = "qualificationStudyApp_v1";

const defaultState = {
  exam: {
    name: "",
    date: "",
    targetScore: 80
  },
  tasks: [
    {
      id: crypto.randomUUID(),
      title: "過去問 20問",
      priority: "高",
      deadline: getDateOffset(3)
    },
    {
      id: crypto.randomUUID(),
      title: "法令の復習",
      priority: "中",
      deadline: getDateOffset(7)
    }
  ],
  studyLogs: [
    {
      id: crypto.randomUUID(),
      date: getToday(),
      minutes: 30,
      subject: "基礎理論",
      note: "ITの基礎を復習"
    },
    {
      id: crypto.randomUUID(),
      date: getDateOffset(-1),
      minutes: 45,
      subject: "IT技術",
      note: "ネットワークを学習"
    }
  ],
  mistakes: [
    {
      id: crypto.randomUUID(),
      subject: "法令",
      text: "データ保護の用語を混同した",
      createdAt: getToday()
    }
  ]
};

const state = loadState();

const examForm = document.getElementById("examForm");
const studyForm = document.getElementById("studyForm");
const taskForm = document.getElementById("taskForm");
const mistakeForm = document.getElementById("mistakeForm");
const resetDataBtn = document.getElementById("resetDataBtn");

const examNameInput = document.getElementById("examName");
const examDateInput = document.getElementById("examDate");
const targetScoreInput = document.getElementById("targetScore");

const taskList = document.getElementById("taskList");
const mistakeList = document.getElementById("mistakeList");

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateOffset(offsetDays) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return structuredClone(defaultState);
  }

  try {
    const parsed = JSON.parse(saved);
    return {
      ...structuredClone(defaultState),
      ...parsed,
      exam: { ...structuredClone(defaultState.exam), ...(parsed.exam || {}) },
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : structuredClone(defaultState.tasks),
      studyLogs: Array.isArray(parsed.studyLogs) ? parsed.studyLogs : structuredClone(defaultState.studyLogs),
      mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes : structuredClone(defaultState.mistakes)
    };
  } catch (error) {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function renderExam() {
  examNameInput.value = state.exam.name || "";
  examDateInput.value = state.exam.date || "";
  targetScoreInput.value = state.exam.targetScore || 80;
}

function renderTasks() {
  taskList.innerHTML = "";

  if (!state.tasks.length) {
    taskList.innerHTML = "<li class='task-item'><div class='task-main'><span class='task-title'>学習計画はまだありません</span></div></li>";
    return;
  }

  state.tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item";

    const taskMain = document.createElement("div");
    taskMain.className = "task-main";

    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;

    const meta = document.createElement("span");
    meta.className = "task-meta";
    meta.textContent = `期限: ${task.deadline || "未設定"}`;

    taskMain.appendChild(title);
    taskMain.appendChild(meta);

    const badge = document.createElement("span");
    badge.className = `badge ${task.priority.toLowerCase()}`;
    badge.textContent = task.priority;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "削除";
    deleteBtn.addEventListener("click", () => {
      state.tasks = state.tasks.filter((item) => item.id !== task.id);
      saveState();
      renderTasks();
      renderStats();
    });

    li.appendChild(taskMain);
    li.appendChild(badge);
    li.appendChild(deleteBtn);
    taskList.appendChild(li);
  });
}

function renderMistakes() {
  mistakeList.innerHTML = "";

  if (!state.mistakes.length) {
    mistakeList.innerHTML = "<li class='mistake-item'><div class='mistake-main'><span class='mistake-text'>間違いノートはまだありません</span></div></li>";
    return;
  }

  state.mistakes.forEach((mistake) => {
    const li = document.createElement("li");
    li.className = "mistake-item";

    const main = document.createElement("div");
    main.className = "mistake-main";

    const text = document.createElement("span");
    text.className = "mistake-text";
    text.textContent = mistake.text;

    const meta = document.createElement("span");
    meta.className = "mistake-meta";
    meta.textContent = `${mistake.subject} · ${mistake.createdAt}`;

    main.appendChild(text);
    main.appendChild(meta);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "削除";
    deleteBtn.addEventListener("click", () => {
      state.mistakes = state.mistakes.filter((item) => item.id !== mistake.id);
      saveState();
      renderMistakes();
      renderStats();
    });

    li.appendChild(main);
    li.appendChild(deleteBtn);
    mistakeList.appendChild(li);
  });
}

function renderStats() {
  const totalMinutes = state.studyLogs.reduce((sum, log) => sum + Number(log.minutes || 0), 0);
  document.getElementById("totalMinutes").textContent = `${totalMinutes} 分`;

  const studyDates = [...new Set(state.studyLogs.map((log) => log.date))];
  const streak = studyDates.length;
  document.getElementById("streak").textContent = `${streak} 日`;

  const subjectMap = {};
  state.studyLogs.forEach((log) => {
    subjectMap[log.subject] = (subjectMap[log.subject] || 0) + Number(log.minutes || 0);
  });

  let weakArea = "-";
  const weakAreaEntries = Object.entries(subjectMap);
  if (weakAreaEntries.length) {
    weakArea = weakAreaEntries.sort((a, b) => a[1] - b[1])[0][0];
  }
  document.getElementById("weakArea").textContent = weakArea;

  const today = getToday();
  const todayMinutes = state.studyLogs
    .filter((log) => log.date === today)
    .reduce((sum, log) => sum + Number(log.minutes || 0), 0);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    weekDates.push(d.toISOString().slice(0, 10));
  }

  const weeklyMinutes = state.studyLogs
    .filter((log) => weekDates.includes(log.date))
    .reduce((sum, log) => sum + Number(log.minutes || 0), 0);

  document.getElementById("todayMinutes").textContent = `${todayMinutes} 分`;
  document.getElementById("weeklyMinutes").textContent = `${weeklyMinutes} 分`;
  document.getElementById("reviewCount").textContent = `${state.mistakes.length} 件`;

  const progress = Math.min(100, Math.round((weeklyMinutes / 240) * 100));
  const progressBar = document.getElementById("progressBar");
  const weeklyProgressText = document.getElementById("weeklyProgressText");
  progressBar.style.width = `${progress}%`;
  weeklyProgressText.textContent = `${progress}%`;
}

examForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.exam = {
    name: examNameInput.value.trim(),
    date: examDateInput.value,
    targetScore: Number(targetScoreInput.value) || 80
  };
  saveState();
  renderExam();
});

studyForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const date = document.getElementById("studyDate").value || getToday();
  const minutes = Number(document.getElementById("studyMinutes").value) || 0;
  const subject = document.getElementById("studySubject").value;
  const note = document.getElementById("studyNote").value.trim();

  if (!minutes) {
    alert("学習時間を入力してください");
    return;
  }

  state.studyLogs.unshift({
    id: crypto.randomUUID(),
    date,
    minutes,
    subject,
    note: note || "学習記録"
  });

  saveState();
  renderStats();
  studyForm.reset();
  document.getElementById("studyDate").value = getToday();
});

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = document.getElementById("taskTitle").value.trim();
  const priority = document.getElementById("taskPriority").value;
  const deadline = document.getElementById("taskDeadline").value;

  if (!title) {
    alert("やることを入力してください");
    return;
  }

  state.tasks.unshift({
    id: crypto.randomUUID(),
    title,
    priority,
    deadline
  });

  saveState();
  renderTasks();
  taskForm.reset();
});

mistakeForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const subject = document.getElementById("mistakeSubject").value;
  const text = document.getElementById("mistakeText").value.trim();

  if (!text) {
    alert("間違えた内容を入力してください");
    return;
  }

  state.mistakes.unshift({
    id: crypto.randomUUID(),
    subject,
    text,
    createdAt: getToday()
  });

  saveState();
  renderMistakes();
  renderStats();
  mistakeForm.reset();
});

resetDataBtn.addEventListener("click", () => {
  if (confirm("すべてのデータをリセットしますか？")) {
    localStorage.removeItem(STORAGE_KEY);
    const fresh = structuredClone(defaultState);
    state.exam = fresh.exam;
    state.tasks = fresh.tasks;
    state.studyLogs = fresh.studyLogs;
    state.mistakes = fresh.mistakes;
    saveState();
    renderExam();
    renderTasks();
    renderMistakes();
    renderStats();
  }
});

document.getElementById("studyDate").value = getToday();

renderExam();
renderTasks();
renderMistakes();
renderStats();
