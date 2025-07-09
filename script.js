// Aikaväli: 14:00 - 02:00 (seuraavana päivänä)
// 14:00 = 14*60 = 840, 02:00 + 24h = 26*60 = 1560
// Jako 5 min
const SLOT_MINUTES = 5;
const START_MINUTES = 14 * 60; // 14:00
const END_MINUTES = 26 * 60;   // 02:00 seuraavana päivänä
const TIME_SLOTS = [];

for (let m = START_MINUTES; m <= END_MINUTES; m += SLOT_MINUTES) {
    let hour = Math.floor(m / 60) % 24;
    let minute = m % 60;
    TIME_SLOTS.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
}

// Lavajärjestys
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

// Muutetaan loppuaika mahdollisesti seuraavan päivän puolelle, jos se on pienempi kuin alku
function timeToMinutesWithNextDay(endTime, startTime) {
    let endMinutes = timeToMinutes(endTime);
    if (endMinutes < startTime) {
        endMinutes += 24 * 60;
    }
    return endMinutes;
}

function renderSchedule(dayName) {
    const timeline = document.getElementById("timeline-table");
    timeline.innerHTML = "";

    const dayData = kuopioRockData.find(d => d.paiva === dayName);
    if (!dayData) return;

    // Järjestä lavat oikeaan järjestykseen
    const stagesSet = new Set(dayData.esiintymiset.map(e => e.lava));
    const stagesOrdered = [];

    stageOrder.forEach(stage => {
        if (stagesSet.has(stage)) {
            stagesOrdered.push(stage);
            stagesSet.delete(stage);
        }
    });
    stagesSet.forEach(stage => stagesOrdered.push(stage));

    const colsCount = TIME_SLOTS.length + 1; // label + timeslots

    // Otsikkorivi: "Klo" vasemmassa reunassa ja kellonajat vain tasatunnit ja puolitunnit
    timeline.appendChild(createCell("Klo", "header-cell klo"));
    TIME_SLOTS.forEach((slot, idx) => {
        const [h, m] = slot.split(":").map(Number);
        const isHourOrHalf = m === 0 || m === 30;
        const cell = createCell(isHourOrHalf ? slot : "", "header-cell");
        if (isHourOrHalf) {
            cell.style.borderLeft = "1px solid #555"; // Viiva tasatunneille ja puolille tunneille
        }
        timeline.appendChild(cell);
    });

    // Rivit lavalle (label) ja tyhjät solut
    stagesOrdered.forEach(stage => {
        timeline.appendChild(createCell(stage, "label-cell")); // Nyt lavan nimi näkyy vasemmassa sarakkeessa

        TIME_SLOTS.forEach(() => {
            const cell = document.createElement("div");
            cell.className = "performance-cell";
            timeline.appendChild(cell);
        });
    });

    // Map lava -> rivi indeksi (0-pohjainen)
    const stageMap = {};
    stagesOrdered.forEach((stage, idx) => (stageMap[stage] = idx));

    // Sarakkeen leveys (css:ssä 40px, eli tässä kerrotaan leveys soluilla)
    const cellWidth = 40;

    // Lisää esiintymiset, skaalaa leveys keston mukaan
    dayData.esiintymiset.forEach(perf => {
        const startMinutes = timeToMinutes(perf.aika_alku);
        const endMinutes = timeToMinutesWithNextDay(perf.aika_loppu, startMinutes);
        const durationMinutes = endMinutes - startMinutes;
        if (durationMinutes <= 0) return;

        // Start index TIME_SLOTS: löydä lähin indeksi
        const startIndex = TIME_SLOTS.findIndex(t => {
            const tMin = timeToMinutes(t);
            // Jos t < 14:00, lisää 24h
            let tAdj = tMin;
            if (tMin < START_MINUTES) tAdj += 24*60;
            return tAdj === startMinutes;
        });
        if (startIndex === -1) return;

        const row = stageMap[perf.lava];
        if (row === undefined) return;

        // Laske leveys soluina
        const widthSlots = durationMinutes / SLOT_MINUTES;

        // Lasketaan solujen indeksi: 
        // Ensimmäinen rivi on otsikko, sitten rivit lavalle
        // Jokaisella rivillä on (colsCount) solua, joista ensimmäinen label-cell
        // Indeksi = (rivi * sarakkeet) + sarake
        // performance-cellit alkavat sarakkeesta 1
        const cellIndex = (row + 1) * colsCount + (startIndex + 1);

        const allCells = timeline.querySelectorAll(".performance-cell");
        const cell = allCells[cellIndex - colsCount]; // koska performance-cellit alkavat vasta labelien jälkeen

        if (cell) {
            const box = document.createElement("div");
            box.className = "performance-box";
            box.textContent = perf.artisti;

            box.style.width = `${widthSlots * cellWidth - 4}px`;
            cell.appendChild(box);
        }
    });
}

function createCell(text, className) {
    const cell = document.createElement("div");
    cell.className = className;
    cell.textContent = text;
    return cell;
}

document.querySelectorAll(".tab-button").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        renderSchedule(btn.dataset.day);
    });
});

window.addEventListener("DOMContentLoaded", () => renderSchedule("Torstai"));
