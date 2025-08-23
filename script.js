const form = document.getElementById("expense-form");
const list = document.getElementById("expense-list");
const totalDisplay = document.getElementById("total");

let expenses = [];

form.addEventListener("submit", function(e) {
    e.preventDefault();
    const item = document.getElementById("item").value;
    const amount = Number(document.getElementById("amount").value);
    const date = document.getElementById("date").value;

    if (item && amount && date) {
        const expense = {item, amount, date};
        expenses.push(expense);
        updateList();
        updateTotal();
        saveToLocalStorage();
        form.reset();
    }
});

function updateList() {
    list.innerHTML = "";
    expenses.forEach((e) => {
        const li = document.createElement("li");
        li.textContent = `${e.date} - ${e.item}: $${e.amount}`;
        list.appendChild(li);
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

loadFromLocalStorage();