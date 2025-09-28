const form = document.getElementById("expense-form");
const list = document.getElementById("expense-list");
const totalDisplay = document.getElementById("total");
const calendarBody = document.getElementById("calendar-body");
const monthYearDisplay = document.getElementById("month-year");
const detailsContainer = document.getElementById("daily-expense-details");

let expenses = [];
let editingIndex = null;
let calendarDate = new Date();
let graphDate = new Date();
let expenseGraph = null;
let categoryGraph = null;

function init() {
    loadFromLocalStorage();
    renderCalendar(calendarDate);
    renderGraph();
    renderCategoryGraph();
    setupEventListeners();
    setupFilterPopup();
}

window.addEventListener("DOMContentLoaded", init);

// Event Listeners
function setupEventListeners() {
    form.addEventListener("submit", handleFormSubmit);

    // import / export
    document.getElementById("export-button").addEventListener("click", downloadBackup);
    document.getElementById("import-button").addEventListener("click", () => {
        document.getElementById("import-file").click();
    });
    document.getElementById("import-file").addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
            uploadBackup(file);
        }
    });

    // moving calender month
    document.getElementById("prev-month").addEventListener("click", () => {
        calendarDate.setMonth(calendarDate.getMonth()-1);
        renderCalendar(calendarDate);
    })
    document.getElementById("next-month").addEventListener("click", () => {
        calendarDate.setMonth(calendarDate.getMonth()+1);
        renderCalendar(calendarDate);
    })

    // moving graph month
    document.getElementById("prev-graph-month").addEventListener("click", ()=> {
        graphDate.setMonth(graphDate.getMonth() -1);
        renderGraph();
        renderCategoryGraph();
    })
    document.getElementById("next-graph-month").addEventListener("click", ()=> {
        graphDate.setMonth(graphDate.getMonth() +1);
        renderGraph();
        renderCategoryGraph();
    })

    // calender click
    calendarBody.addEventListener("click", handleCalendarClick);

    // tab switching
    setupTabSwitching();

    // sort list
    document.getElementById("sort").addEventListener("change", updateList);
}


// Form
function handleFormSubmit(e) {
    e.preventDefault();
    const item = document.getElementById("item").value;
    const amount = Number(document.getElementById("amount").value);
    const date = document.getElementById("date").value;
    const category = document.getElementById("category").value;

    if (item && !isNaN(amount) && date) {
        const expense = {item, amount, date, category};
        if (editingIndex !== null) {
            expenses[editingIndex] = expense;
            editingIndex = null;
        } else {
            expenses.push(expense);
        }
        updateList();
        updateTotal();
        saveToLocalStorage();
        form.reset();
        renderCalendar(calendarDate);
        renderGraph();
    }
}
function editExpense(index) {
    const e = expenses[index];
    document.getElementById("item").value = e.item;
    document.getElementById("amount").value = e.amount;
    document.getElementById("date").value = e.date;
    document.getElementById("category").value = e.category;
    editingIndex = index;
}
function deleteExpense(index) {
    expenses.splice(index, 1);
    updateList();
    updateTotal();
    saveToLocalStorage();
}


// Storage
function loadFromLocalStorage() {
    const data = localStorage.getItem("expenses");
    if (data) {
        expenses = JSON.parse(data);
        updateList();
        updateTotal();
        renderGraph();
    }
}
function saveToLocalStorage() {
    localStorage.setItem("expenses", JSON.stringify(expenses));
}
function downloadBackup() {
    const data = localStorage.getItem("expenses");
    if (!data) {
        alert("No data to back up.");
        return;
    }

    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    const dateStr = new Date().toISOString().split("T")[0]; 
    a.download = `expenses-backup-${dateStr}.json`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
function uploadBackup(file) {
    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const importedData = JSON.parse(e.target.result);

            if (!Array.isArray(importedData)) {
                alert("Invalid backup file.");
                return;
            }

            localStorage.setItem("expenses", JSON.stringify(importedData));
            alert("Backup imported successfully! Reloading...");
            location.reload(); 
        } catch (err) {
            alert("Error reading backup file.");
            console.error(err);
        }
    };

    reader.readAsText(file);
}


// Total
function updateTotal() {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    totalDisplay.textContent = total.toFixed(2);
}


// Tab Switching
function setupTabSwitching() {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.getAttribute('data-tab');

            document.querySelectorAll('.tab-button').forEach(btn =>
                btn.classList.remove('active')
            );
            button.classList.add('active');

            document.querySelectorAll('.tab-panel').forEach(content =>
                content.classList.remove('active-tab')
            );
            document.getElementById(tab).classList.add('active-tab');

            if (tab === 'graph') {
                setTimeout(() => {
                    renderGraph();
                    renderCategoryGraph();
                }, 0);
            }
        });
    });
}


