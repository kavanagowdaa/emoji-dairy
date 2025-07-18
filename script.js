const apiKey = "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"


const emojiInput = document.getElementById("emoji");
const noteInput = document.getElementById("note");
const saveBtn = document.getElementById("saveBtn");
const calendar = document.getElementById("calendar");
const aiSummary = document.getElementById("aiSummary");

let entries = JSON.parse(localStorage.getItem("moodEntries")) || [];

// Save mood entry
saveBtn.addEventListener("click", async () => {
  const emoji = emojiInput.value;
  const note = noteInput.value.trim();
  const date = new Date().toISOString().split("T")[0];

  // Default AI values if no note
  let aiResponse = { mood: "neutral", advice: "No note entered." };

  if (note) {
    aiResponse = await getMoodAnalysis(note);
  }

  const entry = {
    date,
    emoji,
    note,
    mood: aiResponse.mood,
    advice: aiResponse.advice
  };

  entries.push(entry);
  localStorage.setItem("moodEntries", JSON.stringify(entries));
  renderCalendar();
  updateSummary();
  noteInput.value = "";
});

// OpenAI API integration
async function getMoodAnalysis(note) {
  const prompt = `
You are a helpful mood assistant. Analyze the following diary note and respond in JSON with two fields:

1. "mood": the primary emotion (like happy, sad, anxious, relaxed, etc.)
2. "advice": a short wellness tip

Note: "${note}"

Return in this exact format:
{"mood": "...", "advice": "..."}
`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      })
    });

    const data = await res.json();
    const raw = data.choices[0].message.content;

    // Parse response carefully
    const parsed = JSON.parse(raw);
    if (!parsed.mood || !parsed.advice) throw new Error("Incomplete AI response");

    return parsed;

  } catch (err) {
    console.error("OpenAI API error:", err);
    return { mood: "neutral", advice: "Unable to analyze note today." };
  }
}

// Render calendar view
function renderCalendar() {
  calendar.innerHTML = "";
  entries.forEach(entry => {
    const div = document.createElement("div");
    div.title = `${entry.date}: ${entry.note || "No note"}`;
    div.textContent = entry.emoji;
    calendar.appendChild(div);
  });
}

// Render weekly summary + chart
function updateSummary() {
  const recent = entries.slice(-7); // Last 7 entries
  const moods = recent.map(e => e.mood);
  const labels = recent.map(e => e.date);

  // Count moods
  const moodCount = {};
  moods.forEach(m => {
    moodCount[m] = (moodCount[m] || 0) + 1;
  });

  // Clear previous chart if exists
  const ctx = document.getElementById("moodChart").getContext("2d");
  if (window.moodChartInstance) {
    window.moodChartInstance.destroy();
  }

  // Create new chart
  window.moodChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(moodCount),
      datasets: [{
        label: "Mood Count",
        data: Object.values(moodCount),
        backgroundColor: "#66bb6a"
      }]
    }
  });

  // Build AI text summary
  const summaryText = recent
    .map(e => `📅 ${e.date}: ${e.mood}. Tip: ${e.advice}`)
    .join("\n\n");

  aiSummary.textContent = summaryText || "No mood entries yet.";
}

// Initial render
renderCalendar();
updateSummary();
