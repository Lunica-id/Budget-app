const form = document.getElementById("expense-form");
const list = document.getElementById("expense-list");
const totalDisplay = document.getElementById("total");

let expenses = [];

form.addEventListener("submit", function(e) {
    e.preventDefault();
    const item = document.getElementById("item").value;
    const amount = Number(document.getElementById("amount").value);
    const date = document.getElementById("date").value;

    if (item && !isNaN(amount) && date) {
        const expense = {item, amount, date};
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
    }
});

function updateList() {
    list.innerHTML = "";
    expenses.forEach((e, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="date-table">${e.date}</td>
            <td class="item-table">${e.item}</td>
            <td class="amount-table">$${e.amount.toFixed(2)}</td>
            <td>
                <button onclick="editExpense(${index})" class="edit"><i class="fas fa-edit"></i></button>
                <button onclick="deleteExpense(${index})" class="edit"><i class="fas fa-trash-alt"></i></button>
            </td>
        `;
        list.appendChild(tr);
    });
}

function updateTotal() {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    totalDisplay.textContent = total;
}

function saveToLocalStorage() {
    localStorage.setItem("expenses", JSON.stringify(expenses));
}

function loadFromLocalStorage() {
    const data = localStorage.getItem("expenses");
    if (data) {
        expenses = JSON.parse(data);
        updateList();
        updateTotal();
    }
}

function deleteExpense(index) {
    expenses.splice(index, 1);
    updateList();
    updateTotal();
    saveToLocalStorage();
}

let editingIndex = null;

function editExpense(index) {
    const e = expenses[index];
    document.getElementById("item").value = e.item;
    document.getElementById("amount").value = e.amount;
    document.getElementById("date").value = e.date;
    editingIndex = index;
}

// tab switch
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
    });
});

// generate calendar
const calendarBody = document.getElementById("calendar-body");
const monthYearDisplay = document.getElementById("month-year");
let currentDate = new Date();

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
document.getElementById("prev-month").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth()-1);
    renderCalendar(currentDate);
})
document.getElementById("next-month").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth()+1);
    renderCalendar(currentDate);
})
window.addEventListener("DOMContentLoaded", () => {
    renderCalendar(currentDate);
})

// calculate sum
const detailsContainer = document.getElementById("daily-expense-details");

calendarBody.addEventListener("click", (e) => {
    if (e.target.tagName === "TD" && e.target.textContent !== "") {
        const clickedDay = Number(e.target.textContent);
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
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
});


loadFromLocalStorage();