// Graph
function renderGraph() {
    const ctx = document.getElementById("expenseGraph").getContext("2d");
    const {labels, data} = getMonthlyTotals();

    if(expenseGraph) {
        expenseGraph.destroy();
    }

    expenseGraph = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Monthly Expenses',
                data: data,
                backgroundColor: 'rgba(194, 162, 126, 0.7)',
                borderColor: 'rgba(194, 162, 126, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#d1d1d1',
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                },
                x: {
                    ticks: {
                        color: '#d1d1d1'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    const chartMonthYear = document.getElementById("graph-month-year");
    chartMonthYear.textContent = `${graphDate.getFullYear()} / ${graphDate.getMonth()+1}`;
}
function getMonthlyTotals() {
    const monthlyTotals = {};

    const baseDate = new Date(graphDate);
    const monthsToShow = [];
    for (let offset = -1; offset <= 1; offset++) {
        const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + offset, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthsToShow.push(key);
    }

    expenses.forEach(e => {
        const month = e.date.slice(0, 7);
        if (monthsToShow.includes(month)) {
            if (!monthlyTotals[month]) {
                monthlyTotals[month] = 0;
            }
            monthlyTotals[month] += e.amount;
        }
    });

    const labels = monthsToShow;
    const data = monthsToShow.map(month => (monthlyTotals[month] || 0).toFixed(2));

    return { labels, data };
}
function renderCategoryGraph() {
    const ctx = document.getElementById("categoryGraph").getContext("2d");
    const categoryTotals = getCategoryTotals();

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    if (categoryGraph) {
        categoryGraph.destroy();
    }

    categoryGraph = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: generateGraphColours(labels.length),
            }]
        },
        options: {
            cutout: '75%',
            plugins: {
                legend: {
                    labels: {
                        color: '#d1d1d1'
                    }
                }
            }
        }
    });
}
function getCategoryTotals() {
    const categoryTotals = {};
    const month = graphDate.getMonth() +1;
    const year = graphDate.getFullYear();
    const prefix = `${year}-${String(month).padStart(2, "0")}`;

    const monthlyExpenses = expenses.filter(e => e.date.startsWith(prefix));

    monthlyExpenses.forEach(e => {
        const category = e.category || "Other";
        if (!categoryTotals[category]) {
            categoryTotals[category] = 0;
        }
        categoryTotals[category] += e.amount;
    })

    return categoryTotals;
}


// Calendar
function renderCalendar(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    calendarBody.innerHTML = "";

    let row = document.createElement("tr");
    for (let i = 0; i < startDay; i++) {
        row.appendChild(document.createElement("td"));
    }

    
    for (let day = 1;day <= daysInMonth; day++) {
        const cell = document.createElement("td");
        const isoDate = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    
        const totalForDay = expenses
            .filter(e => e.date === isoDate)
            .reduce((sum, e) => sum + e.amount, 0);

        cell.innerHTML = `
            <div class="calendar-day">${day}</div>
            ${totalForDay > 0 ? `<div class="calendar-amount">$${totalForDay.toFixed(2)}</div>` : ""}
        `;

        const hasExpense = expenses.some(e => e.date === isoDate);
        if (hasExpense) {
            cell.classList.add("has-expense");
        }

        row.appendChild(cell);
        if((startDay + day)%7 === 0 || day === daysInMonth) {
            calendarBody.appendChild(row);
            row = document.createElement("tr");
        }
    }
    monthYearDisplay.textContent = `${year} / ${month+1}`;

    const monthStr = String(month + 1).padStart(2, "0");
    const thisMonthExpenses = expenses.filter(e => e.date.startsWith(`${year}-${monthStr}`));
    const sum = thisMonthExpenses.reduce((acc, e) => acc + e.amount, 0);
    document.getElementById("monthly-total").textContent = `Total this month: $${sum.toFixed(2)}`;

}
function handleCalendarClick(e) {
    let cell = e.target.closest("td");
    if (!cell || !cell.classList.contains("has-expense")) return;

    const dayDiv = cell.querySelector(".calendar-day");
    if (!dayDiv) return;
    
    const clickedDay = Number(dayDiv.textContent);
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth() + 1;
    const isoDate = `${year}-${String(month).padStart(2, "0")}-${String(clickedDay).padStart(2, "0")}`;
        
    const dayExpenses = expenses.filter(e => e.date === isoDate);

    if (dayExpenses.length > 0) {
        const html = dayExpenses.map(e =>
            `<div><strong>${e.item}</strong>: $${e.amount.toFixed(2)}</div>`
        ).join("");
        detailsContainer.innerHTML = `<h4>${isoDate}</h4>${html}`;
        detailsContainer.style.display = "block";
    } else {
        detailsContainer.innerHTML = `<p>No expenses on ${isoDate}</p>`;
        detailsContainer.style.display = "block";
    }
    
}


