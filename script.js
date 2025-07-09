const SLOT_MINUTES = 5;
const START_MINUTES = 14 * 60; // 14:00
const END_MINUTES = 26 * 60;   // 02:00 seuraavana päivänä

const TIME_SLOTS = [];
for (let m = START_MINUTES; m <= END_MINUTES; m += SLOT_MINUTES) {
    const hour = Math.floor(m / 60) % 24;
    const minute = m % 60;
    TIME_SLOTS.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
}

const stageOrder = [
    "Kuopio250 Stage",
    "Matkus Stage",
    "Savonia Stage",
    "Väinö Stage"
];

function timeToMinutes(time) {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

function timeToMinutesWithNextDay(endTime, startTime) {
    let end = timeToMinutes(endTime);
    if (end < startTime) {
        end += 24 * 60;
    }
    return end;
}

function createCell(text, className) {
    const cell = document.createElement("div");
    cell.className = className;
    cell.textContent = text;
    return cell;
}

function renderSchedule(dayName) {
    const timeline = document.getElementById("timeline-table");
    timeline.innerHTML = "";

    const dayData = kuopioRockData.find(d => d.paiva === dayName);
    if (!dayData) return;

    // Poimi lavat joita on tänään, säilytä stageOrder-järjestys
    const stagesSet = new Set(dayData.esiintymiset.map(e => e.lava));
    const stagesOrdered = stageOrder.filter(stage => stagesSet.has(stage));

    const colsCount = TIME_SLOTS.length + 1;

    // Aikapalkin otsikko
    timeline.appendChild(createCell("Klo", "header-cell klo"));
    TIME_SLOTS.forEach(slot => {
        const [h, m] = slot.split(":").map(Number);
        const showTime = m === 0 || m === 30;
        const cell = createCell(showTime ? slot : "", "header-cell");
        if (showTime) {
            cell.style.borderLeft = "1px solid #555";
        }
        timeline.appendChild(cell);
    });

    // Lavojen rivit
    stagesOrdered.forEach(stage => {
        timeline.appendChild(createCell(stage, "label-cell"));
        TIME_SLOTS.forEach(() => {
            const cell = document.createElement("div");
            cell.className = "performance-cell";
            timeline.appendChild(cell);
        });
    });

    // Map lavan nimi → rivi
    const stageMap = {};
    stagesOrdered.forEach((stage, idx) => {
        stageMap[stage] = idx;
    });

    const cellWidth = 40;

    // Lisää artistit aikatauluun
    dayData.esiintymiset.forEach(perf => {
        const startMin = timeToMinutes(perf.aika_alku);
        const endMin = timeToMinutesWithNextDay(perf.aika_loppu, startMin);
        const durationMin = endMin - startMin;

        if (durationMin <= 0) return;

        const adjustedStart = startMin < START_MINUTES ? startMin + 1440 : startMin;
        const startIndex = Math.floor((adjustedStart - START_MINUTES) / SLOT_MINUTES);
        if (startIndex < 0 || startIndex >= TIME_SLOTS.length) return;

        const row = stageMap[perf.lava];
        if (row === undefined) return;

        const widthSlots = durationMin / SLOT_MINUTES;
        const allCells = timeline.querySelectorAll(".performance-cell");
        const targetCellIndex = row * TIME_SLOTS.length + startIndex;
        const targetCell = allCells[targetCellIndex];

        if (targetCell) {
            const box = document.createElement("div");
            box.className = "performance-box";
            box.textContent = perf.artisti;
            box.style.width = `${widthSlots * cellWidth - 4}px`;
            targetCell.appendChild(box);
        }
    });
}

// Napit
document.querySelectorAll(".tab-button").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        renderSchedule(btn.dataset.day);
    });
});

// Oletuspäivä
window.addEventListener("DOMContentLoaded", () => renderSchedule("Torstai"));
