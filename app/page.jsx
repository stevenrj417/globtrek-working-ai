// EXTRA STATE
const [needs, setNeeds] = useState([]);
const [questions, setQuestions] = useState([]);
const [answers, setAnswers] = useState({}); // {budget:"mid", pace:"balanced", ...}

// WHEN CALLING THE API:
const res = await fetch("/api/ai/plan", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ destination, days: d, followUpAnswers: answers })
});
const data = await res.json();

if (data.status === "need_info") {
  setNeeds(data.needs || []);
  setQuestions(data.questions || []);
  setPlan(""); // wait for answers
  return;
}

setNeeds([]);
setQuestions([]);
setPlan(data.plan || "NO PLAN");