// List
function updateList() {
    const sortType = document.getElementById("sort").value;
    const selectedCategory = document.getElementById("category-filter").value;
    const minAmount = parseFloat(document.getElementById("minAmount").value);
    const maxAmount = parseFloat(document.getElementById("maxAmount").value);
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;

    list.innerHTML = "";

    let sortedExpenses = [...expenses];
    switch (sortType) {
        case "date-asc":
            sortedExpenses.sort((a,b) => new Date(a.date) - new Date(b.date));
            break;
        case "date-desc":
            sortedExpenses.sort((a,b) => new Date(b.date) - new Date(a.date));
            break;
        case "amount-asc":
            sortedExpenses.sort((a,b) => a.amount - b.amount);
            break;
        case "amount-desc":
            sortedExpenses.sort((a,b) => b.amount - a.amount);
            break;
        case "category":
            sortedExpenses.sort((a,b) => a.category.localeCompare(b.category));
            break;
    }

    const filteredExpenses = sortedExpenses.filter(e => {
        if (selectedCategory && e.category !== selectedCategory) return false;
        if (!isNaN(minAmount) && e.amount < minAmount) return false;
        if (!isNaN(maxAmount) && e.amount > maxAmount) return false;
        if (startDate && new Date(e.date) < new Date(startDate)) return false;
        if (endDate && new Date(e.date) > new Date(endDate)) return false;
        return true;
    })

    filteredExpenses.forEach((e, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="date-table">${e.date}</td>
            <td class="item-table">${e.item}</td>
            <td class="amount-table">$${e.amount.toFixed(2)}</td>
            <td class="category-table">${e.category}</td>
            <td>
                <button onclick="editExpense(${index})" class="edit"><i class="fas fa-edit"></i></button>
                <button onclick="deleteExpense(${index})" class="edit"><i class="fas fa-trash-alt"></i></button>
            </td>
        `;
        list.appendChild(tr);
    });
}
/* function setupFilterPopup() {
    const sortBtn = document.getElementById("sort-toggle");
    const filterBtn = document.getElementById("filter-toggle");
    const sortPanel = document.getElementById("sort-panel");
    const filterPanel = document.getElementById("filter-panel");

    sortBtn.addEventListener("click", () => {
        const isOpen = !sortPanel.classList.contains("hidden");
        sortPanel.classList.toggle("hidden", isOpen);
        sortBtn.textContent = isOpen ? "Sort" : "Close";
        filterPanel.classList.add("hidden");
        filterBtn.textContent = "Filter"
    });

    filterBtn.addEventListener("click", () => {
        const isOpen = !filterPanel.classList.contains("hidden");
        filterPanel.classList.toggle("hidden", isOpen);
        filterBtn.textContent = isOpen ? "Filter" : "Close";
        sortPanel.classList.add("hidden");
        sortBtn.textContent = "Sort";
    });

    document.addEventListener("click", (e) => {
        if (!e.target.closest(".controls")) {
            sortPanel.classList.add("hidden");
            filterPanel.classList.add("hidden");
            sortBtn.textContent = "Sort";
            filterBtn.textContent = "Filter";
        }
    });  
} */
function setupFilterPopup() {
    const sortBtn = document.getElementById("sort-toggle");
    const filterBtn = document.getElementById("filter-toggle");
    const sortPanel = document.getElementById("sort-panel");
    const filterPanel = document.getElementById("filter-panel");

    function closeAll() {
        sortPanel.classList.remove("list-popup");
        sortPanel.classList.add("hidden");
        filterPanel.classList.remove("list-popup");
        filterPanel.classList.add("hidden");

        sortBtn.textContent = "Sort";
        filterBtn.textContent = "Filter";

        sortBtn.classList.remove("btn-active");
        sortBtn.classList.add("btn-inactive");
        filterBtn.classList.remove("btn-active");
        filterBtn.classList.add("btn-inactive");
    }

    function togglePanel(panel,btn) {
        const isOpen = panel.classList.contains("list-popup");

        closeAll();

        if (!isOpen) {
            panel.classList.remove("hidden");
            panel.classList.add("list-popup");

            btn.textContent = "Close";
            btn.classList.remove("btn-inactive");
            btn.classList.add("btn-active");
        }
    }

    sortBtn.addEventListener("click", () => {
        togglePanel(sortPanel, sortBtn);
    });

    filterBtn.addEventListener("click", () => {
        togglePanel(filterPanel, filterBtn);
    });

    document.addEventListener("click", (e) => {
        if (!e.target.closest(".controls")) {
            closeAll();
        }
    });
}


// Colour
function generateGraphColours(count) {
    const baseColours = [
        '#ff6385d8', '#36a3ebd8', '#FFCE56d8', '#4BC0C0d8',
        '#9966FFd8', '#FF9F40d8', '#2ecc71d8', '#e74c3cd8',
        '#8e44add8', '#f1c40fd8', '#1abc9cd8', '#7f8c8dd8'
    ];
    const colours = [];
    for (let i = 0; i < count; i++) {
        colours.push(baseColours[i % baseColours.length]);
    }
    return colours;
}